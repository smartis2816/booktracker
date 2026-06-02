from rest_framework import serializers
from .models import Author, Genre, Book, UserBook, Note, Quote, ReadingSession


class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Author
        fields = ('id', 'name')


class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ('id', 'name')


class BookSerializer(serializers.ModelSerializer):
    authors = AuthorSerializer(many=True, read_only=True)
    genres = GenreSerializer(many=True, read_only=True)

    class Meta:
        model = Book
        fields = (
            'id',
            'title',
            'authors',
            'genres',
            'description',
            'total_pages',
            'cover_url',
            'published_year',
            'external_id',
        )


class UserBookSerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)
    progress_percent = serializers.ReadOnlyField()

    class Meta:
        model = UserBook
        fields = (
            'id',
            'book',
            'status',
            'current_page',
            'progress_percent',
            'rating',
            'review',
            'date_started',
            'date_finished',
            'added_at',
        )

    def validate(self, data):
        book = self.instance.book if self.instance else None
        current_page = data.get('current_page', 0)
        if book and book.total_pages and current_page > book.total_pages:
            raise serializers.ValidationError({
                'current_page': (
                    f'Текущая страница ({current_page}) не может превышать '
                    f'общее количество страниц ({book.total_pages}).'
                )
            })
        return data


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ('id', 'content', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')


class QuoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quote
        fields = ('id', 'content', 'page_number', 'created_at')
        read_only_fields = ('created_at',)


class ReadingSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReadingSession
        fields = ('id', 'date', 'pages_read')
