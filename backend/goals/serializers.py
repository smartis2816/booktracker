from rest_framework import serializers
from django.utils import timezone
from .models import Goal


class GoalSerializer(serializers.ModelSerializer):

    current_value = serializers.SerializerMethodField()
    progress_percent = serializers.SerializerMethodField()

    class Meta:
        model = Goal
        fields = (
            'id',
            'period_type',
            'measure_type',
            'target',
            'period_start',
            'period_end',
            'current_value',
            'progress_percent',
        )

    def get_current_value(self, obj):
        user = self.context['request'].user

        if obj.measure_type == 'books':
            from books.models import UserBook

            count = UserBook.objects.filter(
                user=user,
                status='finished',
                date_finished__gte=obj.period_start,
                date_finished__lte=obj.period_end,
            ).count()
            return count

        if obj.measure_type == 'pages':
            from books.models import ReadingSession
            from django.db.models import Sum

            result = ReadingSession.objects.filter(
                user_book__user=user,
                date__gte=obj.period_start,
                date__lte=obj.period_end,
            ).aggregate(total=Sum('pages_read'))

            return result['total'] or 0

        return 0


    def get_progress_percent(self, obj):
        current = self.get_current_value(obj)
        if obj.target and obj.target > 0:
            percent = round((current / obj.target) * 100, 1)
            return min(percent, 100.0)
        return 0

    def validate(self, data):
        period_start = data.get(
            'period_start',
            getattr(self.instance, 'period_start', None)
        )
        period_end = data.get(
            'period_end',
            getattr(self.instance, 'period_end', None)
        )

        if period_start and period_end:
            if period_start >= period_end:
                raise serializers.ValidationError({
                    'period_end': 'Дата окончания должна быть позже даты начала.'
                })
        return data

