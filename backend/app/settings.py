"""
Django settings for apidemo project.
Updated for domain: cuuho.vpone.site
"""

import os
from pathlib import Path
from typing import Final
from dotenv import load_dotenv

# ==============================================================================
# 1. CORE SETUP & ENVIRONMENT
# ==============================================================================

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables
load_dotenv()

# Environment setting: 'development' | 'production'
ENV = os.getenv('ENV', 'development')

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = ENV == 'development'

ALLOWED_HOSTS = []
CSRF_TRUSTED_ORIGINS = []


# ==============================================================================
# 2. SECURITY & HOST CONFIGURATION
# ==============================================================================

if ENV == 'production':
    # Domain chính thức và các biến thể
    ALLOWED_HOSTS = os.getenv(
        'ALLOWED_HOSTS', 
        'cuuho.vpone.site,www.cuuho.vpone.site,localhost,127.0.0.1'
    ).split(',')
    
    # BẮT BUỘC cho Django 4.x khi chạy HTTPS
    CSRF_TRUSTED_ORIGINS = [
        'https://cuuho.vpone.site', 
        'https://www.cuuho.vpone.site'
    ]
    
    # Để Django hiểu request từ Nginx là HTTPS
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    
    # CORS: Chỉ cho phép frontend production gọi API
    CORS_ALLOWED_ORIGINS = os.getenv(
        'CORS_ALLOWED_ORIGINS', 
        'https://cuuho.vpone.site,https://www.cuuho.vpone.site'
    ).split(',')
    CORS_ALLOW_ALL_ORIGINS = False

else:
    # Development settings
    ALLOWED_HOSTS = ["*"]
    CSRF_TRUSTED_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]
    CORS_ALLOW_ALL_ORIGINS = True

# Cho phép gửi cookie/token (Quan trọng cho đăng nhập)
CORS_ALLOW_CREDENTIALS = True


# ==============================================================================
# 3. INSTALLED APPS & MIDDLEWARE
# ==============================================================================

INSTALLED_APPS = [
    'daphne',
    'channels',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'app.app.AppConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'app.urls'
WSGI_APPLICATION = 'app.wsgi.application'
ASGI_APPLICATION = 'app.asgi.application'


# ==============================================================================
# 4. TEMPLATES
# ==============================================================================

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]


# ==============================================================================
# 5. DATABASES
# ==============================================================================

DATABASES = {
    'default': {
        'ENGINE': os.getenv('DB_ENGINE', 'django.db.backends.postgresql'),
        'NAME': os.getenv('DB_NAME', 'rescue_db'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'postgres'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}

# GDAL CONFIGURATION (Windows Local Dev Only)
if os.name == 'nt':
    OSGEO_PATH = r"C:\Users\VanPhuc\AppData\Local\Programs\Python\Python39\Lib\site-packages\osgeo"
    if os.path.exists(OSGEO_PATH):
        GDAL_LIBRARY_PATH = os.path.join(OSGEO_PATH, 'gdal.dll')
        GEOS_LIBRARY_PATH = os.path.join(OSGEO_PATH, 'geos_c.dll')
        os.environ['PATH'] = OSGEO_PATH + ';' + os.environ['PATH']


# ==============================================================================
# 6. AUTHENTICATION & PASSWORD
# ==============================================================================

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Custom JWT Settings
JWT_SECRET: Final[str] = os.getenv('JWT_SECRET', 'change-me')
JWT_ALGORITHM: Final[str] = os.getenv('JWT_ALGORITHM', 'HS256')
ACCESS_EXPIRE_MINUTES: Final[int] = int(os.getenv('ACCESS_EXPIRE_MINUTES', '60'))
REFRESH_EXP_DAYS: Final[int] = int(os.getenv('REFRESH_EXPIRE_DAYS', '7'))

# Google Auth
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')


# ==============================================================================
# 7. INTERNATIONALIZATION
# ==============================================================================

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# ==============================================================================
# 8. STATIC & MEDIA FILES (AWS S3 vs LOCAL)
# ==============================================================================

STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

USE_CLOUD = os.getenv('USE_CLOUD', 'False') == 'True'

if USE_CLOUD:
    # Cấu hình AWS S3 (Production)
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME')
    AWS_S3_REGION_NAME = 'ap-southeast-1'
    AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
    
    MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'
    
    STORAGES = {
        "default": {"BACKEND": "storages.backends.s3boto3.S3Boto3Storage"},
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    }
else:
    # Cấu hình Local
    MEDIA_URL = '/media/'
    MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
    
    STORAGES = {
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    }


# ==============================================================================
# 9. CHANNELS (WEBSOCKET) & CELERY
# ==============================================================================

REDIS_HOST = os.environ.get('REDIS_HOST', '127.0.0.1')
REDIS_PORT = os.environ.get('REDIS_PORT', '6379')
REDIS_URL = f'redis://{REDIS_HOST}:{REDIS_PORT}/0'

# Channels Configuration
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [(REDIS_HOST, int(REDIS_PORT))],
        },
    },
}

# Celery Configuration
CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', REDIS_URL)
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', REDIS_URL)


# ==============================================================================
# 10. LOGGING
# ==============================================================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'app': { 
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}