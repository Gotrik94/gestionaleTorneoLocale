from django.db import models

from backend.models import Torneo, Squadra
from backend.models.fase_torneo import FaseTorneo
from backend.models.girone import Girone


class ClassificaTorneo(models.Model):
    torneo = models.ForeignKey(Torneo, on_delete=models.CASCADE, related_name="classifica")
    fase = models.ForeignKey(FaseTorneo, on_delete=models.CASCADE, related_name="classifica_fase")
    girone = models.ForeignKey(Girone, on_delete=models.CASCADE, null=True, blank=True, related_name="classifica_girone")
    squadra = models.ForeignKey(Squadra, on_delete=models.CASCADE)
    punti = models.IntegerField(default=0)
    vittorie = models.IntegerField(default=0)
    pareggi = models.IntegerField(default=0)
    sconfitte = models.IntegerField(default=0)

    class Meta:
        unique_together = ('torneo', 'fase', 'girone', 'squadra')

    def __str__(self):
        girone_nome = f"({self.girone.nome})" if self.girone else ""
        return f"{self.squadra.nome} - {self.fase.nome} {girone_nome} - {self.torneo.nome}"
