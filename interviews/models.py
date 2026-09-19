from django.db import models
from django.conf import settings


class Interview(models.Model):
    """Represents a complete interview session"""
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='interviews'
    )
    skill = models.CharField(max_length=100)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='medium')
    total_score = models.IntegerField(default=0)
    avg_score = models.DecimalField(max_digits=4, decimal_places=2, default=0.00)
    questions_attempted = models.IntegerField(default=0)
    interview_duration = models.IntegerField(default=0)  # in seconds
    is_completed = models.BooleanField(default=False, db_index=True)
    improvements = models.TextField(blank=True, null=True)
    confidence_tips = models.TextField(blank=True, null=True)
    strengths = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.skill + ' - ' + self.difficulty + ' (' + str(self.user.username) + ')'

    class Meta:
        db_table = 'interviews'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_completed']),
        ]


class InterviewResponse(models.Model):
    """Represents a single question-answer pair in an interview"""
    interview = models.ForeignKey(
        Interview,
        on_delete=models.CASCADE,
        related_name='responses'
    )
    question_number = models.IntegerField()
    question = models.TextField()
    user_answer = models.TextField(blank=True, null=True)
    ai_score = models.IntegerField(blank=True, null=True)
    ai_feedback = models.TextField(blank=True, null=True)
    strengths = models.TextField(blank=True, null=True)
    improvements = models.TextField(blank=True, null=True)
    confidence_tips = models.TextField(blank=True, null=True)
    time_taken = models.IntegerField(blank=True, null=True)  # in seconds
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return 'Q' + str(self.question_number) + ' - ' + str(self.interview)

    class Meta:
        db_table = 'interview_responses'
        ordering = ['question_number']
        indexes = [
            models.Index(fields=['interview']),
        ]
