from django.db import models

from backend.models.fase_torneo import FaseTorneo


class Girone(models.Model):
    fase = models.ForeignKey(FaseTorneo, on_delete=models.CASCADE, related_name="gironi")
    nome = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.nome} - {self.fase.nome} ({self.fase.torneo.nome})"