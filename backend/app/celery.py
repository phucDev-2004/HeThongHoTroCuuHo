import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')

app = Celery('app') # Sửa tên project

# Load config từ settings.py (những dòng bắt đầu bằng CELERY_)
app.config_from_object('django.conf:settings', namespace='CELERY')

# Tự động tìm task trong các app con (app/tasks.py)
app.autodiscover_tasks()