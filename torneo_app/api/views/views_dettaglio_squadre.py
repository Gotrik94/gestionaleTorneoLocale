import datetime
import json

from django.shortcuts import render, get_object_or_404
from django.db.models import Q, Sum, Count
from collections import defaultdict
from datetime import date
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
    squadra = get_object_or_404(Squadra, id=squadra_id, is_active=True)
    oggi = datetime.date.today()

    # Iscrizioni e tornei
    iscrizioni = Iscrizione.objects.filter(squadra=squadra)
    tornei_partecipati = Torneo.objects.filter(id__in=iscrizioni.values("torneo_id"))
    tornei_in_corso = [t for t in tornei_partecipati if not t.data_fine or t.data_fine >= oggi]
    tornei_conclusi = [t for t in tornei_partecipati if t.data_fine and t.data_fine < oggi]

    # Giocatori e partite
    giocatori = Giocatore.objects.filter(squadra=squadra)
    partite = Partita.objects.filter(Q(squadra_rossa=squadra) | Q(squadra_blu=squadra))

    # Statistiche globali
    vittorie = partite.filter(vincitore=squadra).count()
    pareggi = partite.filter(vincitore__isnull=True).count()
    sconfitte = partite.count() - vittorie - pareggi

    draghi = partite.aggregate(Sum('draghi_rossa'), Sum('draghi_blu'))
    baroni = partite.aggregate(Sum('baroni_rossa'), Sum('baroni_blu'))
    draghi_totali = sum(v for v in draghi.values() if v)
    baroni_totali = sum(v for v in baroni.values() if v)

    stats_globali = StatisticheGiocatorePartita.objects.filter(giocatore__in=giocatori).aggregate(
        kills=Sum('kills'),
        deaths=Sum('deaths'),
        assists=Sum('assists')
    )
    tot_kills = stats_globali['kills'] or 0
    tot_deaths = stats_globali['deaths'] or 0
    tot_assists = stats_globali['assists'] or 0
    kda_squadra = round((tot_kills + tot_assists) / max(tot_deaths, 1), 2)

    # Top pick e ban globali
    top_picks = []
    picks_globali = (
        PickBanPartita.objects.filter(squadra=squadra, tipo='pick')
        .values('campione_id')
        .annotate(c=Count('id'))
        .order_by('-c')[:5]
    )
    for p in picks_globali:
        c = Campione.objects.filter(id=p['campione_id']).first()
        if c:
            top_picks.append({'campione': c, 'num_picks': p['c']})

    bans = PickBanPartita.objects.filter(squadra=squadra, tipo="ban")
    ban_counter = Counter(bans.values_list("campione__nome", flat=True))
    top_bans = [
        {"campione": Campione.objects.get(nome=k), "num_bans": v}
        for k, v in ban_counter.most_common(5)
    ]

    # Top picks per singolo giocatore
    stats = (
        StatisticheGiocatorePartita.objects.filter(giocatore__in=giocatori)
        .values('giocatore_id', 'campione_usato_id')
        .annotate(n=Count('id'))
        .order_by('-n')
    )
    top_picks_per_giocatore = defaultdict(list)
    for s_item in stats:
        if len(top_picks_per_giocatore[s_item['giocatore_id']]) < 3:
            c = Campione.objects.filter(id=s_item['campione_usato_id']).first()
            if c:
                top_picks_per_giocatore[s_item['giocatore_id']].append((c, s_item['n']))
    for g in giocatori:
        setattr(g, 'top_picks', top_picks_per_giocatore.get(g.id, []))

    # Calcolo EXP
    exp_max = squadra.livello * 1000
    exp_percentuale = (squadra.exp / exp_max) * 100 if exp_max > 0 else 0

    # MVP totali
    mvp_counter = Counter()
    for p in partite:
        if p.mvp and p.mvp.squadra == squadra:
            mvp_counter[p.mvp.nome] += 1

    # Andamento globale (ultime 10 partite)
    andamento_kda = []
    andamento_vittorie = []
    andamento_obiettivi = []
    date_labels = []

    # Ordinamento discendente e prendi le ultime 10
    ultime_10_partite = partite.order_by('-data_evento')[:10]

    for p in ultime_10_partite:
        stats_p = StatisticheGiocatorePartita.objects.filter(partita=p, giocatore__squadra=squadra)
        k = sum(sg.kills for sg in stats_p)
        d = sum(sg.deaths for sg in stats_p)
        a = sum(sg.assists for sg in stats_p)

        # KDA
        kda_partita = round((k + a) / max(d, 1), 2)

        # Esito: 1 se vinta, 0 se pareggio, -1 se persa
        if p.vincitore == squadra:
            esito = 1
        elif p.vincitore is None:
            esito = 0
        else:
            esito = -1

        # Obiettivi presi
        if p.squadra_rossa == squadra:
            obj = p.draghi_rossa + p.baroni_rossa + p.araldo_rossa + p.drago_anziano_rossa
            if p.atakhan_taken == squadra:
                obj += 1
            obj += sum(sg.torri_distrutte for sg in stats_p)
        else:
            obj = p.draghi_blu + p.baroni_blu + p.araldo_blu + p.drago_anziano_blu
            if p.atakhan_taken == squadra:
                obj += 1
            obj += sum(sg.torri_distrutte for sg in stats_p)

        andamento_kda.append(kda_partita)
        andamento_vittorie.append(esito)
        andamento_obiettivi.append(obj)
        date_labels.append(p.data_evento.strftime("%d/%m"))

    # Dettagli su ogni torneo
    dettagli_torneo_per_squadra = {}

    for torneo in tornei_partecipati:
        partite_t = (
            Partita.objects.filter(torneo=torneo)
            .filter(Q(squadra_rossa=squadra) | Q(squadra_blu=squadra))
            .order_by('data_evento')
        )
        stats_t = StatisticheGiocatorePartita.objects.filter(
            partita__in=partite_t, giocatore__squadra=squadra
        )

        # MVP, picks, bans, best players
        mvp_t = Counter(p.mvp.nome for p in partite_t if p.mvp and p.mvp.squadra == squadra)

        pick_t = (
            PickBanPartita.objects.filter(partita__in=partite_t, squadra=squadra, tipo='pick')
            .values('campione_id')
            .annotate(c=Count('id'))
            .order_by('-c')[:5]
        )
        top_picks_t = [
            {'campione': Campione.objects.get(id=p['campione_id']), 'num_picks': p['c']}
            for p in pick_t
        ]

        ban_t = (
            PickBanPartita.objects.filter(partita__in=partite_t, squadra=squadra, tipo='ban')
            .values('campione_id')
            .annotate(c=Count('id'))
            .order_by('-c')[:5]
        )
        top_bans_t = [
            {'campione': Campione.objects.get(id=b['campione_id']), 'num_bans': b['c']}
            for b in ban_t
        ]

        dps = stats_t.order_by('-danni_totali_campioni').first()
        tank = stats_t.order_by('-danni_presi_totali').first()
        visione = stats_t.order_by('-punteggio_visione').first()

        # Calcolo GPM
        gpm = sorted(
            stats_t,
            key=lambda s: (s.oro_totale or 0) / max(1, s.partita.durata_minuti or 1),
            reverse=True
        )
        best_gpm = gpm[0] if gpm else None

        first = stats_t.filter(primo_sangue=True).count()
        tot_fs = stats_t.filter(primo_sangue__isnull=False).count()
        first_blood_pct = round((first / tot_fs) * 100, 2) if tot_fs else 0

        # Grafico obiettivi
        ob_graph_raw = []
        for p in partite_t:
            s = StatisticheGiocatorePartita.objects.filter(partita=p, giocatore__squadra=squadra)
            ob_graph_raw.append({
                'data': p.data_evento.strftime('%d/%m'),
                'torri': sum(x.torri_distrutte for x in s),
                'draghi': p.draghi_rossa if p.squadra_rossa == squadra else p.draghi_blu,
                'anziani': p.drago_anziano_rossa if p.squadra_rossa == squadra else p.drago_anziano_blu,
                'baroni': p.baroni_rossa if p.squadra_rossa == squadra else p.baroni_blu,
                'araldi': p.araldo_rossa if p.squadra_rossa == squadra else p.araldo_blu,
                'atakhan': 1 if p.atakhan_taken == squadra else 0
            })
        ob_graph = {
            'labels': json.dumps([x['data'] for x in ob_graph_raw]),
            'torri': json.dumps([x['torri'] for x in ob_graph_raw]),
            'draghi': json.dumps([x['draghi'] for x in ob_graph_raw]),
            'baroni': json.dumps([x['baroni'] for x in ob_graph_raw]),
            'araldi': json.dumps([x['araldi'] for x in ob_graph_raw]),
            'anziani': json.dumps([x['anziani'] for x in ob_graph_raw]),
            'atakhan': json.dumps([x['atakhan'] for x in ob_graph_raw]),
        }

        # Andamento Prestazioni per questo torneo
        andamento_kda_t = []
        andamento_vittorie_t = []
        andamento_obiettivi_t = []
        date_labels_t = []

        # Se NON ci sono partite, rimarranno liste vuote (OK)
        for pt in partite_t:
            stats_squadra = StatisticheGiocatorePartita.objects.filter(partita=pt, giocatore__squadra=squadra)

            kills = sum(sg.kills for sg in stats_squadra)
            deaths = sum(sg.deaths for sg in stats_squadra)
            assists = sum(sg.assists for sg in stats_squadra)
            kda_calc = round((kills + assists) / max(1, deaths), 2)

            if pt.vincitore == squadra:
                esito = 1
            elif pt.vincitore is None:
                esito = 0
            else:
                esito = -1

            if pt.squadra_rossa == squadra:
                obj = pt.draghi_rossa + pt.baroni_rossa + pt.araldo_rossa + pt.drago_anziano_rossa
                if pt.atakhan_taken == squadra:
                    obj += 1
                obj += sum(sg.torri_distrutte for sg in stats_squadra)
            else:
                obj = pt.draghi_blu + pt.baroni_blu + pt.araldo_blu + pt.drago_anziano_blu
                if pt.atakhan_taken == squadra:
                    obj += 1
                obj += sum(sg.torri_distrutte for sg in stats_squadra)

            andamento_kda_t.append(kda_calc)
            andamento_vittorie_t.append(esito)
            andamento_obiettivi_t.append(obj)
            date_labels_t.append(pt.data_evento.strftime("%d/%m"))

        # Salva dettagli nel dizionario
        dettagli_torneo_per_squadra[torneo.id] = {
            'partite': partite_t,
            'mvp': dict(mvp_t),
            'top_picks': top_picks_t,
            'top_bans': top_bans_t,
            'grafico_obiettivi': ob_graph,
            'best_players': {
                'dps': dps.giocatore.nome if dps else None,
                'tank': tank.giocatore.nome if tank else None,
                'visione': visione.giocatore.nome if visione else None,
                'gpm': best_gpm.giocatore.nome if best_gpm else None
            },
            'first_blood_pct': first_blood_pct,
            'totali': {
                'partite': partite_t.count(),
                'vittorie': partite_t.filter(vincitore=squadra).count(),
                'pareggi': partite_t.filter(vincitore__isnull=True).count(),
                'sconfitte': partite_t.count()
                             - partite_t.filter(vincitore=squadra).count()
                             - partite_t.filter(vincitore__isnull=True).count()
            },
            # Dati per il grafico “Andamento Prestazioni” del singolo torneo
            'andamento_kda': andamento_kda_t,
            'andamento_vittorie': andamento_vittorie_t,
            'andamento_obiettivi': andamento_obiettivi_t,
            'date_labels': json.dumps(date_labels_t),
            # Se vuoi aggiungere altre info personalizzate
            'partite_dettaglio': []
        }

    # Assegna i dettagli al field .dettagli di ciascun torneo
    for t in tornei_partecipati:
        t.dettagli = dettagli_torneo_per_squadra.get(t.id, {})

    partite_dettaglio = []

    for p in partite_t:  # partite_t = le partite del torneo o della squadra
        # Determino esito
        if p.vincitore == squadra:
            esito = "win"
        elif p.vincitore is None:
            esito = "draw"
        else:
            esito = "loss"

        # Carico loghi squadre
        logo_rossa = p.squadra_rossa.logo.url if p.squadra_rossa.logo else None
        logo_blu = p.squadra_blu.logo.url if p.squadra_blu.logo else None

        # Pick/Ban: recuperiamo i 5 pick e ban di ogni team
        picks_rossa = PickBanPartita.objects.filter(partita=p, squadra=p.squadra_rossa, tipo='pick').order_by('ordine')
        picks_blu = PickBanPartita.objects.filter(partita=p, squadra=p.squadra_blu, tipo='pick').order_by('ordine')
        bans_rossa = PickBanPartita.objects.filter(partita=p, squadra=p.squadra_rossa, tipo='ban').order_by('ordine')
        bans_blu = PickBanPartita.objects.filter(partita=p, squadra=p.squadra_blu, tipo='ban').order_by('ordine')

        # Roster e statistiche. Filtriamo StatisticheGiocatorePartita
        roster_rossa_raw = StatisticheGiocatorePartita.objects.filter(partita=p, giocatore__squadra=p.squadra_rossa)
        roster_blu_raw = StatisticheGiocatorePartita.objects.filter(partita=p, giocatore__squadra=p.squadra_blu)

        # Trasformiamo in una lista di dizionari con K, D, A, campione, ecc.
        def build_roster(stats_qs):
            roster_data = []
            for st in stats_qs:
                roster_data.append({
                    "giocatore_nome": st.giocatore.nome,
                    "campione_nome": st.campione_usato.nome,
                    "campione_img": st.campione_usato.immagine.url if st.campione_usato.immagine else None,
                    "kills": st.kills,
                    "deaths": st.deaths,
                    "assists": st.assists,
                    "kda": round((st.kills + st.assists) / max(st.deaths, 1), 2)
                })
            return roster_data

        roster_rossa = build_roster(roster_rossa_raw)
        roster_blu = build_roster(roster_blu_raw)

        # Statistiche di Team
        # kill/assist/morti totali
        kills_rossa = sum(st.kills for st in roster_rossa_raw)
        deaths_rossa = sum(st.deaths for st in roster_rossa_raw)
        assists_rossa = sum(st.assists for st in roster_rossa_raw)
        danno_rossa = sum(st.danni_totali_campioni for st in roster_rossa_raw)
        visione_rossa = sum(st.punteggio_visione for st in roster_rossa_raw)

        # puoi fare lo stesso per blu
        kills_blu = ...
        # e così via.

        # Calcolo gold per minuto: sommo l’oro di tutti, diviso la durata e i giocatori, se necessario
        # Oppure gold totali di team: sum(st.oro_totale)...

        # Atakhan e anima
        atakhan_taken = (p.atakhan_taken.nome if p.atakhan_taken else None)
        anima_drago = p.anima_drago_tipo  # e p.anima_drago_id

        # MVP
        mvp_nome = p.mvp.nome if p.mvp else None

        # Salviamo tutto
        partite_dettaglio.append({
            "id": p.id,
            "data_evento": p.data_evento,
            "durata": p.durata_minuti,
            "squadra_rossa": p.squadra_rossa.nome,
            "squadra_blu": p.squadra_blu.nome,
            "logo_rossa": logo_rossa,
            "logo_blu": logo_blu,
            "esito": esito,  # "win"/"draw"/"loss" se la "squadra" in contesto ha vinto o meno
            "picks_rossa": picks_rossa,  # puoi trasformarli in un array di {campione, ...} se preferisci
            "picks_blu": picks_blu,
            "bans_rossa": bans_rossa,
            "bans_blu": bans_blu,
            "roster_rossa": roster_rossa,
            "roster_blu": roster_blu,
            "kills_rossa": kills_rossa,
            "assists_rossa": assists_rossa,
            "deaths_rossa": deaths_rossa,
            "danno_rossa": danno_rossa,
            "visione_rossa": visione_rossa,
            # e lo stesso per blu
            "atakhan": atakhan_taken,
            "anima": anima_drago,
            "mvp": mvp_nome,
            # e così via.
        })

    context = {
        'squadra': squadra,
        'tornei_partecipati': tornei_partecipati,
        'tornei_in_corso': tornei_in_corso,
        'tornei_conclusi': tornei_conclusi,
        'partite_totali': partite.count(),
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
        'chart_data': [tot_kills, tot_deaths, tot_assists],
        'top_picks': top_picks,
        'top_bans': top_bans,
        'top_picks_per_giocatore': top_picks_per_giocatore,
        'exp_percentuale': exp_percentuale,
        # Grafico globale: JSON-serializzo le 4 liste
        'andamento_kda': json.dumps(andamento_kda),
        'andamento_vittorie': json.dumps(andamento_vittorie),
        'andamento_obiettivi': json.dumps(andamento_obiettivi),
        'date_labels': json.dumps(date_labels),
        'mvp_giocatori': json.dumps(mvp_counter.most_common()),
        'dettagli_torneo_per_squadra': dettagli_torneo_per_squadra,
        "partite_dettaglio": partite_dettaglio,
        'now': oggi,
    }

    return render(request, "modules/squadre/dettaglio_squadre/dettaglio_squadre.html", context)
