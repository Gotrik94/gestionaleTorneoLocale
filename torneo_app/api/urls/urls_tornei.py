from django.urls import path
from api.views.views_tornei import lista_tornei, dettaglio_torneo

urlpatterns = [
    path('', lista_tornei, name='lista_tornei'),         # GET: /api/tornei/  | POST: /api/tornei/
    path('<int:torneo_id>/', dettaglio_torneo, name='dettaglio_torneo'),  # GET/PUT/DELETE /api/tornei/<id>/
]
