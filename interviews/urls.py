from django.urls import path
from . import views
from . import api_views

urlpatterns = [
    # Template views
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('interview/new/', views.new_interview_view, name='new_interview'),
    path('interview/<int:interview_id>/', views.live_interview_view, name='live_interview'),
    
    # API endpoints
    path('api/interviews/start/', api_views.api_start_interview, name='api_start_interview'),
    path('api/interviews/list/', api_views.api_list_interviews, name='api_list_interviews'),
    path('api/interviews/<int:interview_id>/questions/', api_views.api_get_questions, name='api_get_questions'),
    path('api/interviews/<int:interview_id>/converse/', api_views.api_converse, name='api_converse'),
    path('api/interviews/<int:interview_id>/complete/', api_views.api_complete_interview, name='api_complete_interview'),
]
