from django.urls import path
from api.views.views_tornei import lista_tornei, dettaglio_torneo, calendar_schedule_tornei, elimina_torneo

urlpatterns = [
    path('', lista_tornei, name='lista_tornei'),         # GET: /api/tornei/  | POST: /api/tornei/
    path('<int:torneo_id>/', dettaglio_torneo, name='dettaglio_torneo'),  # GET/PUT/DELETE /api/tornei/<id>/
    path('lista_tornei/', lista_tornei, name='lista_tornei'),
    path("calendar_schedule_tornei", calendar_schedule_tornei, name="calendar_schedule_tornei"),
    path('elimina/<int:torneo_id>/', elimina_torneo, name='elimina_torneo'),
    path('dettaglio_torneo/<int:torneo_id>/', dettaglio_torneo, name='dettaglio_torneo'),
]
