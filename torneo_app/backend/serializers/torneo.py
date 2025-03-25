from rest_framework import serializers

from backend.models.fase_torneo import FaseTorneo
from backend.models.girone import Girone
from backend.models.torneo import Torneo
from backend.serializers.fase_torneo import FaseTorneoSerializer


class TorneoSerializer(serializers.ModelSerializer):
    fasi = FaseTorneoSerializer(many=True, required=False)

    class Meta:
        model = Torneo
        fields = ['id', 'nome', 'data_inizio', 'data_fine', 'fascia_oraria', 'formato', 'is_active', 'fasi']

    def validate_formato(self, value):  # 👈 validazione inclusa!
        valid_formats = ['DRAFT', 'ARAM', 'CUSTOM']
        if value not in valid_formats:
            raise serializers.ValidationError(
                f"Formato non valido. Usare uno di: {', '.join(valid_formats)}"
            )
        return value

    def create(self, validated_data):
        fasi_data = validated_data.pop('fasi', [])
        torneo = Torneo.objects.create(**validated_data)

        for fase_data in fasi_data:
            gironi_data = fase_data.pop('gironi', [])
            fase = FaseTorneo.objects.create(torneo=torneo, **fase_data)
            for girone_data in gironi_data:
                Girone.objects.create(fase=fase, **girone_data)

        return torneo