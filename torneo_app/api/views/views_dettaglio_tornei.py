# views_dettaglio_tornei.py

import logging
import json

from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from django.utils import timezone

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from backend.models import Partita, Iscrizione, Torneo, Squadra
from backend.models.fase_torneo import FaseTorneo
from backend.serializers import PartitaSerializer

logger = logging.getLogger(__name__)

# --------------------------------------------------------------------
# -------------------- FUNZIONI UTILITY PER PUNTEGGI -----------------
# --------------------------------------------------------------------

def get_partite_fase(fase):
    """
    Restituisce tutte le partite collegate a una determinata fase, ordinate per round_num e data_evento.
    """
    logger.info(f"[get_partite_fase] Recupero partite per la fase id={fase.id}")
    partite = Partita.objects.filter(fase=fase).order_by('round_num', 'data_evento')
    logger.debug(f"[get_partite_fase] Trovate {partite.count()} partite per la fase {fase.id}")
    return partite


def calcola_esito_serie(partite, modalita="BO3"):
    """
    Dato un insieme di partite che compongono una serie (es. BO3, BO5),
    calcola punteggio complessivo (es. 2-1) e determina il vincitore finale se raggiunge la soglia.

    Args:
        partite (iterable): Lista/QuerySet di Partita (ognuna ha un vincitore, squadra_rossa, squadra_blu).
        modalita (str): "BO1", "BO3", "BO5".

    Returns:
        ( (int, int), Squadra|None ):
          -> (punteggio_rossa, punteggio_blu)
          -> vincitore (Squadra) o None se non ancora deciso
    """
    logger.info(f"[calcola_esito_serie] Inizio calcolo. Modalità={modalita}, numero partite={len(partite)}")
    soglia = 1
    if modalita == "BO3":
        soglia = 2
    elif modalita == "BO5":
        soglia = 3

    score_rossa = 0
    score_blu = 0
    vincitore_finale = None

    for p in partite:
        if p.vincitore == p.squadra_rossa:
            score_rossa += 1
        elif p.vincitore == p.squadra_blu:
            score_blu += 1

    logger.debug(f"[calcola_esito_serie] Score finale parziale: rossa={score_rossa}, blu={score_blu}")

    if score_rossa >= soglia:
        vincitore_finale = partite[0].squadra_rossa
    elif score_blu >= soglia:
        vincitore_finale = partite[0].squadra_blu

    logger.info(f"[calcola_esito_serie] Risultato: {score_rossa}-{score_blu}, vincitore={vincitore_finale}")
    return (score_rossa, score_blu), vincitore_finale


def calcola_classifica_fase(fase):
    """
    Calcola una "classifica" di punteggi/vittorie per la fase data, sommando punteggio_rossa/punteggio_blu
    come li hai in DB. Utile per gironi o punteggi cumulativi.
    """
    logger.info(f"[calcola_classifica_fase] Calcolo classifica per fase id={fase.id}")
    partite_fase = get_partite_fase(fase)
    classifica = {}

    for p in partite_fase:
        ros_id = p.squadra_rossa.id
        blu_id = p.squadra_blu.id

        if ros_id not in classifica:
            classifica[ros_id] = {"punti": 0, "vittorie": 0, "sconfitte": 0}
        if blu_id not in classifica:
            classifica[blu_id] = {"punti": 0, "vittorie": 0, "sconfitte": 0}

        classifica[ros_id]["punti"] += p.punteggio_rossa
        classifica[blu_id]["punti"] += p.punteggio_blu

        if p.vincitore == p.squadra_rossa:
            classifica[ros_id]["vittorie"] += 1
            classifica[blu_id]["sconfitte"] += 1
        elif p.vincitore == p.squadra_blu:
            classifica[blu_id]["vittorie"] += 1
            classifica[ros_id]["sconfitte"] += 1

    logger.debug(f"[calcola_classifica_fase] Classifica => {classifica}")
    return classifica


def get_esito_round(fase, round_num):
    """
    Restituisce un mini-report di punteggio e vincitore per le partite di un determinato round_num.
    """
    logger.info(f"[get_esito_round] round_num={round_num}, fase id={fase.id}")
    partite = Partita.objects.filter(fase=fase, round_num=round_num).order_by('data_evento')
    esiti = []
    for p in partite:
        score_str = f"{p.punteggio_rossa}-{p.punteggio_blu}"
        nome_vincitore = p.vincitore.nome if p.vincitore else "Pareggio/ND"
        esiti.append({
            "partita_id": p.id,
            "vincitore": nome_vincitore,
            "punteggio": score_str,
        })

    logger.debug(f"[get_esito_round] Round {round_num} => {len(esiti)} partite => {esiti}")
    return esiti


