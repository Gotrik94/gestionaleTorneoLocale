from rest_framework import serializers
from backend.models.torneo import Torneo


class TorneoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Torneo
        fields = '__all__'

    def validate_formato(self, value):
        valid_formats = ['DRAFT', 'ARAM', 'CUSTOM']  # Valori permessi
        if value not in valid_formats:
            raise serializers.ValidationError(
                f"Formato non valido. Usare uno di: {', '.join(valid_formats)}"
            )
        return value  # Se tutto ok, ritorna il valore
