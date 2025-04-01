from django.urls import path
from api.views.views_partite import lista_partite, dettaglio_partita, calendar_schedule_partita

urlpatterns = [
    path('', lista_partite, name='lista_partite'),
    path('<int:partita_id>/', dettaglio_partita, name='dettaglio_partita'),
    path("calendar_schedule_partita", calendar_schedule_partita, name="calendar_schedule_partita"),
]
