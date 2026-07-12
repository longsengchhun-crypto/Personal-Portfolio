"""
WSGI config for config project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/wsgi/
"""

import os
from pathlib import Path

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = get_wsgi_application()
app = application


def ensure_vercel_runtime_database():
    if os.getenv("VERCEL") != "1":
        return

    from django.conf import settings
    from django.core.management import call_command
    from django.db import connection

    database_name = Path(settings.DATABASES["default"]["NAME"])
    database_name.parent.mkdir(parents=True, exist_ok=True)
    settings.MEDIA_ROOT.mkdir(parents=True, exist_ok=True)

    needs_setup = not database_name.exists()
    if not needs_setup:
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1 FROM portfolio_project LIMIT 1")
        except Exception:
            needs_setup = True

    if needs_setup:
        call_command("migrate", interactive=False, verbosity=0)
        call_command("import_poster_artwork", verbosity=0)


ensure_vercel_runtime_database()
