from django.urls import path
from . import views

urlpatterns = [
    path('', views.leaderboard_view, name='leaderboard'),
    path('api/leaderboard/', views.api_leaderboard, name='api_leaderboard'),
    path('api/leaderboard/skills/', views.api_leaderboard_skills, name='api_leaderboard_skills'),
]
