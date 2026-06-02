from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Author(models.Model):
    name = models.CharField(
        max_length=500,
        unique=True,
        verbose_name='Имя автора'
    )

    class Meta:
        verbose_name = 'Автор'
        verbose_name_plural = 'Авторы'
        ordering = ['name']

    def __str__(self):
        return self.name


class Genre(models.Model):
    name = models.CharField(
        max_length=255,
        unique=True,
        verbose_name='Жанр'
    )

    class Meta:
        verbose_name = 'Жанр'
        verbose_name_plural = 'Жанры'
        ordering = ['name']

    def __str__(self):
        return self.name


class Book(models.Model):
    title = models.CharField(
        max_length=500,
        verbose_name='Название'
    )
    authors = models.ManyToManyField(
        Author,
        related_name='books',
        verbose_name='Авторы'
    )
    genres = models.ManyToManyField(
        Genre,
        related_name='books',
        blank=True,
        verbose_name='Жанры'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Описание'
    )
    total_pages = models.IntegerField(
        blank=True,
        null=True,
        validators=[MinValueValidator(1)],
        verbose_name='Количество страниц'
    )
    cover_url = models.URLField(
        blank=True,
        null=True,
        verbose_name='Обложка'
    )
    published_year = models.IntegerField(
        blank=True,
        null=True,
        verbose_name='Год публикации'
    )
    external_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        unique=True,
        verbose_name='Внешний ID'
    )

    class Meta:
        verbose_name = 'Книга'
        verbose_name_plural = 'Книги'

    def __str__(self):
        authors = ', '.join([a.name for a in self.authors.all()])
        return f'{self.title} — {authors}'


class UserBook(models.Model):

    STATUS_CHOICES = [
        ('want_to_read', 'Хочу прочитать'),
        ('reading', 'Читаю'),
        ('finished', 'Прочитал'),
        ('dropped', 'Не буду дочитывать'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='user_books',
        verbose_name='Пользователь'
    )
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        related_name='user_books',
        verbose_name='Книга'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='want_to_read',
        verbose_name='Статус'
    )
    current_page = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name='Текущая страница'
    )
    rating = models.IntegerField(
        blank=True,
        null=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Оценка (1–5)'
    )
    review = models.TextField(
        blank=True,
        null=True,
        verbose_name='Отзыв'
    )
    date_started = models.DateField(
        blank=True,
        null=True,
        verbose_name='Дата начала чтения'
    )
    date_finished = models.DateField(
        blank=True,
        null=True,
        verbose_name='Дата окончания чтения'
    )
    added_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата добавления'
    )

    class Meta:
        verbose_name = 'Книга пользователя'
        verbose_name_plural = 'Книги пользователей'
        unique_together = ('user', 'book')

    def __str__(self):
        return f'{self.user.username} — {self.book.title}'

    @property
    def progress_percent(self):
        if self.book.total_pages and self.book.total_pages > 0:
            return round((self.current_page / self.book.total_pages) * 100, 1)
        return 0


class Note(models.Model):
    
    user_book = models.ForeignKey(
        UserBook,
        on_delete=models.CASCADE,
        related_name='notes',
        verbose_name='Книга пользователя'
    )
    content = models.TextField(verbose_name='Текст заметки')
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата изменения'
    )

    class Meta:
        verbose_name = 'Заметка'
        verbose_name_plural = 'Заметки'
        ordering = ['-created_at']

    def __str__(self):
        return f'Заметка к "{self.user_book.book.title}"'


class Quote(models.Model):
    user_book = models.ForeignKey(
        UserBook,
        on_delete=models.CASCADE,
        related_name='quotes',
        verbose_name='Книга пользователя'
    )
    content = models.TextField(verbose_name='Текст цитаты')
    page_number = models.IntegerField(
        blank=True,
        null=True,
        validators=[MinValueValidator(1)],
        verbose_name='Номер страницы'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )

    class Meta:
        verbose_name = 'Цитата'
        verbose_name_plural = 'Цитаты'
        ordering = ['-created_at']

    def __str__(self):
        return f'Цитата из "{self.user_book.book.title}"'


class ReadingSession(models.Model):
    user_book = models.ForeignKey(
        UserBook,
        on_delete=models.CASCADE,
        related_name='reading_sessions',
        verbose_name='Книга пользователя'
    )
    date = models.DateField(verbose_name='Дата сессии')
    pages_read = models.IntegerField(
        validators=[MinValueValidator(1)],
        verbose_name='Прочитано страниц'
    )

    class Meta:
        verbose_name = 'Сессия чтения'
        verbose_name_plural = 'Сессии чтения'
        ordering = ['-date']

    def __str__(self):
        return (
            f'{self.user_book.user.username} — '
            f'{self.user_book.book.title} — {self.date}'
        )
