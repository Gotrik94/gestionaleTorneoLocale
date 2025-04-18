from rest_framework import serializers

from backend.models.fase_torneo import FaseTorneo
from backend.models.girone import Girone
from backend.models.torneo import Torneo
from backend.serializers.fase_torneo import FaseTorneoSerializer


class TorneoSerializer(serializers.ModelSerializer):
    fasi = FaseTorneoSerializer(many=True, required=False)
    fascia_oraria = serializers.CharField(allow_blank=True, required=False)

    class Meta:
        model = Torneo
        fields = ['id', 'nome', 'data_inizio', 'data_fine', 'fascia_oraria', 'formato', 'is_active', 'fasi']

    def validate_formato(self, value):
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
            fase = FaseTorneo.objects.create(torneo=torneo, **fase_raw)
            print(f"🌀 Fase: {fase.nome} - Gironi ricevuti: {gironi_data}")

            for girone_data in gironi_data:
                girone_data.pop('fase', None)  # ✅ rimuove 'fase' se presente
                Girone.objects.create(fase=fase, **girone_data)
                print(f"✅ Girone '{girone_data['nome']}' creato nella fase '{fase.nome}'")

        return torneo

    def update(self, instance, validated_data):
        fasi_data = validated_data.pop('fasi', [])

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        fase_ids_in_request = [fase.get('id') for fase in fasi_data if 'id' in fase]
        FaseTorneo.objects.filter(torneo=instance).exclude(id__in=fase_ids_in_request).delete()

        for fase_data in fasi_data:
            gironi_data = fase_data.pop('gironi', [])
            fase_id = fase_data.get('id', None)

            if fase_id:
                fase_instance = FaseTorneo.objects.get(id=fase_id, torneo=instance)
                for attr, value in fase_data.items():
                    setattr(fase_instance, attr, value)
                fase_instance.save()
            else:
                fase_data.pop('torneo', None)
                fase_instance = FaseTorneo.objects.create(torneo=instance, **fase_data)

            girone_ids_in_request = [g.get('id') for g in gironi_data if 'id' in g]
            Girone.objects.filter(fase=fase_instance).exclude(id__in=girone_ids_in_request).delete()

            for girone_data in gironi_data:
                girone_id = girone_data.get('id', None)
                if girone_id:
                    girone_instance = Girone.objects.get(id=girone_id, fase=fase_instance)
                    for attr, value in girone_data.items():
                        setattr(girone_instance, attr, value)
                    girone_instance.save()
                else:
                    girone_data.pop('fase', None)  # ✅ rimuove 'fase' anche qui
                    Girone.objects.create(fase=fase_instance, **girone_data)

        return instance
