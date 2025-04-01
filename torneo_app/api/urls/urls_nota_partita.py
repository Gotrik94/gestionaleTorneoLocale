from django.urls import path
from api.views.views_nota_partita import lista_note, dettaglio_nota

urlpatterns = [
    path('', lista_note, name='lista_note'),
    path('<int:nota_id>/', dettaglio_nota, name='dettaglio_nota'),
]
