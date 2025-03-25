from rest_framework import serializers
from backend.models.fase_torneo import FaseTorneo

class FaseTorneoSerializer(serializers.ModelSerializer):
    class Meta:
        model = FaseTorneo
        fields = '__all__'
        extra_kwargs = {
            'torneo': {'required': False}
        }