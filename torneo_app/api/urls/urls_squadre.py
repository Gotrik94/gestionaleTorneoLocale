from django.urls import path

from api.views import crea_squadra, modifica_squadra, elimina_squadra

urlpatterns = [
    path('crea_squadra/', crea_squadra, name='crea_squadra'),
    path('modifica_squadra/<int:squadra_id>/', modifica_squadra, name='modifica_squadra'),
    path('elimina_squadra/<int:squadra_id>/', elimina_squadra, name='elimina_squadra'),
]
