from rest_framework import serializers
from backend.models.iscrizione import Iscrizione

class IscrizioneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Iscrizione
        fields = '__all__'
