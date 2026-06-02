import requests
import csv
import io
import os
from html import escape as html_escape
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.http import HttpResponse

from .models import Author, Genre, Book, UserBook, Note, Quote, ReadingSession
from .serializers import (
    BookSerializer,
    UserBookSerializer,
    NoteSerializer,
    QuoteSerializer,
)
from .filters import UserBookFilter


def get_or_create_book(book_data):
    external_id = book_data.get('external_id') or book_data.get('google_books_id')

    if external_id:
        existing_book = Book.objects.filter(external_id=external_id).first()
        if existing_book:
            return existing_book

    book = Book.objects.create(
        title=book_data.get('title', ''),
        description=book_data.get('description', ''),
        total_pages=book_data.get('total_pages'),
        cover_url=book_data.get('cover_url', ''),
        published_year=book_data.get('published_year'),
        external_id=external_id,
    )

    author_raw = book_data.get('author', '')
    if author_raw:
        author_names = [a.strip() for a in author_raw.split(',') if a.strip()]
        for name in author_names:
            author, _ = Author.objects.get_or_create(name=name)
            book.authors.add(author)

    genre_raw = book_data.get('genre', '')
    if genre_raw:
        genre_names = [g.strip() for g in genre_raw.split(',') if g.strip()]
        for name in genre_names:
            genre, _ = Genre.objects.get_or_create(name=name)
            book.genres.add(genre)

    return book

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_books_view(request):
    query = request.query_params.get('q', '')

    if not query:
        return Response(
            {'error': 'Параметр поиска q не передан.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    open_library_url = 'https://openlibrary.org/search.json'
    params = {
        'q': query,
        'limit': 10,
        'fields': (
            'key,title,author_name,subject,'
            'number_of_pages_median,cover_i,first_publish_year'
        )
    }

    try:
        response = requests.get(open_library_url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
    except requests.RequestException:
        return Response(
            {'error': 'Не удалось получить данные от Open Library API.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    books = []
    for item in data.get('docs', []):
        cover_id = item.get('cover_i')
        cover_url = (
            f'https://covers.openlibrary.org/b/id/{cover_id}-M.jpg'
            if cover_id else ''
        )
        books.append({
            'external_id': item.get('key', ''),
            'title': item.get('title', 'Без названия'),
            'author': ', '.join(item.get('author_name', ['Автор неизвестен'])),
            'genre': ', '.join(item.get('subject', [])[:3]),
            'description': '',
            'total_pages': item.get('number_of_pages_median'),
            'cover_url': cover_url,
            'published_year': item.get('first_publish_year'),
        })

    return Response(books)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def user_books_view(request):

    if request.method == 'GET':
        queryset = UserBook.objects.filter(
            user=request.user
        ).select_related('book').prefetch_related(
            'book__authors',
            'book__genres'
        )
        filterset = UserBookFilter(request.query_params, queryset=queryset)
        if filterset.is_valid():
            queryset = filterset.qs
        serializer = UserBookSerializer(queryset, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        book_data = request.data.get('book', {})

        book = get_or_create_book(book_data)

        if UserBook.objects.filter(user=request.user, book=book).exists():
            return Response(
                {'error': 'Эта книга уже есть в вашей библиотеке.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user_book = UserBook.objects.create(
            user=request.user,
            book=book,
            status=request.data.get('status', 'want_to_read')
        )

        return Response(
            UserBookSerializer(user_book).data,
            status=status.HTTP_201_CREATED
        )


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def user_book_detail_view(request, pk):

    user_book = get_object_or_404(UserBook, pk=pk, user=request.user)

    if request.method == 'GET':
        serializer = UserBookSerializer(user_book)
        return Response(serializer.data)

    if request.method == 'PATCH':
        old_page = user_book.current_page

        serializer = UserBookSerializer(
            user_book,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            updated_book = serializer.save()
            new_page = updated_book.current_page

            if new_page > old_page:
                ReadingSession.objects.create(
                    user_book=updated_book,
                    date=timezone.now().date(),
                    pages_read=new_page - old_page
                )

            if (request.data.get('status') == 'reading'
                    and not updated_book.date_started):
                updated_book.date_started = timezone.now().date()
                updated_book.save()

            if (request.data.get('status') == 'finished'
                    and not updated_book.date_finished):
                updated_book.date_finished = timezone.now().date()
                updated_book.save()

            return Response(UserBookSerializer(updated_book).data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    if request.method == 'DELETE':
        user_book.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def notes_view(request, book_pk):
    user_book = get_object_or_404(UserBook, pk=book_pk, user=request.user)

    if request.method == 'GET':
        notes = Note.objects.filter(user_book=user_book)
        serializer = NoteSerializer(notes, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        serializer = NoteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user_book=user_book)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def note_detail_view(request, book_pk, pk):
    user_book = get_object_or_404(UserBook, pk=book_pk, user=request.user)
    note = get_object_or_404(Note, pk=pk, user_book=user_book)

    if request.method == 'PATCH':
        serializer = NoteSerializer(note, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        note.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def quotes_view(request, book_pk):
    user_book = get_object_or_404(UserBook, pk=book_pk, user=request.user)

    if request.method == 'GET':
        quotes = Quote.objects.filter(user_book=user_book)
        serializer = QuoteSerializer(quotes, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        serializer = QuoteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user_book=user_book)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def quote_detail_view(request, book_pk, pk):
    user_book = get_object_or_404(UserBook, pk=book_pk, user=request.user)
    quote = get_object_or_404(Quote, pk=pk, user_book=user_book)
    quote.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_cover_view(request, pk):
    user_book = get_object_or_404(UserBook, pk=pk, user=request.user)
    book = user_book.book

    cover_url = request.data.get('cover_url')
    if cover_url:
        book.cover_url = cover_url
        book.save()
        return Response(
            {'cover_url': book.cover_url},
            status=status.HTTP_200_OK
        )

    cover_file = request.FILES.get('cover')
    if cover_file:

        allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if cover_file.content_type not in allowed_types:
            return Response(
                {'error': 'Допустимые форматы: JPEG, PNG, WebP, GIF'},
                status=status.HTTP_400_BAD_REQUEST
            )

        max_size = 5 * 1024 * 1024
        if cover_file.size > max_size:
            return Response(
                {'error': 'Размер файла не должен превышать 5 МБ'},
                status=status.HTTP_400_BAD_REQUEST
            )

        import os
        import uuid
        from django.conf import settings as django_settings

        covers_dir = os.path.join(django_settings.MEDIA_ROOT, 'covers')
        os.makedirs(covers_dir, exist_ok=True)

        extension = os.path.splitext(cover_file.name)[1].lower()
        unique_filename = f"{uuid.uuid4()}{extension}"
        filepath = os.path.join(covers_dir, unique_filename)

        with open(filepath, 'wb+') as destination:
            for chunk in cover_file.chunks():
                destination.write(chunk)

        if book.cover_url and book.cover_url.startswith('/media/'):
            old_filepath = os.path.join(
                django_settings.MEDIA_ROOT,
                book.cover_url.lstrip('/media/')
            )
            if os.path.exists(old_filepath):
                os.remove(old_filepath)

        book.cover_url = f"{django_settings.MEDIA_URL}covers/{unique_filename}"
        book.save()

        return Response(
            {'cover_url': book.cover_url},
            status=status.HTTP_200_OK
        )

    return Response(
        {'error': 'Не передан файл или URL обложки.'},
        status=status.HTTP_400_BAD_REQUEST
    )

def get_pdf_font():
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from django.conf import settings as django_settings

    font_name = 'DejaVu'

    try:
        pdfmetrics.getFont(font_name)
        return font_name
    except KeyError:
        pass

    font_path = os.path.join(
        str(django_settings.BASE_DIR),
        'fonts',
        'DejaVuSans.ttf'
    )

    if os.path.exists(font_path):
        try:
            pdfmetrics.registerFont(TTFont(font_name, font_path))
            return font_name
        except Exception:
            pass

    return 'Helvetica'


def create_pdf_styles(fn):
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib import colors

    return {
        'title': ParagraphStyle(
            'Title', fontName=fn, fontSize=18, spaceAfter=6,
            textColor=colors.HexColor('#1e3a5f'),
        ),
        'subtitle': ParagraphStyle(
            'Subtitle', fontName=fn, fontSize=9, spaceAfter=16,
            textColor=colors.HexColor('#9ca3af'),
        ),
        'heading': ParagraphStyle(
            'Heading', fontName=fn, fontSize=13,
            spaceBefore=16, spaceAfter=8,
            textColor=colors.HexColor('#1e3a5f'),
        ),
        'body': ParagraphStyle(
            'Body', fontName=fn, fontSize=9, spaceAfter=4,
            textColor=colors.HexColor('#374151'),
        ),
        'small': ParagraphStyle(
            'Small', fontName=fn, fontSize=8, spaceAfter=8,
            textColor=colors.HexColor('#9ca3af'),
        ),
        'quote': ParagraphStyle(
            'Quote', fontName=fn, fontSize=9, spaceAfter=4,
            textColor=colors.HexColor('#374151'),
            leftIndent=12,
        ),
    }

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_library_csv_view(request):
    user_books = UserBook.objects.filter(
        user=request.user
    ).select_related('book').prefetch_related('book__authors', 'book__genres')

    response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
    response['Content-Disposition'] = (
        'attachment; filename="booktracker_library.csv"'
    )

    STATUS_LABELS = {
        'want_to_read': 'Хочу прочитать',
        'reading':      'Читаю',
        'finished':     'Прочитал',
        'dropped':      'Не буду дочитывать',
    }

    writer = csv.writer(response)
    writer.writerow([
        'Название', 'Авторы', 'Жанры', 'Статус',
        'Текущая страница', 'Всего страниц', 'Прогресс (%)',
        'Оценка', 'Отзыв',
        'Дата начала', 'Дата окончания', 'Дата добавления',
    ])

    for ub in user_books:
        authors = ', '.join([a.name for a in ub.book.authors.all()])
        genres  = ', '.join([g.name for g in ub.book.genres.all()])
        writer.writerow([
            ub.book.title,
            authors,
            genres,
            STATUS_LABELS.get(ub.status, ub.status),
            ub.current_page,
            ub.book.total_pages or '',
            ub.progress_percent,
            ub.rating or '',
            ub.review or '',
            ub.date_started.strftime('%d.%m.%Y') if ub.date_started else '',
            ub.date_finished.strftime('%d.%m.%Y') if ub.date_finished else '',
            ub.added_at.strftime('%d.%m.%Y'),
        ])

    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_library_pdf_view(request):
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Table, TableStyle
    )
    from reportlab.lib.units import cm

    fn = get_pdf_font()
    styles = create_pdf_styles(fn)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm,   bottomMargin=2*cm,
    )

    elements = []
    user = request.user

    STATUS_LABELS = {
        'want_to_read': 'Хочу прочитать',
        'reading':      'Читаю',
        'finished':     'Прочитал',
        'dropped':      'Не буду дочитывать',
    }

    elements.append(Paragraph('BookTracker — Библиотека', styles['title']))
    elements.append(Paragraph(
        f'Пользователь: {user.username}  |  '
        f'Дата выгрузки: {timezone.now().strftime("%d.%m.%Y")}',
        styles['subtitle']
    ))

    user_books = UserBook.objects.filter(
        user=user
    ).select_related('book').prefetch_related('book__authors', 'book__genres')

    elements.append(Paragraph(
        f'Всего книг: {user_books.count()}',
        styles['heading']
    ))

    if user_books.exists():
        header = [
            Paragraph('Название',  styles['body']),
            Paragraph('Автор',     styles['body']),
            Paragraph('Статус',    styles['body']),
            Paragraph('Оценка',    styles['body']),
            Paragraph('Прогресс',  styles['body']),
        ]
        rows = [header]

        for ub in user_books:
            authors    = ', '.join([a.name for a in ub.book.authors.all()])
            rating_str = (str(ub.rating) + ' / 5') if ub.rating else '—'
            rows.append([
                Paragraph(html_escape(ub.book.title[:50]), styles['body']),
                Paragraph(html_escape(authors[:35]),       styles['body']),
                Paragraph(STATUS_LABELS.get(ub.status, ub.status), styles['body']),
                Paragraph(rating_str, styles['body']),
                Paragraph(f'{ub.progress_percent}%', styles['body']),
            ])

        table_style = [
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#eff6ff')),
            ('FONTNAME',   (0, 0), (-1, -1), fn),
            ('FONTSIZE',   (0, 0), (-1, -1), 9),
            ('GRID',       (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ('PADDING',    (0, 0), (-1, -1), 5),
            ('VALIGN',     (0, 0), (-1, -1), 'MIDDLE'),
        ]
        for i in range(1, len(rows)):
            if i % 2 == 0:
                table_style.append((
                    'BACKGROUND', (0, i), (-1, i),
                    colors.HexColor('#f9fafb')
                ))

        table = Table(
            rows,
            colWidths=[6.5*cm, 4.5*cm, 3.5*cm, 1.8*cm, 1.7*cm]
        )
        table.setStyle(TableStyle(table_style))
        elements.append(table)
    else:
        elements.append(Paragraph('Библиотека пуста.', styles['body']))

    doc.build(elements)
    buffer.seek(0)

    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = (
        'attachment; filename="booktracker_library.pdf"'
    )
    return response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_notes_csv_view(request):
    notes = Note.objects.filter(
        user_book__user=request.user
    ).select_related('user_book__book').order_by('user_book__book__title')

    quotes = Quote.objects.filter(
        user_book__user=request.user
    ).select_related('user_book__book').order_by('user_book__book__title')

    response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
    response['Content-Disposition'] = (
        'attachment; filename="booktracker_notes.csv"'
    )

    writer = csv.writer(response)

    writer.writerow(['ЗАМЕТКИ'])
    writer.writerow(['Книга', 'Заметка', 'Дата создания', 'Дата изменения'])
    for note in notes:
        writer.writerow([
            note.user_book.book.title,
            note.content,
            note.created_at.strftime('%d.%m.%Y'),
            note.updated_at.strftime('%d.%m.%Y'),
        ])

    writer.writerow([])

    writer.writerow(['ЦИТАТЫ'])
    writer.writerow(['Книга', 'Цитата', 'Страница', 'Дата добавления'])
    for quote in quotes:
        writer.writerow([
            quote.user_book.book.title,
            quote.content,
            quote.page_number or '',
            quote.created_at.strftime('%d.%m.%Y'),
        ])

    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_notes_pdf_view(request):
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer
    )
    from reportlab.lib.units import cm

    fn = get_pdf_font()
    styles = create_pdf_styles(fn)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm,   bottomMargin=2*cm,
    )

    elements = []
    user = request.user

    elements.append(Paragraph('BookTracker — Заметки и цитаты', styles['title']))
    elements.append(Paragraph(
        f'Пользователь: {user.username}  |  '
        f'Дата выгрузки: {timezone.now().strftime("%d.%m.%Y")}',
        styles['subtitle']
    ))

    notes = Note.objects.filter(
        user_book__user=user
    ).select_related('user_book__book').order_by('user_book__book__title')

    if notes.exists():
        elements.append(Paragraph(
            f'Заметки — {notes.count()}',
            styles['heading']
        ))
        for note in notes:
            elements.append(Paragraph(
                f'<b>{html_escape(note.user_book.book.title)}</b>',
                styles['body']
            ))
            elements.append(Paragraph(
                html_escape(note.content),
                styles['quote']
            ))
            elements.append(Paragraph(
                note.created_at.strftime('%d.%m.%Y'),
                styles['small']
            ))
    else:
        elements.append(Paragraph('Заметок нет.', styles['body']))

    quotes = Quote.objects.filter(
        user_book__user=user
    ).select_related('user_book__book').order_by('user_book__book__title')

    if quotes.exists():
        elements.append(Paragraph(
            f'Цитаты — {quotes.count()}',
            styles['heading']
        ))
        for quote in quotes:
            page_info = (
                f' (стр. {quote.page_number})' if quote.page_number else ''
            )
            elements.append(Paragraph(
                f'<b>{html_escape(quote.user_book.book.title)}</b>{page_info}',
                styles['body']
            ))
            elements.append(Paragraph(
                f'«{html_escape(quote.content)}»',
                styles['quote']
            ))
            elements.append(Spacer(1, 0.2*cm))
    else:
        elements.append(Paragraph('Цитат нет.', styles['body']))

    doc.build(elements)
    buffer.seek(0)

    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = (
        'attachment; filename="booktracker_notes.pdf"'
    )
    return response

