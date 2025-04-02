import datetime
from datetime import timedelta, date

from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from backend.models import Iscrizione
from backend.models.fase_torneo import FaseTorneo
from backend.models.torneo import Torneo
from backend.serializers.torneo import TorneoSerializer


@api_view(['GET', 'POST'])
def lista_tornei(request):
    if request.method == 'GET':
        tornei = Torneo.objects.all()
        serializer = TorneoSerializer(tornei, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        print("Dati ricevuti:", request.data)  # Controlla dati ricevuti dal frontend
        serializer = TorneoSerializer(data=request.data)

        if serializer.is_valid():
            torneo = serializer.save()
            print("Torneo creato:", torneo.nome)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        print("Errore nella validazione:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
def dettaglio_torneo(request, torneo_id):
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
    fasi = FaseTorneo.objects.filter(torneo__in=tornei)

    eventi_tornei = [
        {
            "title": torneo.nome,
            "start": torneo.data_inizio.isoformat(),
            "end": torneo.data_fine.isoformat(),
            "description": f"Formato: {torneo.formato}",
            "tipo": "torneo"
        }
        for torneo in tornei
    ]

    eventi_fasi = [
        {
            "title": fase.nome,
            "start": fase.data_inizio.isoformat(),
            "end": (fase.data_fine + timedelta(days=1)).isoformat(),
            "description": f"Fase del torneo: {fase.torneo.nome}",
            "tipo": "fase"
        }
        for fase in fasi
    ]

    return JsonResponse({
        "tornei": eventi_tornei,
        "fasi": eventi_fasi
    }, safe=False)

def tornei_page(request):
    oggi = date.today()

    # Query per i tornei
    tornei_totali = Torneo.objects.filter(is_active=True)
    tornei_attivi = Torneo.objects.filter(data_inizio__lte=oggi, data_fine__gte=oggi, is_active=True)
    tornei_conclusi = Torneo.objects.filter(data_fine__lt=oggi, is_active=True)
    tornei_totali_counter = tornei_totali.count()
    tornei_attivi_counter = tornei_attivi.count()
    tornei_conclusi_counter = tornei_conclusi.count()

    tornei = Torneo.objects.filter(is_active=True)

    # Preparazione dati tornei con stato
    tornei_con_stato = []  # inizializza una lista vuota
    for torneo in tornei:

        print(f"Analisi torneo: {torneo.nome}")
        print(f"Data inizio torneo: {torneo.data_inizio}, Data fine torneo: {torneo.data_fine}")


        if torneo.data_inizio <= oggi <= torneo.data_fine:
            stato = "in_corso"
        elif oggi < torneo.data_inizio:
            stato = "programmato"
        else:
            stato = "concluso"

        print(f"Stato assegnato: {stato}\n")

        # Ottieni le squadre iscritte a questo torneo
        iscrizioni = Iscrizione.objects.filter(torneo=torneo)
        squadre = [iscrizione.squadra for iscrizione in iscrizioni]

        tornei_con_stato.append({  # correggi questo
            'id': torneo.id,
            'nome': torneo.nome,
            'data_inizio': torneo.data_inizio,
            'data_fine': torneo.data_fine,
            'squadre': squadre,
            'stato': stato
        })

        print(f"Squadre: {squadre}\n")

    return render(request, 'modules/tornei/tornei.html', {
        'tornei': tornei,
        'tornei_totali': tornei_totali,
        'tornei_attivi': tornei_attivi,
        'tornei_con_stato': tornei_con_stato,  # usa questa lista nel template
        'tornei_conclusi': tornei_conclusi,
        'tornei_totali_counter': tornei_totali_counter,
        'tornei_attivi_counter': tornei_attivi_counter,
        'tornei_conclusi_counter': tornei_conclusi_counter,
        'active_page': 'tornei'
    })

def elimina_torneo(request, torneo_id):
    if request.method == "DELETE":
        torneo = get_object_or_404(Torneo, id=torneo_id)

        # Eliminazione logica
        torneo.is_active = False
        torneo.save()

        return JsonResponse({"message": f"Il torneo '{torneo.nome}' è stato eliminato con successo."}, status=200)

    return JsonResponse({"error": "Metodo non consentito"}, status=405)