from rest_framework import serializers
from backend.models.nota_partita import NotaPartita

class NotaPartitaSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotaPartita
        fields = '__all__'
