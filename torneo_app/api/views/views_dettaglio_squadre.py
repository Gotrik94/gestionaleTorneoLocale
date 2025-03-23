# views_dettaglio_squadre.py
import datetime
import json

from django.shortcuts import render, get_object_or_404
from django.db.models import Q, Sum, Count
from collections import defaultdict, Counter
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

def dettaglio_squadra(request, squadra_id):
    squadra = get_object_or_404(Squadra, id=squadra_id, is_active=True)
    oggi = datetime.date.today()

    # 1) Carichiamo tornei, giocatori e partite collegate
    iscrizioni = Iscrizione.objects.filter(squadra=squadra)
    tornei_partecipati = Torneo.objects.filter(id__in=iscrizioni.values("torneo_id"))
    tornei_in_corso = [t for t in tornei_partecipati if not t.data_fine or t.data_fine >= oggi]
    tornei_conclusi = [t for t in tornei_partecipati if t.data_fine and t.data_fine < oggi]

    giocatori = Giocatore.objects.filter(squadra=squadra)
    partite = Partita.objects.filter(Q(squadra_rossa=squadra) | Q(squadra_blu=squadra))

    # 2) Statistiche globali della squadra
    vittorie = partite.filter(vincitore=squadra).count()
    pareggi = partite.filter(vincitore__isnull=True).count()
    sconfitte = partite.count() - vittorie - pareggi

    # Draghi e baroni totali (per curiosità)
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

    # 3) Top pick e ban globali
    picks_globali = (PickBanPartita.objects
                     .filter(squadra=squadra, tipo='pick')
                     .values('campione_id')
                     .annotate(c=Count('id'))
                     .order_by('-c')[:5])
    top_picks = []
    for p in picks_globali:
        c = Campione.objects.filter(id=p['campione_id']).first()
        if c:
            top_picks.append({'campione': c, 'num_picks': p['c']})

    bans = PickBanPartita.objects.filter(squadra=squadra, tipo="ban")
    ban_counter = Counter(bans.values_list("campione__nome", flat=True))
    top_bans = [{"campione": Campione.objects.get(nome=k), "num_bans": v}
                for k, v in ban_counter.most_common(5)]

    # 4) Top picks per giocatore
    stats = (StatisticheGiocatorePartita.objects
             .filter(giocatore__in=giocatori)
             .values('giocatore_id', 'campione_usato_id')
             .annotate(n=Count('id'))
             .order_by('-n'))
    top_picks_per_giocatore = defaultdict(list)
    for s_item in stats:
        if len(top_picks_per_giocatore[s_item['giocatore_id']]) < 3:
            camp = Campione.objects.filter(id=s_item['campione_usato_id']).first()
            if camp:
                top_picks_per_giocatore[s_item['giocatore_id']].append((camp, s_item['n']))

    for g in giocatori:
        setattr(g, 'top_picks', top_picks_per_giocatore.get(g.id, []))

    # 5) Calcolo EXP e MVP
    exp_max = squadra.livello * 1000
    exp_percentuale = (squadra.exp / exp_max) * 100 if exp_max else 0

    mvp_counter = Counter()
    for p in partite:
        if p.mvp and p.mvp.squadra == squadra:
            mvp_counter[p.mvp.nome] += 1

    # 6) Andamento globale (ultime 10 partite)
    ultime_10_partite = partite.order_by('-data_evento')[:10]
    andamento_kda = []
    andamento_vittorie = []
    andamento_obiettivi = []
    date_labels = []

    for p in ultime_10_partite:
        stats_p = StatisticheGiocatorePartita.objects.filter(partita=p, giocatore__squadra=squadra)
        kills = sum(sp.kills for sp in stats_p)
        deaths = sum(sp.deaths for sp in stats_p)
        assists = sum(sp.assists for sp in stats_p)

        kda_partita = round((kills + assists) / max(1, deaths), 2)

        if p.vincitore == squadra:
            esito = 1
        elif p.vincitore is None:
            esito = 0
        else:
            esito = -1

        # Obiettivi
        if p.squadra_rossa == squadra:
            obj = p.draghi_rossa + p.baroni_rossa + p.araldo_rossa + p.drago_anziano_rossa
            if p.atakhan_taken == squadra:
                obj += 1
            obj += sum(sp.torri_distrutte for sp in stats_p)
        else:
            obj = p.draghi_blu + p.baroni_blu + p.araldo_blu + p.drago_anziano_blu
            if p.atakhan_taken == squadra:
                obj += 1
            obj += sum(sp.torri_distrutte for sp in stats_p)

        andamento_kda.append(kda_partita)
        andamento_vittorie.append(esito)
        andamento_obiettivi.append(obj)
        date_labels.append(p.data_evento.strftime("%d/%m"))

    # 7) Costruiamo un dizionario “dettagli” per ogni torneo
    dettagli_torneo_per_squadra = {}

    for torneo in tornei_partecipati:
        partite_t = (Partita.objects
                     .filter(torneo=torneo)
                     .filter(Q(squadra_rossa=squadra) | Q(squadra_blu=squadra))
                     .order_by('data_evento'))
        stats_t = StatisticheGiocatorePartita.objects.filter(partita__in=partite_t, giocatore__squadra=squadra)

        # MVP e pick/ban
        mvp_t = Counter(p.mvp.nome for p in partite_t if p.mvp and p.mvp.squadra == squadra)
        pick_t = (PickBanPartita.objects
                  .filter(partita__in=partite_t, squadra=squadra, tipo='pick')
                  .values('campione_id')
                  .annotate(c=Count('id'))
                  .order_by('-c')[:5])
        top_picks_t = [{'campione': Campione.objects.get(id=x['campione_id']), 'num_picks': x['c']} for x in pick_t]

        ban_t = (PickBanPartita.objects
                 .filter(partita__in=partite_t, squadra=squadra, tipo='ban')
                 .values('campione_id')
                 .annotate(c=Count('id'))
                 .order_by('-c')[:5])
        top_bans_t = [{'campione': Campione.objects.get(id=b['campione_id']), 'num_bans': b['c']} for b in ban_t]

        # Best players
        dps = stats_t.order_by('-danni_totali_campioni').first()
        tank = stats_t.order_by('-danni_presi_totali').first()
        visione = stats_t.order_by('-punteggio_visione').first()

        # GPM
        gpm_sorted = sorted(stats_t,
                            key=lambda s: (s.oro_totale or 0) / max(1, s.partita.durata_minuti or 1),
                            reverse=True)
        best_gpm = gpm_sorted[0] if gpm_sorted else None

        # first blood
        first = stats_t.filter(primo_sangue=True).count()
        tot_fs = stats_t.filter(primo_sangue__isnull=False).count()
        first_blood_pct = round((first / tot_fs) * 100, 2) if tot_fs else 0

        # Grafico obiettivi
        ob_graph_raw = []
        for pz in partite_t:
            s_qs = StatisticheGiocatorePartita.objects.filter(partita=pz, giocatore__squadra=squadra)
            ob_graph_raw.append({
                'data': pz.data_evento.strftime('%d/%m'),
                'torri': sum(x.torri_distrutte for x in s_qs),
                'draghi': pz.draghi_rossa if pz.squadra_rossa == squadra else pz.draghi_blu,
                'anziani': pz.drago_anziano_rossa if pz.squadra_rossa == squadra else pz.drago_anziano_blu,
                'baroni': pz.baroni_rossa if pz.squadra_rossa == squadra else pz.baroni_blu,
                'araldi': pz.araldo_rossa if pz.squadra_rossa == squadra else pz.araldo_blu,
                'atakhan': 1 if pz.atakhan_taken == squadra else 0
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

        # Andamento prestazioni per singolo torneo
        andamento_kda_t = []
        andamento_vittorie_t = []
        andamento_obiettivi_t = []
        date_labels_t = []

        # COSTRUIAMO anche la LISTA “partite_dettaglio” SPECIFICA per questo torneo
        arr_partite_enriched = []

        for pt in partite_t:
            stats_squadra = StatisticheGiocatorePartita.objects.filter(partita=pt, giocatore__squadra=squadra)
            kills = sum(sg.kills for sg in stats_squadra)
            deaths = sum(sg.deaths for sg in stats_squadra)
            assists = sum(sg.assists for sg in stats_squadra)
            kda_calc = round((kills + assists) / max(1, deaths), 2)

            if pt.vincitore == squadra:
                esito = "win"
            elif pt.vincitore is None:
                esito = "draw"
            else:
                esito = "loss"

            # Calcolo obiettivi
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
            andamento_vittorie_t.append(1 if esito == "win" else (0 if esito == "draw" else -1))
            andamento_obiettivi_t.append(obj)
            date_labels_t.append(pt.data_evento.strftime("%d/%m"))

            # Arricchiamo con loghi, picks, bans, roster
            logo_rossa = pt.squadra_rossa.logo.url if pt.squadra_rossa.logo else None
            logo_blu = pt.squadra_blu.logo.url if pt.squadra_blu.logo else None

            picks_rossa = PickBanPartita.objects.filter(partita=pt, squadra=pt.squadra_rossa, tipo='pick').order_by('ordine')
            picks_blu = PickBanPartita.objects.filter(partita=pt, squadra=pt.squadra_blu, tipo='pick').order_by('ordine')
            bans_rossa = PickBanPartita.objects.filter(partita=pt, squadra=pt.squadra_rossa, tipo='ban').order_by('ordine')
            bans_blu = PickBanPartita.objects.filter(partita=pt, squadra=pt.squadra_blu, tipo='ban').order_by('ordine')

            # Roster
            def build_roster(qs):
                data_r = []
                for st in qs:
                    data_r.append({
                        "giocatore_nome": st.giocatore.nome,
                        "campione_nome": st.campione_usato.nome,
                        "campione_img": st.campione_usato.immagine.url if st.campione_usato.immagine else None,
                        "kills": st.kills,
                        "deaths": st.deaths,
                        "assists": st.assists,
                        "kda": round((st.kills + st.assists) / max(1, st.deaths), 2)
                    })
                return data_r

            roster_rossa_raw = StatisticheGiocatorePartita.objects.filter(partita=pt, giocatore__squadra=pt.squadra_rossa)
            roster_blu_raw = StatisticheGiocatorePartita.objects.filter(partita=pt, giocatore__squadra=pt.squadra_blu)

            roster_rossa = build_roster(roster_rossa_raw)
            roster_blu = build_roster(roster_blu_raw)

            # Esempio di stats team rosso
            kills_rossa = sum(st.kills for st in roster_rossa_raw)
            deaths_rossa = sum(st.deaths for st in roster_rossa_raw)
            # ecc.

            # MVP e anima
            mvp_nome = pt.mvp.nome if pt.mvp else None
            anima_drago = pt.anima_drago_tipo
            atakhan_taken = pt.atakhan_taken.nome if pt.atakhan_taken else None

            # Creiamo il dizionario
            match_dict = {
                "id": pt.id,
                "data_evento": pt.data_evento,
                "durata": pt.durata_minuti,
                "squadra_rossa": pt.squadra_rossa.nome,
                "squadra_blu": pt.squadra_blu.nome,
                "logo_rossa": logo_rossa,
                "logo_blu": logo_blu,
                "esito": esito,
                "picks_rossa": picks_rossa,
                "picks_blu": picks_blu,
                "bans_rossa": bans_rossa,
                "bans_blu": bans_blu,
                "roster_rossa": roster_rossa,
                "roster_blu": roster_blu,
                "mvp": mvp_nome,
                "anima": anima_drago,
                "atakhan": atakhan_taken
            }
            arr_partite_enriched.append(match_dict)

        # Salviamo la lista arricchita
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
            'andamento_kda': andamento_kda_t,
            'andamento_vittorie': andamento_vittorie_t,
            'andamento_obiettivi': andamento_obiettivi_t,
            'date_labels': json.dumps(date_labels_t),
            # La lista di partite "arricchite" di loghi, pick, ban ecc.
            'partite_dettaglio': arr_partite_enriched
        }

    # Assegno i dettagli a ogni torneo
    for t in tornei_partecipati:
        t.dettagli = dettagli_torneo_per_squadra.get(t.id, {})

    # Costruzione context
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
        'andamento_kda': json.dumps(andamento_kda),
        'andamento_vittorie': json.dumps(andamento_vittorie),
        'andamento_obiettivi': json.dumps(andamento_obiettivi),
        'date_labels': json.dumps(date_labels),
        'mvp_giocatori': json.dumps(mvp_counter.most_common()),
        'dettagli_torneo_per_squadra': dettagli_torneo_per_squadra,
        'now': oggi,
    }

    return render(request, "modules/squadre/dettaglio_squadre/dettaglio_squadre.html", context)
