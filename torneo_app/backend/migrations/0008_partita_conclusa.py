# Generated by Django 5.1.6 on 2025-02-17 07:22

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0007_alter_partita_durata_minuti'),
    ]

    operations = [
        migrations.AddField(
            model_name='partita',
            name='conclusa',
            field=models.BooleanField(default=False),
        ),
    ]
