from django.db import models

from .campione import Campione
from backend.models.partita import Partita
from backend.models.giocatore import Giocatore

class StatisticheGiocatorePartita(models.Model):
    id = models.AutoField(primary_key=True)  # ID auto-incrementale
    partita = models.ForeignKey(Partita, on_delete=models.CASCADE, related_name="statistiche_giocatori")
    giocatore = models.ForeignKey(Giocatore, on_delete=models.CASCADE, related_name="statistiche")
    campione_usato = models.ForeignKey(Campione, on_delete=models.CASCADE)
    kills = models.IntegerField(default=0)
    deaths = models.IntegerField(default=0)
    assists = models.IntegerField(default=0)
    danni_totali_campioni = models.IntegerField(default=0)
    danni_presi_totali = models.IntegerField(default=0)
    cure_totali = models.IntegerField(default=0)
    oro_totale = models.IntegerField(default=0)
    torri_distrutte = models.IntegerField(default=0)
    inibitori_distrutti = models.IntegerField(default=0)
    danni_obbiettivi = models.IntegerField(default=0)
    minion_kill = models.IntegerField(default=0)
    mostri_uccisi = models.IntegerField(default=0)
    wards_piazzate = models.IntegerField(default=0)
    wards_distrutte = models.IntegerField(default=0)
    punteggio_visione = models.IntegerField(default=0)
    primo_sangue = models.BooleanField(default=False)
    serie_piu_lunga = models.IntegerField(default=0)
    maggiore_uccisione_multipla = models.IntegerField(default=0)

    def __str__(self):
        return f"Stats {self.giocatore} - Partita {self.partita}"
