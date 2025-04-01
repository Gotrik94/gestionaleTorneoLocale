from django.urls import path
from api.views.views_iscrizione import lista_iscrizioni, dettaglio_iscrizione

urlpatterns = [
    path('', lista_iscrizioni, name='lista_iscrizioni'),
    path('<int:iscrizione_id>/', dettaglio_iscrizione, name='dettaglio_iscrizione'),
]
