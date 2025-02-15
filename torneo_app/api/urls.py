from django.urls import path, include

urlpatterns = [
    path('tornei/', include('api.urls.urls_tornei')),
    path('squadre/', include('api.urls.urls_squadre')),
    path('giocatori/', include('api.urls.urls_giocatori')),
    path('partite/', include('api.urls.urls_partite')),
    path('pickban/', include('api.urls.urls_pickban')),
    path('nota_partita/', include('api.urls.urls_nota_partita')),
    path('statistiche_giocatore_partita/', include('api.urls.urls_statistiche_giocatore_partita')),
    path('iscrizioni/', include('api.urls.urls_iscrizione')),
]
