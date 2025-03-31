from rest_framework import serializers
from backend.models.girone import Girone

class GironeSerializer(serializers.ModelSerializer):
    fase = serializers.PrimaryKeyRelatedField(queryset=Girone._meta.get_field('fase').related_model.objects.all(), required=False)

    class Meta:
        model = Girone
        fields = ['id', 'nome', 'fase']
