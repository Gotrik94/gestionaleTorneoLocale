from rest_framework import serializers
from backend.models.partita import Partita

class PartitaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Partita
        fields = '__all__'
