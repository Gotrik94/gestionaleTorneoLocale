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
        fasi_data = self.initial_data.get('fasi', [])
        torneo = Torneo.objects.create(
            nome=validated_data['nome'],
            data_inizio=validated_data['data_inizio'],
            data_fine=validated_data['data_fine'],
            fascia_oraria=validated_data['fascia_oraria'],
            formato=validated_data['formato'],
            is_active=validated_data.get('is_active', True)
        )
        print(f"✅ Torneo '{torneo.nome}' creato con successo!")

        for fase_raw in fasi_data:
            gironi_data = fase_raw.pop('gironi', [])
            fase = FaseTorneo.objects.create(torneo=torneo, **fase_raw)  # ✅ deve stare dentro il ciclo!
            print(f"🌀 Fase: {fase.nome} - Gironi ricevuti: {gironi_data}")

            for girone_data in gironi_data:
                Girone.objects.create(fase=fase, **girone_data)
                print(f"✅ Girone '{girone_data['nome']}' creato nella fase '{fase.nome}'")

        return torneo

