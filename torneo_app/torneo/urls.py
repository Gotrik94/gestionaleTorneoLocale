# tornei/urls.py
from django.urls import path, include
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static

from api.views import squadre_page, crea_squadra
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
]


urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)