def aggiorna_risultato_singolo_match(partita, punteggio_rossa, punteggio_blu):
    """
    Se vuoi gestire/salvare i punteggi su DB (campo punteggio_rossa/punteggio_blu),
    questa funzione li imposta e stabilisce il vincitore corrispondente.
    """
    logger.info(f"[aggiorna_risultato_singolo_match] Aggiorno partita ID={partita.id}")
    logger.debug(f"Input => Rossa={punteggio_rossa}, Blu={punteggio_blu}")

    partita.punteggio_rossa = punteggio_rossa
    partita.punteggio_blu = punteggio_blu

    if punteggio_rossa > punteggio_blu:
        partita.vincitore = partita.squadra_rossa
    elif punteggio_blu > punteggio_rossa:
        partita.vincitore = partita.squadra_blu
    else:
        partita.vincitore = None

    if punteggio_rossa > 0 or punteggio_blu > 0:
        partita.conclusa = True

    partita.save()
    logger.debug(f"Salvataggio riuscito. Vincitore={partita.vincitore}")


def aggiorna_risultato_serie(partita_serie):
    """
    Se usi partite "figlie" per BO3/BO5 e vuoi calcolare la serie aggregata.
    """
    logger.info(f"[aggiorna_risultato_serie] Inizio calcolo serie ID={partita_serie.id}, modalita={partita_serie.modalita}")

    partite_figlie = partita_serie.serie_partite.all()
    (score_r, score_b), winner = calcola_esito_serie(partite_figlie, modalita=partita_serie.modalita)

    if winner:
        partita_serie.vincitore = winner
        partita_serie.conclusa = True
        partita_serie.save()
        logger.info(f"Serie conclusa: {score_r}-{score_b}, winner={winner}")
    else:
        logger.info(f"Serie ancora in corso => {score_r}-{score_b}, nessun vincitore")


# --------------------------------------------------------------------
# ----------- SE VUOI CALCOLARE PUNTEGGI ON-THE-FLY --------------
# --------------------------------------------------------------------

def calcola_punteggio_on_the_fly(vincitore, squadra_rossa, squadra_blu, modalita="BO1"):
    """
    Calcola i punteggi in base a vincitore e modalita, SENZA leggere/scrivere punteggio_rossa/punteggio_blu dal DB.
    Se serve, personalizza la logica per BO3/BO5.
    """
    logger.debug(f"[calcola_punteggio_on_the_fly] vincitore={vincitore}, modalita={modalita}")

    if vincitore is None:
        return 0, 0

    if modalita == "BO1":
        if vincitore == squadra_rossa:
            return 1, 0
        else:
            return 0, 1

    return 0, 0  # fallback per altre modalita


# --------------------------------------------------------------------
# ------------------------ LOGICA ESISTENTE --------------------------
# --------------------------------------------------------------------

def calcola_punteggio(vincitore, squadra_rossa, squadra_blu, modalita="BO1"):
    """
    [ESISTENTE DAL TUO CODICE]
    Se vuoi memorizzare su DB i punteggi o avere un calcolo base (senza parziali).
    """
    logger.info(f"[calcola_punteggio] Modalità={modalita}, Vincitore={vincitore}")
    if vincitore is None:
        logger.debug("[calcola_punteggio] => 0,0")
        return 0, 0

    if modalita == "BO1":
        if vincitore == squadra_rossa:
            return 1, 0
        else:
            return 0, 1

    if modalita == "BO3":
        return (2, 0) if vincitore == squadra_rossa else (0, 2)
    if modalita == "BO5":
        return (3, 0) if vincitore == squadra_rossa else (0, 3)

    return 0, 0


# --------------------------------------------------------------------
# -------------------- VIEW DI RENDER HTML ---------------------------
# --------------------------------------------------------------------

def dettaglio_torneo(request, torneo_id):
    """
    Renderizza pagina HTML dettaglio torneo
    """
    torneo = get_object_or_404(Torneo, id=torneo_id)
    iscrizioni = Iscrizione.objects.filter(torneo=torneo)

    return render(request, "modules/tornei/dettaglio_tornei/dettaglio_tornei.html", {
        'torneo': torneo,
        'active_page': 'tornei'
    })


