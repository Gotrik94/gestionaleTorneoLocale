from django.urls import path

from api.views.views_dettaglio_squadre import dettaglio_squadra

urlpatterns = [
    # ... le altre rotte già presenti ...
    path('<int:squadra_id>/', dettaglio_squadra, name='dettaglio_squadra'),
]
