from django.db import models

class Torneo(models.Model):
    FORMATI_TORNEO = [
        ('DRAFT', 'Draft'),
        ('ARAM', 'ARAM'),
    ]

    id = models.AutoField(primary_key=True)  # ID auto-incrementale
    nome = models.CharField(max_length=100)  # Nome del torneo
    data_inizio = models.DateField()  # Data di inizio
    data_fine = models.DateField()  # Data di fine
    fascia_oraria = models.CharField(max_length=50)  # Fascia oraria es. "18:00 - 22:00"
    formato = models.CharField(max_length=10, choices=FORMATI_TORNEO, default='DRAFT')  # ENUM: 'DRAFT', 'ARAM'
    is_active = models.BooleanField(default=True)  # Stato del torneo (attivo/archiviato)

    def __str__(self):
        return f"{self.nome} ({self.data_inizio.strftime('%d-%m-%Y')} - {self.data_fine.strftime('%d-%m-%Y')}) - {self.formato}"
