from django.shortcuts import render, get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from backend.models import Partita, Iscrizione, Torneo, Squadra
from backend.models.fase_torneo import FaseTorneo
from backend.serializers import PartitaSerializer


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

            partite = Partita.objects.filter(fase=fase).order_by('data_evento')
            dati_partite = PartitaSerializer(partite, many=True).data

            dati_fasi.append({
                "id": fase.id,
                "nome": fase.nome,
                "tipologia": fase.tipologia,
                "data_inizio": fase.data_inizio,
                "data_fine": fase.data_fine,
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
        torneo = fase.torneo

        Partita.objects.filter(fase=fase).delete()

        bracket = request.data['bracket']
        nuove_partite = []

        for squadra_rossa_nome, squadra_blu_nome in bracket['teams']:
            squadra_rossa = Squadra.objects.get(nome=squadra_rossa_nome)
            squadra_blu = Squadra.objects.get(nome=squadra_blu_nome)

            partita = Partita.objects.create(
                fase=fase, torneo=torneo,
                squadra_rossa=squadra_rossa,
                squadra_blu=squadra_blu,
                data_evento=fase.data_inizio
            )
            nuove_partite.append(partita)

        return Response(PartitaSerializer(nuove_partite, many=True).data, status=201)
    except Exception as e:
        print(f"[ERRORE] {str(e)}")
        return Response({"errore": str(e)}, status=400)


