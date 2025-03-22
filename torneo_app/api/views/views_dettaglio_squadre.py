import datetime
import json

from django.shortcuts import render, get_object_or_404
from django.db.models import Q, Sum, Count
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

from backend.models.squadra import Squadra
from backend.models.iscrizione import Iscrizione
from backend.models.torneo import Torneo
from backend.models.partita import Partita
from backend.models.giocatore import Giocatore
from backend.models.statistiche_giocatore_partita import StatisticheGiocatorePartita
from backend.models.pickban import PickBanPartita
from backend.models.campione import Campione
from collections import Counter



def dettaglio_squadra(request, squadra_id):
    # 1) Recupera la squadra attiva
    squadra = get_object_or_404(Squadra, id=squadra_id, is_active=True)

    # 2) Tornei a cui la squadra è iscritta
    iscrizioni = Iscrizione.objects.filter(squadra=squadra)
    tornei_partecipati = Torneo.objects.filter(id__in=iscrizioni.values("torneo_id"))

    # 3) Partite in cui la squadra è coinvolta (rossa o blu)
    partite = Partita.objects.filter(
        Q(squadra_rossa=squadra) | Q(squadra_blu=squadra)
    )
    partite_totali = partite.count()

    # Conteggio totale degli MVP per ogni giocatore
    mvp_counter = Counter()

    # 4) Vittorie / Pareggi / Sconfitte
    vittorie = partite.filter(vincitore=squadra).count()
    pareggi = partite.filter(vincitore__isnull=True).count()
    sconfitte = partite_totali - vittorie - pareggi

    # 5) Draghi e Baroni totali
    draghi_rossa = partite.filter(squadra_rossa=squadra).aggregate(Sum('draghi_rossa'))['draghi_rossa__sum'] or 0
    draghi_blu = partite.filter(squadra_blu=squadra).aggregate(Sum('draghi_blu'))['draghi_blu__sum'] or 0
    draghi_totali = draghi_rossa + draghi_blu

    baroni_rossa = partite.filter(squadra_rossa=squadra).aggregate(Sum('baroni_rossa'))['baroni_rossa__sum'] or 0
    baroni_blu = partite.filter(squadra_blu=squadra).aggregate(Sum('baroni_blu'))['baroni_blu__sum'] or 0
    baroni_totali = baroni_rossa + baroni_blu

    # 6) Giocatori attivi della squadra
    giocatori = Giocatore.objects.filter(squadra=squadra)

    # 7) Statistiche globali (kills, deaths, assists)
    stats_globali = StatisticheGiocatorePartita.objects.filter(giocatore__in=giocatori).aggregate(
        kills=Sum('kills'),
        deaths=Sum('deaths'),
        assists=Sum('assists')
    )
    tot_kills = stats_globali['kills'] or 0
    tot_deaths = stats_globali['deaths'] or 0
    tot_assists = stats_globali['assists'] or 0

    if tot_deaths > 0:
        kda_squadra = round((tot_kills + tot_assists) / tot_deaths, 2)
    else:
        kda_squadra = tot_kills + tot_assists

    # 8) Dati per il grafico (Kills, Deaths, Assists, Draghi, Baroni)
    chart_data = [tot_kills, tot_deaths, tot_assists, draghi_totali, baroni_totali]

    # 9) Top 5 picks di squadra (da PickBanPartita, campo FK "campione")
    top_picks_qs = (
        PickBanPartita.objects
            .filter(squadra=squadra, tipo='pick')
            .values('campione_id')
            .annotate(num_picks=Count('campione_id'))
            .order_by('-num_picks')[:5]
    )
    top_picks = []
    for row in top_picks_qs:
        cid = row['campione_id']
        pick_count = row['num_picks']
        try:
            cobj = Campione.objects.get(id=cid)
            top_picks.append({'campione': cobj, 'num_picks': pick_count})
        except Campione.DoesNotExist:
            pass

    # Ban più frequenti (NUOVO)
    bans = PickBanPartita.objects.filter(squadra=squadra, tipo="ban")
    ban_counter = Counter(bans.values_list("campione__nome", flat=True))
    top_bans = [
        {"campione": Campione.objects.get(nome=camp), "num_bans": count}
        for camp, count in ban_counter.most_common(5)
    ]

    # 10) Top 3 picks per giocatore (da StatisticheGiocatorePartita, campo FK "campione_usato")
    picks_giocatori_qs = (
        StatisticheGiocatorePartita.objects
            .filter(giocatore__in=giocatori)
            .values('giocatore_id', 'campione_usato_id')
            .annotate(num_picks=Count('campione_usato_id'))
            .order_by('-num_picks')
    )
    logger.info("picks_giocatori_qs = %s", list(picks_giocatori_qs))

    temp_dict = defaultdict(list)
    for row in picks_giocatori_qs:
        gid = row['giocatore_id']
        cid = row['campione_usato_id']
        count = row['num_picks']
        temp_dict[gid].append((cid, count))
    logger.info("temp_dict (prima del top3) = %s", dict(temp_dict))

    top_picks_per_giocatore = {}
    for gid, pick_list in temp_dict.items():
        top3 = pick_list[:3]
        final_data = []
        for (camp_id, ccount) in top3:
            try:
                campione_obj = Campione.objects.get(id=camp_id)
                final_data.append((campione_obj, ccount))
            except Campione.DoesNotExist:
                pass
        top_picks_per_giocatore[gid] = final_data
    logger.info("top_picks_per_giocatore = %s", top_picks_per_giocatore)

    for g in giocatori:
        picks = top_picks_per_giocatore.get(g.id, [])
        # Assegniamo una proprietà 'top_picks' all'istanza Giocatore
        setattr(g, 'top_picks', picks)

    # 11) Percentuale EXP (livello * 1000)
    exp_max_squadra = squadra.livello * 1000
    exp_percentuale = (squadra.exp / exp_max_squadra) * 100 if exp_max_squadra > 0 else 0

    for partita in partite:
        if partita.mvp and partita.mvp.squadra == squadra:
            mvp_counter[partita.mvp.nome] += 1

    # Ottenere le ultime 10 partite della squadra
    partite = Partita.objects.filter(squadra_rossa=squadra) | Partita.objects.filter(squadra_blu=squadra)
    partite = partite.order_by('-data_evento')[:10]

    andamento_kda = []
    andamento_vittorie = []
    andamento_obiettivi = []
    date_labels = []

    for partita in partite:
        statistiche = StatisticheGiocatorePartita.objects.filter(partita=partita, giocatore__squadra=squadra)

        total_kills = sum(stat.kills for stat in statistiche)
        total_deaths = sum(stat.deaths for stat in statistiche)
        total_assists = sum(stat.assists for stat in statistiche)

        kda_medio = (total_kills + total_assists) / max(1, total_deaths)

        risultato = 1 if partita.vincitore == squadra else (0 if partita.vincitore is None else -1)

        # Conteggio delle torri distrutte dai giocatori della squadra
        torri_distrutte = sum(stat.torri_distrutte for stat in statistiche)

        obiettivi = (
            partita.draghi_rossa
            + partita.draghi_blu
            + partita.baroni_rossa
            + partita.baroni_blu
            + partita.araldo_rossa
            + partita.araldo_blu
            + partita.drago_anziano_rossa
            + partita.drago_anziano_blu
            + (1 if partita.atakhan_taken == squadra else 0)  # Atakhan conteggiato solo se preso dalla squadra
            + torri_distrutte  # Aggiungiamo le torri distrutte
        )

        andamento_kda.append(round(kda_medio, 2))
        andamento_vittorie.append(risultato)
        andamento_obiettivi.append(obiettivi)
        date_labels.append(partita.data_evento.strftime("%d/%m"))


    context = {
        'squadra': squadra,
        'tornei_partecipati': tornei_partecipati,
        'partite_totali': partite_totali,
        'vittorie': vittorie,
        'pareggi': pareggi,
        'sconfitte': sconfitte,
        'draghi_totali': draghi_totali,
        'baroni_totali': baroni_totali,
        'giocatori': giocatori,
        'tot_kills': tot_kills,
        'tot_deaths': tot_deaths,
        'tot_assists': tot_assists,
        'kda_squadra': kda_squadra,
        'chart_data': chart_data,
        'top_picks': top_picks,
        'top_picks_per_giocatore': top_picks_per_giocatore,
        'exp_percentuale': exp_percentuale,
        'now': datetime.date.today(),
        "top_bans": top_bans,
        "andamento_kda": json.dumps(andamento_kda),  # Convertito in JSON puro
        "andamento_vittorie": json.dumps(andamento_vittorie),
        "andamento_obiettivi": json.dumps(andamento_obiettivi),
        "date_labels": json.dumps(date_labels),  # Evita problemi di encoding con date
        "mvp_giocatori": json.dumps(mvp_counter.most_common()),
    }

    return render(request, "modules/squadre/dettaglio_squadre/dettaglio_squadre.html", context)
