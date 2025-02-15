from django.db import models

from .campione import Campione
from backend.models.partita import Partita
from backend.models.squadra import Squadra

class PickBanPartita(models.Model):
    TIPI_PICKBAN = [
        ('pick', 'Pick'),
        ('ban', 'Ban'),
    ]

    RUOLO_LANE =[
        ('TOP','TOP'),
        ('JUNGL', 'JUNGL'),
        ('MID', 'MID'),
        ('ADC', 'ADC'),
        ('SUPP', 'SUPP'),
    ]

    id = models.AutoField(primary_key=True)  # ID auto-incrementale
    partita = models.ForeignKey(Partita, on_delete=models.CASCADE, related_name="pickban")  # Relazione con Partita
    squadra = models.ForeignKey(Squadra, on_delete=models.CASCADE, related_name="pickban_squadra")  # Squadra che ha effettuato il pick/ban
    campione = models.ForeignKey(Campione, on_delete=models.CASCADE)
    tipo = models.CharField(max_length=4, choices=TIPI_PICKBAN)  # ENUM ('pick', 'ban')
    ordine = models.IntegerField()  # Ordine di selezione
    ruolo = models.CharField(max_length=10, choices=RUOLO_LANE,blank=True, null=True)  # Ruolo del campione (opzionale)

    def __str__(self):
        return f"{self.squadra.nome} - {self.tipo.upper()} {self.campione} (Ordine: {self.ordine})"
