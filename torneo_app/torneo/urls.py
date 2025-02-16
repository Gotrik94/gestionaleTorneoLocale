# torneo/urls.py
from django.urls import path, include
from django.contrib import admin
from frontend.views import home, test_page

urlpatterns = [
    path('', home, name='home'),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]