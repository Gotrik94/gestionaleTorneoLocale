from rest_framework import serializers
from backend.models.girone import Girone

class GironeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Girone
        fields = '__all__'
