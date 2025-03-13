from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from backend.models.squadra import Squadra
from backend.serializers.squadra import SquadraSerializer

@api_view(['GET', 'POST'])
def lista_squadre(request):
    """
    GET  -> Lista di tutte le squadre
    POST -> Crea una nuova squadra
    """
    if request.method == 'GET':
        squadre = Squadra.objects.all()
        serializer = SquadraSerializer(squadre, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = SquadraSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def dettaglio_squadra(request, squadra_id):
    """
    GET    -> Dettaglio di una squadra
    PUT    -> Aggiorna una squadra
    DELETE -> Elimina una squadra
    """
    try:
        squadra = Squadra.objects.get(pk=squadra_id)
    except Squadra.DoesNotExist:
        return Response({"detail": "Squadra non trovata"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = SquadraSerializer(squadra)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = SquadraSerializer(squadra, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        squadra.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
