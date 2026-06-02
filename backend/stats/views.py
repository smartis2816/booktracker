from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Avg, Sum
from django.db.models.functions import TruncWeek, TruncMonth

from books.models import UserBook, ReadingSession


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stats_view(request):
    user = request.user

    all_user_books = UserBook.objects.filter(
        user=user
    ).select_related('book').prefetch_related('book__authors', 'book__genres')

    total_books = all_user_books.count()
    finished_books = all_user_books.filter(status='finished').count()
    reading_books = all_user_books.filter(status='reading').count()
    want_to_read_books = all_user_books.filter(status='want_to_read').count()

    total_pages_read = all_user_books.filter(
        status='finished'
    ).aggregate(
        total=Sum('book__total_pages')
    )['total'] or 0

    average_rating = all_user_books.filter(
        rating__isnull=False
    ).aggregate(avg=Avg('rating'))['avg']
    average_rating = round(average_rating, 2) if average_rating else None

    genres = all_user_books.filter(
        status='finished',
        book__genres__isnull=False
    ).values(
        'book__genres__name'
    ).annotate(
        count=Count('id')
    ).order_by('-count')

    genres_data = [
        {
            'genre': item['book__genres__name'],
            'count': item['count']
        }
        for item in genres
    ]

    top_authors = all_user_books.filter(
        status='finished'
    ).values(
        'book__authors__name'
    ).annotate(
        books_count=Count('id'),
        avg_rating=Avg('rating')
    ).order_by('-books_count')[:10]

    authors_data = [
        {
            'author': item['book__authors__name'],
            'books_count': item['books_count'],
            'avg_rating': (
                round(item['avg_rating'], 2)
                if item['avg_rating'] else None
            ),
        }
        for item in top_authors
    ]

    monthly_reading = ReadingSession.objects.filter(
        user_book__user=user
    ).annotate(
        month=TruncMonth('date')
    ).values('month').annotate(
        pages=Sum('pages_read'),
        sessions=Count('id')
    ).order_by('month')

    monthly_data = [
        {
            'month': item['month'].strftime('%Y-%m'),
            'pages': item['pages'],
            'sessions': item['sessions'],
        }
        for item in monthly_reading
    ]

    weekly_reading = ReadingSession.objects.filter(
        user_book__user=user
    ).annotate(
        week=TruncWeek('date')
    ).values('week').annotate(
        pages=Sum('pages_read')
    ).order_by('week').reverse()[:12]

    weekly_data = [
        {
            'week': item['week'].strftime('%Y-%m-%d'),
            'pages': item['pages'],
        }
        for item in reversed(list(weekly_reading))
    ]

    sessions = ReadingSession.objects.filter(
        user_book__user=user
    ).select_related(
        'user_book__book'
    ).order_by('-date')[:365]

    calendar = {}
    for session in sessions:
        date_str = session.date.strftime('%Y-%m-%d')
        if date_str not in calendar:
            calendar[date_str] = {
                'date': date_str,
                'pages_read': 0,
                'books': []
            }
        calendar[date_str]['pages_read'] += session.pages_read
        book_title = session.user_book.book.title
        if book_title not in calendar[date_str]['books']:
            calendar[date_str]['books'].append(book_title)

    calendar_data = list(calendar.values())

    return Response({
        'summary': {
            'total_books': total_books,
            'finished_books': finished_books,
            'reading_books': reading_books,
            'want_to_read_books': want_to_read_books,
            'total_pages_read': total_pages_read,
            'average_rating': average_rating,
        },
        'genres': genres_data,
        'top_authors': authors_data,
        'monthly_reading': monthly_data,
        'weekly_reading': weekly_data,
        'calendar': calendar_data,
    })