# --------------------------------------------------------------------
# ----------- API REST - DETTAGLIO TORNEO (BRACKET ON-THE-FLY) -------
# --------------------------------------------------------------------

@api_view(['GET'])
def api_dettaglio_torneo(request, torneo_id):
    """
    Mostra i dati del torneo e le fasi, calcolando i punteggi al volo in base a 'vincitore' e 'modalita'.
    """
    logger.info(f"[api_dettaglio_torneo] Inizio elaborazione dettaglio torneo ID={torneo_id}")
    try:
        torneo = Torneo.objects.get(id=torneo_id)
        logger.info(f"[api_dettaglio_torneo] Torneo trovato: {torneo.nome} (ID={torneo.id})")
    except Torneo.DoesNotExist:
        logger.error(f"[api_dettaglio_torneo] Torneo non trovato con ID={torneo_id}")
        return Response({"errore": "Torneo non trovato"}, status=status.HTTP_404_NOT_FOUND)

    fasi = FaseTorneo.objects.filter(torneo=torneo).order_by('data_inizio')
    logger.debug(f"[api_dettaglio_torneo] Trovate {len(fasi)} fasi per torneo {torneo.nome}")

    dati_fasi = []
    for fase in fasi:
        logger.debug(f"[api_dettaglio_torneo] Elaborazione fase ID={fase.id}, {fase.nome}")
        squadre_iscritte = Squadra.objects.filter(iscrizione__torneo=torneo).distinct()

        partite = Partita.objects.all_with_bye().filter(fase=fase).order_by('data_evento','round_num')
        logger.debug(f"[api_dettaglio_torneo] Trovate {partite.count()} partite per fase ID={fase.id}")

        partite_data = []
        for p in partite:
            p_data = PartitaSerializer(p).data
            # Punteggi on the fly
            pr, pb = calcola_punteggio_on_the_fly(p.vincitore, p.squadra_rossa, p.squadra_blu, p.modalita)
            p_data['punteggio_rossa'] = pr
            p_data['punteggio_blu'] = pb
            partite_data.append(p_data)

        bracket_confermato = getattr(fase, 'bracket_confermato', False)

        dati_fasi.append({
            "id": fase.id,
            "nome": fase.nome,
            "tipologia": fase.tipologia,
            "data_inizio": fase.data_inizio,
            "data_fine": fase.data_fine,
            "bracket_confermato": bracket_confermato,
            "squadre": [
                {
                    "id": s.id,
                    "nome": s.nome,
                    "logo": s.logo.url if s.logo else ""
                }
                for s in squadre_iscritte
            ],
            "partite": partite_data
        })

    response_data = {
        "torneo": {
            "id": torneo.id,
            "nome": torneo.nome,
            "data_inizio": torneo.data_inizio,
            "data_fine": torneo.data_fine
        },
        "fasi": dati_fasi
    }

    logger.info(f"[api_dettaglio_torneo] Completata elaborazione e invio dati per torneo ID={torneo_id}")
    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['GET'])
