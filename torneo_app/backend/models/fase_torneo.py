from django.db import models

from backend.models import Torneo


class FaseTorneo(models.Model):

    TIPOLOGIE = [
        ('GRUPPI', 'Gironi'),
        ('ELIMINAZIONE_DIRETTA', 'Eliminazione diretta'),
        ('DOPPIA_ELIMINAZIONE', 'Doppia eliminazione'),
        ('ROUND_ROBIN', 'Round Robin'),
        ('KING_OF_THE_HILL', 'King of the Hill'),
        ('CAMPIONATO', 'Campionato a punti'),
        ('ALTRO', 'Altro'),
    ]

    torneo = models.ForeignKey(Torneo, on_delete=models.CASCADE, related_name="fasi")
    nome = models.CharField(max_length=50)
    data_inizio = models.DateField()
    data_fine = models.DateField()
    tipologia = models.CharField(
        max_length=30,
        choices=TIPOLOGIE,
        default='ALTRO'
    )
    bracket_confermato = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.nome} - {self.torneo.nome} : ({self.tipologia})"