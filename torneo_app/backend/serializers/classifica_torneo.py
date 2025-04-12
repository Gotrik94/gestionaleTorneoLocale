from rest_framework import serializers

from backend.models.classifica_torneo import ClassificaTorneo


class ClassificaTorneoSerializer(serializers.ModelSerializer):
    squadra = serializers.CharField(source='squadra.nome')
    torneo = serializers.CharField(source='torneo.nome')
    fase = serializers.CharField(source='fase.nome')
    girone = serializers.CharField(source='girone.nome', default=None)
    punti = serializers.IntegerField(default=0)

    class Meta:
        model = ClassificaTorneo
        fields = [
            'squadra', 'torneo', 'fase', 'girone',
            'punti', 'vittorie', 'pareggi', 'sconfitte'
        ]
