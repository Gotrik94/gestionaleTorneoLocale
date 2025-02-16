# torneo/urls.py
from django.urls import path, include
from django.contrib import admin
from frontend.views import home, dashboard_page

urlpatterns = [

    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('', home, name='home'),
    path('dashboard/', dashboard_page, name='dashboard'),
]