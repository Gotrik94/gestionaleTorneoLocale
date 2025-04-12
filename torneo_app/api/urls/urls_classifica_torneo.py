from django.urls import path

from api.views import ClassificaTorneoView

urlpatterns = [
    path("api/classifica/<int:torneo_id>/fase/<int:fase_id>/", ClassificaTorneoView.as_view(), name="classifica-fase"),
    path("api/classifica/<int:torneo_id>/fase/<int:fase_id>/girone/<int:girone_id>/", ClassificaTorneoView.as_view(),
         name="classifica-girone"),

]
