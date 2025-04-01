from django.contrib import admin

from backend.models.classifica_torneo import ClassificaTorneo
from backend.models.fase_torneo import FaseTorneo
from backend.models.girone import Girone
from backend.models.torneo import Torneo
from backend.models.squadra import Squadra
from backend.models.giocatore import Giocatore
from backend.models.partita import Partita
from backend.models.statistiche_giocatore_partita import StatisticheGiocatorePartita
from backend.models.nota_partita import NotaPartita
from backend.models.pickban import PickBanPartita
from backend.models.iscrizione import Iscrizione
from backend.models.campione import Campione

# Registra i modelli nell'admin
admin.site.register(Torneo)
admin.site.register(Squadra)
admin.site.register(Giocatore)
admin.site.register(Partita)
admin.site.register(StatisticheGiocatorePartita)
admin.site.register(NotaPartita)
admin.site.register(PickBanPartita)
admin.site.register(Iscrizione)
admin.site.register(Campione)
admin.site.register(Girone)
admin.site.register(FaseTorneo)
admin.site.register(ClassificaTorneo)
