from django.db import models
from backend.models.partita import Partita

class NotaPartita(models.Model):
    id = models.AutoField(primary_key=True)  # ID auto-incrementale
    partita = models.ForeignKey(Partita, on_delete=models.CASCADE, related_name="note")  # Relazione con Partita
    data_creazione = models.DateTimeField(auto_now_add=True)  # Data e ora della nota (inserita automaticamente)
    testo = models.TextField()  # Contenuto della nota

    def __str__(self):
        return f"Nota per {self.partita} - {self.data_creazione.strftime('%d-%m-%Y %H:%M:%S')}"
