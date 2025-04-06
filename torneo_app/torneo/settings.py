import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEBUG = True
ALLOWED_HOSTS = ["*"]  # Accetta connessioni locali

SECRET_KEY = "DJANGO_DRF_RULES_3729645730#!954#8E$$"  # Chiave per uso locale

ROOT_URLCONF = "torneo.urls"

# Configurazione Static Files
STATIC_URL = "/modules/"
STATICFILES_DIRS = [
    BASE_DIR / "frontend/templates/modules",
]
# Applicazioni installate
INSTALLED_APPS = [
    "django.contrib.admin",  # Deve essere presente
    "django.contrib.auth",  # Gestione utenti e permessi
    "django.contrib.contenttypes",  # Supporto per tipi di contenuto
    "django.contrib.sessions",  # Gestione sessioni
    "django.contrib.messages",  # Sistema di messaggi
    "django.contrib.staticfiles",  # Gestione file statici
    "django.contrib.humanize",

    "rest_framework",  # Django REST Framework
    "backend",  # La nostra app backend
    "api",  # La nostra app API
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",  # ✅ Aggiunto (Obbligatorio per Admin)
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",  # ✅ Aggiunto (Obbligatorio per Admin)
    "django.contrib.messages.middleware.MessageMiddleware",  # ✅ Aggiunto (Obbligatorio per Admin)
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# Configurazione Template
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "frontend/templates"],  # Percorso dei template
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',  # Usa SQLite
        'NAME': BASE_DIR / "db.sqlite3",  # Percorso del database
    }
}

# Imposta il tipo di chiave primaria predefinita per i modelli
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        # Log di Django
        'django': {
            'handlers': ['console'],
            'level': 'INFO',     # se vuoi vedere i 'INFO' e superiori
        },
        # Log del tuo file views_dettaglio_tornei
        'views_dettaglio_tornei': {
            'handlers': ['console'],
            'level': 'DEBUG',    # se vuoi anche i debug
            'propagate': False,
        },
        # Se stai usando `logger = logging.getLogger(__name__)`
        # e __name__ = 'api.views.views_dettaglio_tornei' allora devi mettere quella string
        'api.views.views_dettaglio_tornei': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    }
}