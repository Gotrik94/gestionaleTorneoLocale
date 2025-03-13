from django.urls import path
from api.views.views_squadre import lista_squadre, dettaglio_squadra

urlpatterns = [
    path('', lista_squadre, name='lista_squadre'),
    path('<int:squadra_id>/', dettaglio_squadra, name='dettaglio_squadra'),
]
