from rest_framework import serializers
from backend.models.giocatore import Giocatore

class GiocatoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Giocatore
        fields = '__all__'
