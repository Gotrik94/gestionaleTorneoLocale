from rest_framework import serializers
from backend.models.statistiche_giocatore_partita import StatisticheGiocatorePartita

class StatisticheGiocatorePartitaSerializer(serializers.ModelSerializer):
    class Meta:
        model = StatisticheGiocatorePartita
        fields = '__all__'
