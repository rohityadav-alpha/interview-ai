from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', TemplateView.as_view(template_name='landing.html'), name='landing'),
    path('accounts/', include('accounts.urls')),
    path('', include('interviews.urls')),
    path('leaderboard/', include('leaderboard.urls')),
    path('reports/', include('reports.urls')),
]
