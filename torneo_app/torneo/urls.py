# tornei/urls.py
from django.urls import path, include
from django.contrib import admin
from api.views.views_home import home
from api.views.views_dashboard import dashboard_page_metrics
from api.views.views_tornei import tornei_page, calendar_schedule_tornei
from api.views.views_partite import calendar_schedule_partita


urlpatterns = [

    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('', home, name='home'),
    path('dashboard/', dashboard_page_metrics, name='dashboard'),
    path("api/tornei/calendar_schedule_tornei", calendar_schedule_tornei, name="calendar_schedule_tornei"),
    path("api/partita/calendar_schedule_partita", calendar_schedule_partita, name="calendar_schedule_partita"),
    path('tornei/', tornei_page, name='tornei_page'),
]