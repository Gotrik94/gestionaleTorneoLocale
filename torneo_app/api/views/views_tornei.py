import datetime
from datetime import timedelta, date

from django.http import JsonResponse
from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework import status

from backend.models import Squadra, Iscrizione
from backend.models.torneo import Torneo
from backend.serializers.torneo import TorneoSerializer


@api_view(['GET', 'POST'])
def lista_tornei(request):
    """
    GET  -> Lista di tutti i tornei
    POST -> Crea un nuovo torneo
    """
    if request.method == 'GET':
        tornei = Torneo.objects.all()
        serializer = TorneoSerializer(tornei, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = TorneoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def dettaglio_torneo(request, torneo_id):
    """
    GET    -> Dettaglio di un torneo
    PUT    -> Aggiorna un torneo
    DELETE -> Elimina un torneo
    """
    try:
        torneo = Torneo.objects.get(pk=torneo_id)
    except Torneo.DoesNotExist:
        return Response({"detail": "Torneo non trovato"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = TorneoSerializer(torneo)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = TorneoSerializer(torneo, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        torneo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


def calendar_schedule_tornei(request):
    tornei = Torneo.objects.filter(is_active=True)
    eventi = [
        {
            "title": torneo.nome,
            "start": torneo.data_inizio.isoformat() if torneo.data_inizio else None,
            "end": torneo.data_fine.isoformat() if torneo.data_fine else None,
            "description": f"Formato: {torneo.formato}"
        }
        for torneo in tornei
    ]
    return JsonResponse(eventi, safe=False)


def tornei_page(request):
    oggi = date.today()

    # Query per i tornei
    tornei_totali = Torneo.objects.filter(is_active=True).count()
    tornei_attivi = Torneo.objects.filter(data_inizio__lte=oggi, data_fine__gte=oggi, is_active=True).count()
    tornei_conclusi = Torneo.objects.filter(data_fine__lt=oggi, is_active=True).count()

    tornei = Torneo.objects.filter(is_active=True)

    return render(request, 'modules/tornei/tornei.html', {
        'tornei': tornei,
        'tornei_totali': tornei_totali,
        'tornei_attivi': tornei_attivi,
        'tornei_conclusi': tornei_conclusi,
        'active_page': 'tornei'
    })
