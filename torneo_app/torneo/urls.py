# torneo/urls.py
from django.urls import path, include
from django.contrib import admin
from api.views.views_home import home
from api.views.views_dashboard import dashboard_page_metrics
from api.views.views_tornei import api_tornei


urlpatterns = [

    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('', home, name='home'),
    path('dashboard/', dashboard_page_metrics, name='dashboard'),
    path("api/tornei/", api_tornei, name="api_tornei"),
]