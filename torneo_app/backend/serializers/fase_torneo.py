from rest_framework import serializers

from backend.models.fase_torneo import FaseTorneo
from backend.serializers.girone import GironeSerializer

class FaseTorneoSerializer(serializers.ModelSerializer):
    gironi = GironeSerializer(many=True, required=False)

    class Meta:
        model = FaseTorneo
        fields = '__all__'
        extra_kwargs = {
            'torneo': {'required': False}
        }