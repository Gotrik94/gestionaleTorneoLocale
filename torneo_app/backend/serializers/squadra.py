from rest_framework import serializers
from backend.models.squadra import Squadra

class SquadraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Squadra
        fields = '__all__'
