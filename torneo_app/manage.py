#!/usr/bin/env python
import os
import sys

def main():
    """Punto di ingresso principale per Django"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'torneo.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Non riesco a importare Django. Assicurati che sia installato e che il virtual environment sia attivo."
        ) from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
