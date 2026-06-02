from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Goal
from .serializers import GoalSerializer


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def goals_view(request):
    if request.method == 'GET':
        goals = Goal.objects.filter(user=request.user)
        serializer = GoalSerializer(
            goals,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)

    if request.method == 'POST':
        serializer = GoalSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def goal_detail_view(request, pk):
    goal = get_object_or_404(Goal, pk=pk, user=request.user)

    if request.method == 'GET':
        serializer = GoalSerializer(
            goal,
            context={'request': request}
        )
        return Response(serializer.data)

    if request.method == 'PATCH':
        serializer = GoalSerializer(
            goal,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    if request.method == 'DELETE':
        goal.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
