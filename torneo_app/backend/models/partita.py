from django.db import models

from backend.models import Giocatore
from backend.models.fase_torneo import FaseTorneo
from backend.models.girone import Girone
from backend.models.torneo import Torneo
from backend.models.squadra import Squadra


class Partita(models.Model):
    MODALITA_PARTITA = [
        ('BO1', 'Best of 1'),
        ('BO3', 'Best of 3'),
        ('BO5', 'Best of 5'),
    ]

    ANIMA_DRAGHI = [
        ('INFERNALE', 'INFERNALE'),
        ('MONTAGNA', 'MONTAGNA'),
        ('OCEANO', 'OCEANO'),
        ('ARIA', 'ARIA'),
        ('HEXTECH', 'HEXTECH'),
        ('CHEMTANK', 'CHEMTANK'),
    ]

    FASI_TORNEO = [
        ('Gruppi', 'Gruppi'),
        ('Quarti', 'Quarti'),
        ('Semifinale', 'Semifinale'),
        ('Finale', 'Finale'),
    ]

    ATAKHAN_SIDE = [
        ('BOT', 'BOT'),
        ('TOP', 'TOP'),
    ]

    id = models.AutoField(primary_key=True)  # ID auto-incrementale
    torneo = models.ForeignKey(Torneo, on_delete=models.CASCADE, related_name="partite")  # Relazione con Torneo
    squadra_rossa = models.ForeignKey(Squadra, null=True, blank=True, related_name='partite_rosse',on_delete=models.SET_NULL)
    squadra_blu = models.ForeignKey(Squadra, null=True, blank=True, related_name='partite_blu',on_delete=models.SET_NULL)

    vincitore = models.ForeignKey(Squadra, on_delete=models.SET_NULL, null=True, blank=True,
                                  related_name="partite_vinte")
    mvp = models.ForeignKey(Giocatore, on_delete=models.SET_NULL, related_name="mvp", null=True, blank=True)

    data_evento = models.DateField()  # Data della partita
    durata_minuti = models.IntegerField(null=True, blank=True)  # Durata in minuti

    # Obiettivi di gioco
    draghi_rossa = models.IntegerField(default=0)
    draghi_blu = models.IntegerField(default=0)
    anima_drago_id = models.ForeignKey(Squadra, on_delete=models.SET_NULL, null=True, blank=True,
                                       related_name="anima_drago")
    anima_drago_tipo = models.CharField(max_length=15, choices=ANIMA_DRAGHI, null=True, blank=True)
    drago_anziano_rossa = models.IntegerField(default=0)
    drago_anziano_blu = models.IntegerField(default=0)
    baroni_rossa = models.IntegerField(default=0)
    baroni_blu = models.IntegerField(default=0)
    araldo_rossa = models.IntegerField(default=0)
    araldo_blu = models.IntegerField(default=0)

    # Gestione di Atakhan
    atakhan_taken = models.ForeignKey(Squadra, on_delete=models.SET_NULL, null=True, blank=True,
                                      related_name="atakhan_preso")
    atakhan_side = models.CharField(max_length=15, choices=ATAKHAN_SIDE, null=True, blank=True)

    # Dettagli sulla serie e fase del torneo
    modalita = models.CharField(max_length=3, choices=MODALITA_PARTITA, default='BO1')
    serie_id = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name="serie_partite")
    numero_partita_nella_serie = models.IntegerField(default=1)
    conclusa = models.BooleanField(default=False)
    fase = models.ForeignKey(FaseTorneo, on_delete=models.SET_NULL, null=True, blank=True, related_name="partite_fase")
    girone = models.ForeignKey(Girone, on_delete=models.SET_NULL, null=True, blank=True, related_name="partite_girone")
    round_num = models.IntegerField(default=1)

    def __str__(self):
        nome_rossa = self.squadra_rossa.nome if self.squadra_rossa else "BYE"
        nome_blu = self.squadra_blu.nome if self.squadra_blu else "BYE"
        data_str = self.data_evento.strftime('%d-%m-%Y') if self.data_evento else "Data N/D"
        return f"{self.id} | {self.torneo.nome} | {nome_rossa} vs {nome_blu} - {data_str}"

