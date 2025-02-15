from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from backend.models.partita import Partita
from backend.serializers.partita import PartitaSerializer

@api_view(['GET', 'POST'])
def lista_partite(request):
    """
    GET  -> Lista di tutte le partite
    POST -> Crea una nuova partita
    """
    if request.method == 'GET':
        partite = Partita.objects.all()
        serializer = PartitaSerializer(partite, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = PartitaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def dettaglio_partita(request, partita_id):
    """
    GET    -> Dettaglio di una partita
    PUT    -> Aggiorna una partita
    DELETE -> Elimina una partita
    """
    try:
        partita = Partita.objects.get(pk=partita_id)
    except Partita.DoesNotExist:
        return Response({"detail": "Partita non trovata"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = PartitaSerializer(partita)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = PartitaSerializer(partita, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        partita.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
