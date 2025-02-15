from django.db import models
from backend.models.squadra import Squadra  # Import del modello Squadra

class Giocatore(models.Model):
    id = models.AutoField(primary_key=True)  # ID auto-incrementale
    nome = models.CharField(max_length=100)  # Nome del giocatore
    squadra = models.ForeignKey(Squadra, on_delete=models.CASCADE, related_name="giocatori")  # Relazione con Squadra
    data_iscrizione = models.DateField()  # Data di iscrizione al circuito
    is_active = models.BooleanField(default=True)  # Stato del giocatore (attivo/ritirato)

    def __str__(self):
        return f"{self.nome} - {self.squadra.nome}"
