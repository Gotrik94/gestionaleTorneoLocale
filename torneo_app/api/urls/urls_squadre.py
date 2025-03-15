from django.urls import path

from api.views import crea_squadra

urlpatterns = [
    path('crea_squadra/', crea_squadra, name='crea_squadra'),
]
