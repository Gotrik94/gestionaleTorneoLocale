from django.contrib import admin
from django.urls import path, include
from frontend.views import home

urlpatterns = [
    path('', home, name='home'),  # Homepage
    path('admin/', admin.site.urls),  # Aggiunge l'admin Django
    path('api/', include('api.urls')),  # API REST
]
