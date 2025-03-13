from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from backend.models.giocatore import Giocatore
from backend.serializers.giocatore import GiocatoreSerializer

@api_view(['GET', 'POST'])
def lista_giocatori(request):
    """
    GET  -> Lista di tutti i giocatori
    POST -> Crea un nuovo giocatore
    """
    if request.method == 'GET':
        giocatori = Giocatore.objects.all()
        serializer = GiocatoreSerializer(giocatori, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = GiocatoreSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def dettaglio_giocatore(request, giocatore_id):
    """
    GET    -> Dettaglio di un giocatore
    PUT    -> Aggiorna un giocatore
    DELETE -> Elimina un giocatore
    """
    try:
        giocatore = Giocatore.objects.get(pk=giocatore_id)
    except Giocatore.DoesNotExist:
        return Response({"detail": "Giocatore non trovato"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = GiocatoreSerializer(giocatore)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = GiocatoreSerializer(giocatore, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        giocatore.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
