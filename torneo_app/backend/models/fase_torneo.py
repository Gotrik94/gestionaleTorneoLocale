from django.db import models

from backend.models import Torneo


class FaseTorneo(models.Model):
    torneo = models.ForeignKey(Torneo, on_delete=models.CASCADE, related_name="fasi")
    nome = models.CharField(max_length=50)
    data_inizio = models.DateField()
    data_fine = models.DateField()

    def __str__(self):
        return f"{self.nome} - {self.torneo.nome}"