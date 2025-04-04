# Generated by Django 5.1.6 on 2025-03-25 16:43

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0013_remove_partita_fase_torneo'),
    ]

    operations = [
        migrations.CreateModel(
            name='ClassificaTorneo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('punti', models.IntegerField(default=0)),
                ('vittorie', models.IntegerField(default=0)),
                ('pareggi', models.IntegerField(default=0)),
                ('sconfitte', models.IntegerField(default=0)),
                ('fase', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='classifica_fase', to='backend.fasetorneo')),
                ('girone', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='classifica_girone', to='backend.girone')),
                ('squadra', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='backend.squadra')),
                ('torneo', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='classifica', to='backend.torneo')),
            ],
            options={
                'unique_together': {('torneo', 'fase', 'girone', 'squadra')},
            },
        ),
    ]
