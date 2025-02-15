from django.urls import path
from api.views.views_statistiche_giocatore_partita import lista_statistiche, dettaglio_statistica

urlpatterns = [
    path('', lista_statistiche, name='lista_statistiche'),
    path('<int:statistica_id>/', dettaglio_statistica, name='dettaglio_statistica'),
]
