from django.urls import path
from . import views

urlpatterns = [
    path('<int:interview_id>/', views.report_detail_view, name='report_detail'),
    path('api/reports/<int:interview_id>/', views.api_report_detail, name='api_report_detail'),
]
