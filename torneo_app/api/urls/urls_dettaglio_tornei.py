from django.urls import path
from api.views.views_dettaglio_tornei import (
    dettaglio_torneo,
    api_dettaglio_torneo,
    salva_bracket
)

urlpatterns = [
    # rotta già presente per il render HTML
    path('<int:torneo_id>/', dettaglio_torneo, name='dettaglio_torneo'),

    # nuove rotte API REST
    path('<int:torneo_id>/dettaglio/', api_dettaglio_torneo, name='api_dettaglio_torneo'),
    path('fase/<int:fase_id>/salva_bracket/', salva_bracket, name='salva_bracket'),
]
