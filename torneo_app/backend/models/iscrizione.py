from django.db import models
from backend.models.squadra import Squadra
from backend.models.torneo import Torneo

class Iscrizione(models.Model):
    id = models.AutoField(primary_key=True)  # ID auto-incrementale
    squadra = models.ForeignKey(Squadra, on_delete=models.CASCADE)
    torneo = models.ForeignKey(Torneo, on_delete=models.CASCADE)
    data_iscrizione = models.DateField(auto_now_add=True)  # Data di iscrizione automatica
    quota_iscrizione = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.squadra.nome} - Torneo: {self.torneo.nome}"
