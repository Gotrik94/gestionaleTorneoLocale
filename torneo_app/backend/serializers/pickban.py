from rest_framework import serializers
from backend.models.pickban import PickBanPartita

class PickBanPartitaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PickBanPartita
        fields = '__all__'
