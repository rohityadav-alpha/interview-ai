"""
WSGI config for interview_ai project.
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'interview_ai.settings')

application = get_wsgi_application()

# Vercel looks for 'app'
app = application
