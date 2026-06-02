from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator


class Goal(models.Model):

    PERIOD_CHOICES = [
        ('year', 'Год'),
        ('month', 'Месяц'),
    ]

    MEASURE_CHOICES = [
        ('books', 'Книги'),
        ('pages', 'Страницы'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='goals',
        verbose_name='Пользователь'
    )
    period_type = models.CharField(
        max_length=10,
        choices=PERIOD_CHOICES,
        verbose_name='Тип периода'
    )
    measure_type = models.CharField(
        max_length=10,
        choices=MEASURE_CHOICES,
        verbose_name='Единица измерения'
    )
    target = models.IntegerField(
        validators=[MinValueValidator(1)],
        verbose_name='Целевое значение'
    )
    period_start = models.DateField(verbose_name='Начало периода')
    period_end = models.DateField(verbose_name='Конец периода')

    class Meta:
        verbose_name = 'Цель'
        verbose_name_plural = 'Цели'
        ordering = ['-period_start']

    def __str__(self):
        return (
            f'{self.user.username} — '
            f'{self.get_period_type_display()}: '
            f'{self.target} {self.get_measure_type_display()}'
        )
