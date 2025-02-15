from rest_framework import serializers
from backend.models.torneo import Torneo

class TorneoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Torneo
        fields = '__all__'  # Include tutti i campi del modello
