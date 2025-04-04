# Generated by Django 5.1.6 on 2025-02-15 22:30

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0003_campione_alter_partita_anima_drago_tipo_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='pickbanpartita',
            name='ruolo',
            field=models.CharField(blank=True, choices=[('TOP', 'TOP'), ('JUNGL', 'JUNGL'), ('MID', 'MID'), ('ADC', 'ADC'), ('SUPP', 'SUPP')], max_length=10, null=True),
        ),
        migrations.AlterField(
            model_name='statistichegiocatorepartita',
            name='campione_usato',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='backend.campione'),
        ),
    ]
