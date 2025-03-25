from django.urls import path

from api.views.views_dettaglio_tornei import dettaglio_torneo

urlpatterns = [
    # ... le altre rotte già presenti ...
    path('<int:torneo_id>/', dettaglio_torneo, name='dettaglio_torneo'),
]
