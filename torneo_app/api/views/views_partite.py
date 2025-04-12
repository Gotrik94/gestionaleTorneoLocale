from datetime import timedelta

from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from backend.models.classifica_torneo import ClassificaTorneo
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


def calendar_schedule_partita(request):
    partite = Partita.objects.all()
    events = []

    for partita in partite:
        # Ignora partite dove almeno una squadra è None (tipicamente BYE)
        if not partita.squadra_rossa or not partita.squadra_blu:
            continue

        title = f"{partita.torneo.nome}\n{partita.squadra_rossa.nome} vs {partita.squadra_blu.nome}"
        events.append({
            'title': title,
            'start': partita.data_evento.isoformat(),
            'end': (partita.data_evento + timedelta(hours=1)).isoformat()
        })

    return JsonResponse(events, safe=False)

@api_view(['POST'])
def salva_partita_aggiorna_classifica(request):
    """
    Crea o aggiorna una partita e aggiorna automaticamente la classifica.
    """
    serializer = PartitaSerializer(data=request.data)
    if serializer.is_valid():
        partita = serializer.save()

        # Logica aggiornamento classifica se la partita è conclusa
        if partita.conclusa:
            def aggiorna_punti(squadra, punti):
                if squadra is None:
                    return
                classifica, _ = ClassificaTorneo.objects.get_or_create(
                    torneo=partita.torneo,
                    fase=partita.fase,
                    girone=partita.girone,
                    squadra=squadra,
                    defaults={'punti': 0}
                )
                classifica.punti += punti
                classifica.save()

            # Calcolo punti
            if partita.punteggio_rossa > partita.punteggio_blu:
                aggiorna_punti(partita.squadra_rossa, 3)
            elif partita.punteggio_blu > partita.punteggio_rossa:
                aggiorna_punti(partita.squadra_blu, 3)
            elif partita.punteggio_rossa == partita.punteggio_blu:
                aggiorna_punti(partita.squadra_rossa, 1)
                aggiorna_punti(partita.squadra_blu, 1)

        return Response({
            "success": True,
            "message": "Partita salvata con successo",
            "partita_id": partita.id
        }, status=status.HTTP_201_CREATED)
    else:
        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
