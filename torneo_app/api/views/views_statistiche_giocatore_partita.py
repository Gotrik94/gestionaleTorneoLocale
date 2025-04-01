from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from backend.models.statistiche_giocatore_partita import StatisticheGiocatorePartita
from backend.serializers.statistiche_giocatore_partita import StatisticheGiocatorePartitaSerializer

@api_view(['GET', 'POST'])
def lista_statistiche(request):
    """
    GET  -> Lista di tutte le statistiche giocatore-partita
    POST -> Crea una nuova statistica
    """
    if request.method == 'GET':
        statistiche = StatisticheGiocatorePartita.objects.all()
        serializer = StatisticheGiocatorePartitaSerializer(statistiche, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = StatisticheGiocatorePartitaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def dettaglio_statistica(request, statistica_id):
    """
    GET    -> Dettaglio di una statistica
    PUT    -> Aggiorna una statistica
    DELETE -> Elimina una statistica
    """
    try:
        statistica = StatisticheGiocatorePartita.objects.get(pk=statistica_id)
    except StatisticheGiocatorePartita.DoesNotExist:
        return Response({"detail": "Statistica non trovata"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = StatisticheGiocatorePartitaSerializer(statistica)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = StatisticheGiocatorePartitaSerializer(statistica, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        statistica.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
