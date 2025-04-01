from django.urls import path
from api.views.views_pickban import lista_pickban, dettaglio_pickban

urlpatterns = [
    path('', lista_pickban, name='lista_pickban'),
    path('<int:pickban_id>/', dettaglio_pickban, name='dettaglio_pickban'),
]
