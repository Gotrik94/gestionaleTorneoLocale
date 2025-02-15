from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from backend.models.iscrizione import Iscrizione
from backend.serializers import IscrizioneSerializer

@api_view(['GET', 'POST'])
def lista_iscrizioni(request):
    """
    GET  -> Lista di tutte le iscrizioni
    POST -> Crea una nuova iscrizione (squadra-torneo)
    """
    if request.method == 'GET':
        iscrizioni = Iscrizione.objects.all()
        serializer = IscrizioneSerializer(iscrizioni, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = IscrizioneSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def dettaglio_iscrizione(request, iscrizione_id):
    """
    GET    -> Dettaglio di una singola iscrizione
    PUT    -> Aggiorna
    DELETE -> Elimina
    """
    try:
        iscrizione = Iscrizione.objects.get(pk=iscrizione_id)
    except Iscrizione.DoesNotExist:
        return Response({"detail": "Iscrizione non trovata"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = IscrizioneSerializer(iscrizione)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = IscrizioneSerializer(iscrizione, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        iscrizione.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
