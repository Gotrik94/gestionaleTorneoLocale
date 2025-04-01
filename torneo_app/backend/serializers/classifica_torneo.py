from rest_framework import serializers
from backend.models.classifica_torneo import ClassificaTorneo

class ClassificaTorneoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassificaTorneo
        fields = '__all__'
