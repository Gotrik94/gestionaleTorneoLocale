from django.urls import include, path

urlpatterns = [
    path('tornei/', include('api.urls.urls_tornei')),
    path('partita/', include('api.urls.urls_partite')),
    path('squadre/', include('api.urls.urls_squadre')),
    path('dettaglio/', include('api.urls.urls_dettaglio_squadre')),
    path('dettaglio/', include('api.urls.urls_dettaglio_tornei')),
]