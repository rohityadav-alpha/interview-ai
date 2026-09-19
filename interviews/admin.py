from django.contrib import admin
from .models import Interview, InterviewResponse


@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'skill', 'difficulty', 'total_score', 'avg_score', 'is_completed', 'created_at')
    list_filter = ('skill', 'difficulty', 'is_completed')
    search_fields = ('user__username', 'user__email', 'skill')


@admin.register(InterviewResponse)
class InterviewResponseAdmin(admin.ModelAdmin):
    list_display = ('id', 'interview', 'question_number', 'ai_score', 'created_at')
    list_filter = ('ai_score',)
    search_fields = ('question', 'user_answer')
