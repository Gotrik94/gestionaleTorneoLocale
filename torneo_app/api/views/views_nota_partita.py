from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from backend.models.nota_partita import NotaPartita
from backend.serializers.nota_partita import NotaPartitaSerializer

@api_view(['GET', 'POST'])
def lista_note(request):
    """
    GET  -> Lista di tutte le note delle partite
    POST -> Crea una nuova nota
    """
    if request.method == 'GET':
        note = NotaPartita.objects.all()
        serializer = NotaPartitaSerializer(note, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = NotaPartitaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def dettaglio_nota(request, nota_id):
    """
    GET    -> Dettaglio di una nota
    PUT    -> Aggiorna una nota
    DELETE -> Elimina una nota
    """
    try:
        nota = NotaPartita.objects.get(pk=nota_id)
    except NotaPartita.DoesNotExist:
        return Response({"detail": "Nota non trovata"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = NotaPartitaSerializer(nota)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = NotaPartitaSerializer(nota, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        nota.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
