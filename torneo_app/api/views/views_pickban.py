from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from backend.models.pickban import PickBanPartita
from backend.serializers.pickban import PickBanPartitaSerializer

@api_view(['GET', 'POST'])
def lista_pickban(request):
    """
    GET  -> Lista di tutti i pick/ban
    POST -> Crea un nuovo record di pick/ban
    """
    if request.method == 'GET':
        picks_bans = PickBanPartita.objects.all()
        serializer = PickBanPartitaSerializer(picks_bans, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = PickBanPartitaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def dettaglio_pickban(request, pickban_id):
    """
    GET    -> Dettaglio di un record di pick/ban
    PUT    -> Aggiorna un record di pick/ban
    DELETE -> Elimina un record di pick/ban
    """
    try:
        pickban_instance = PickBanPartita.objects.get(pk=pickban_id)
    except PickBanPartita.DoesNotExist:
        return Response({"detail": "Pick/Ban non trovato"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = PickBanPartitaSerializer(pickban_instance)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = PickBanPartitaSerializer(pickban_instance, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        pickban_instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
