from django.urls import path
from api.views.views_partite import lista_partite, dettaglio_partita

urlpatterns = [
    path('', lista_partite, name='lista_partite'),
    path('<int:partita_id>/', dettaglio_partita, name='dettaglio_partita'),
]
