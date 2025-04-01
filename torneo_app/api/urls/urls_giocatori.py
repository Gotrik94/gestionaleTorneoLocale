from django.urls import path
from api.views.views_giocatori import lista_giocatori, dettaglio_giocatore

urlpatterns = [
    path('', lista_giocatori, name='lista_giocatori'),
    path('<int:giocatore_id>/', dettaglio_giocatore, name='dettaglio_giocatore'),
]
