# tornei/urls.py
from django.urls import path, include
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static

from api.views import squadre_page
from api.views.views_dettaglio_squadre import dettaglio_squadra
from api.views.views_dettaglio_tornei import dettaglio_torneo
from api.views.views_home import home
from api.views.views_dashboard import dashboard_page_metrics
from api.views.views_tornei import tornei_page

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('', home, name='home'),
    path('dashboard/', dashboard_page_metrics, name='dashboard'),
    path('tornei/', tornei_page, name='tornei_page'),
    path('squadre/', squadre_page, name='squadre_page'),
    path('squadre/dettaglio/<int:squadra_id>/', dettaglio_squadra, name='dettaglio_squadra'),
    path('tornei/dettaglio/<int:torneo_id>/', dettaglio_torneo, name='dettaglio_torneo'),

]


urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)