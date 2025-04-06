from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from backend.models import Partita, Iscrizione, Torneo, Squadra
from backend.models.fase_torneo import FaseTorneo
from backend.serializers import PartitaSerializer
import json


# 🎨 Renderizza pagina HTML dettaglio torneo
def dettaglio_torneo(request, torneo_id):
    torneo = get_object_or_404(Torneo, id=torneo_id)
    iscrizioni = Iscrizione.objects.filter(torneo=torneo)

    return render(request, "modules/tornei/dettaglio_tornei/dettaglio_tornei.html", {
        'torneo': torneo,
        'active_page': 'tornei'
    })


# 🔍 API REST - dettaglio torneo completo
@api_view(['GET'])
def api_dettaglio_torneo(request, torneo_id):
    try:
        torneo = Torneo.objects.get(id=torneo_id)
        fasi = FaseTorneo.objects.filter(torneo=torneo).order_by('data_inizio')

        dati_fasi = []
        for fase in fasi:
            # Correzione obbligatoria (usa correttamente la relazione inversa "iscrizione"):
            squadre_iscritte = Squadra.objects.filter(iscrizione__torneo=torneo).distinct()

            partite = Partita.objects.all_with_bye().filter(fase=fase).order_by('data_evento')
            dati_partite = PartitaSerializer(partite, many=True).data

            dati_fasi.append({
                "id": fase.id,
                "nome": fase.nome,
                "tipologia": fase.tipologia,
                "data_inizio": fase.data_inizio,
                "data_fine": fase.data_fine,
                "bracket_confermato": fase.bracket_confermato,  # Aggiungi questa linea
                "squadre": [{"id": s.id, "nome": s.nome, "logo": s.logo.url if s.logo else ""} for s in
                            squadre_iscritte],
                "partite": dati_partite
            })

        return Response({
            "torneo": {
                "id": torneo.id,
                "nome": torneo.nome,
                "data_inizio": torneo.data_inizio,
                "data_fine": torneo.data_fine
            },
            "fasi": dati_fasi
        }, status=status.HTTP_200_OK)

    except Torneo.DoesNotExist:
        return Response({"errore": "Torneo non trovato"}, status=status.HTTP_404_NOT_FOUND)


# 📌 API REST - aggiorna risultato partita singola
@api_view(['POST'])
def aggiorna_risultato_partita(request, partita_id):
    try:
        partita = Partita.objects.get(id=partita_id)
        punteggio_rossa = request.data.get('punteggio_rossa')
        punteggio_blu = request.data.get('punteggio_blu')

        partita.punteggio_rossa = punteggio_rossa
        partita.punteggio_blu = punteggio_blu
        if punteggio_rossa > punteggio_blu:
            partita.vincitore = partita.squadra_rossa
        elif punteggio_blu > punteggio_rossa:
            partita.vincitore = partita.squadra_blu
        else:
            partita.vincitore = None  # pareggio o non deciso

        partita.save()

        return Response(PartitaSerializer(partita).data, status=status.HTTP_200_OK)

    except Partita.DoesNotExist:
        return Response({"errore": "Partita non trovata"}, status=status.HTTP_404_NOT_FOUND)


# 🔗 API REST - salva struttura bracket completa
@api_view(['POST'])
def salva_bracket(request, fase_id):
    try:
        fase = FaseTorneo.objects.get(id=fase_id)
        fase.bracket_confermato = True

        if Partita.objects.filter(fase=fase).exists():
            return JsonResponse({'errore': 'Bracket già generato per questa fase'}, status=400)

        fase.save()  # Aggiungi questa linea per salvare il cambiamento

        data = request.data
        bracket = data.get('bracket', {})
        teams = bracket.get('teams', [])
        results = bracket.get('results', [[]])[0]

        for i, match in enumerate(teams):
            t1 = match[0]
            t2 = match[1]
            score = results[i] if i < len(results) else [0, 0]

            squadra1 = Squadra.objects.filter(id=t1.get('id')).first() if t1 else None
            squadra2 = Squadra.objects.filter(id=t2.get('id')).first() if t2 else None

            if not squadra1 and not squadra2:
                continue

            Partita.objects.create(
                fase=fase,
                torneo=fase.torneo,  # ✅ aggiunto questo
                squadra_rossa=squadra1,
                squadra_blu=squadra2,
                round_num=1,
                vincitore=None,
                data_evento=timezone.localtime(timezone.now()).date(),  # ✅ corretto
                modalita="BO1",
                numero_partita_nella_serie=1,
                conclusa=False,
            )

        return JsonResponse({'ok': True})

    except Exception as e:
        return JsonResponse({'errore': str(e)}, status=400)