def aggiorna_bracket(request, fase_id):
    """
    Ritorna il bracket aggiornato per la fase (partite e punteggi on the fly).
    """
    logger.info(f"[aggiorna_bracket] Richiesta bracket per fase_id={fase_id}")
    try:
        fase = FaseTorneo.objects.get(id=fase_id)
        partite = Partita.objects.all_with_bye().filter(fase=fase).order_by('data_evento','round_num')
        partite_data = []
        for p in partite:
            p_data = PartitaSerializer(p).data
            pr, pb = calcola_punteggio_on_the_fly(p.vincitore, p.squadra_rossa, p.squadra_blu, p.modalita)
            p_data['punteggio_rossa'] = pr
            p_data['punteggio_blu'] = pb
            partite_data.append(p_data)

        return Response(partite_data, status=status.HTTP_200_OK)

    except FaseTorneo.DoesNotExist:
        logger.error(f"[aggiorna_bracket] Fase non trovata con id={fase_id}")
        return Response({"errore": "Fase non trovata"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def salva_bracket(request, fase_id):
    logger.info(f"[salva_bracket] Generazione bracket per fase={fase_id}")
    try:
        fase = FaseTorneo.objects.get(id=fase_id)
        fase.bracket_confermato = True

        # Se esiste già un bracket per questa fase, blocca
        if Partita.objects.filter(fase=fase).exists():
            logger.warning("[salva_bracket] Bracket già generato per questa fase")
            return JsonResponse({'errore': 'Bracket già generato per questa fase'}, status=400)

        fase.save()

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

            # Se entrambe le squadre mancano, skip
            if not squadra1 and not squadra2:
                logger.debug("[salva_bracket] Nessuna squadra in questo match, lo salto.")
                continue

            # Calcola vincitore
            vincitore = None

            # 1) Se manca squadra2 => squadra1 vince a tavolino
            if squadra1 and not squadra2:
                vincitore = squadra1
                logger.debug(f"[salva_bracket] BYE per la squadra2 => vince automaticamente {squadra1.nome}")

            # 2) Se manca squadra1 => squadra2 vince a tavolino
            elif squadra2 and not squadra1:
                vincitore = squadra2
                logger.debug(f"[salva_bracket] BYE per la squadra1 => vince automaticamente {squadra2.nome}")

            # 3) Altrimenti, se entrambe ci sono, eventualmente usi score[0] e score[1]
            else:
                if len(score) >= 2:
                    if score[0] > score[1]:
                        vincitore = squadra1
                    elif score[1] > score[0]:
                        vincitore = squadra2
                    # else => pareggio => vincitore=None

            # Crea la partita con vincitore determinato
            partita = Partita.objects.create(
                fase=fase,
                torneo=fase.torneo,
                squadra_rossa=squadra1,
                squadra_blu=squadra2,
                round_num=1,  # o quello che usi
                vincitore=vincitore,
                data_evento=timezone.now().date(),
                modalita="BO1",  # o "BO3"
                numero_partita_nella_serie=1,
                conclusa=False,
            )

            # Se salvi i punteggi in DB
            if hasattr(partita, 'punteggio_rossa') and hasattr(partita, 'punteggio_blu'):
                partita.punteggio_rossa = score[0]
                partita.punteggio_blu = score[1]

                # In caso di BYE, potresti forzare punteggio_rossa=1, punteggio_blu=0 (se rossa ha vinto) o viceversa
                if vincitore == squadra1 and squadra2 is None:
                    partita.punteggio_rossa = 1
                    partita.punteggio_blu = 0
                elif vincitore == squadra2 and squadra1 is None:
                    partita.punteggio_rossa = 0
                    partita.punteggio_blu = 1

                partita.save()

        return JsonResponse({'ok': True})
    except Exception as e:
        logger.error(f"[salva_bracket] Errore: {str(e)}")
        return JsonResponse({'errore': str(e)}, status=400)



@api_view(['POST'])
def aggiorna_risultato_partita(request, partita_id):
    """
    Se l'utente aggiorna i risultati da un'altra pagina, qui salvi punteggio e/o vincitore in DB.
    Poi il bracket (on-the-fly) userà 'vincitore' per mostrare 1-0, ecc.
    """
    try:
        logger.info(f"[aggiorna_risultato_partita] Richiesta update partita ID={partita_id}")
        partita = Partita.objects.get(id=partita_id)

        punteggio_rossa = int(request.data.get('punteggio_rossa', 0))
        punteggio_blu = int(request.data.get('punteggio_blu', 0))
        logger.debug(f"Input => punteggio_rossa={punteggio_rossa}, punteggio_blu={punteggio_blu}")

        # Se vuoi: aggiorna_risultato_singolo_match(partita, punteggio_rossa, punteggio_blu)
        # Oppure setti solo vincitore in base ai punteggi, es. per un BO1:
        if punteggio_rossa > punteggio_blu:
            partita.vincitore = partita.squadra_rossa
        elif punteggio_blu > punteggio_rossa:
            partita.vincitore = partita.squadra_blu
        else:
            partita.vincitore = None

        partita.save()

        p_data = PartitaSerializer(partita).data
        return Response(p_data, status=status.HTTP_200_OK)

    except Partita.DoesNotExist:
        logger.error(f"Partita ID={partita_id} non trovata.")
        return Response({"errore": "Partita non trovata"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Errore generico: {str(e)}")
        return Response({"errore": str(e)}, status=status.HTTP_400_BAD_REQUEST)
