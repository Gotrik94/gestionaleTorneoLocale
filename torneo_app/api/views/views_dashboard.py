from datetime import date

from django.db.models.functions import Coalesce, Cast, Round
from django.http import JsonResponse
from backend.models import Torneo, Squadra, Iscrizione, StatisticheGiocatorePartita, Giocatore, Partita

from django.shortcuts import render
from django.db.models import Count, Sum, F, FloatField, Case, When, Q



def get_tornei_con_dati():

    oggi = date.today()

    tornei_attivi = Torneo.objects.filter(data_inizio__lte=oggi, data_fine__gte=oggi, is_active=True)
    tornei_attivi_counter = tornei_attivi.count()

    tornei_con_dati = []

    for torneo in tornei_attivi:
        squadre_iscritte = Iscrizione.objects.filter(torneo=torneo).select_related('squadra')
        squadre_dettagliate = []

        for iscrizione in squadre_iscritte:
            giocatori = list(StatisticheGiocatorePartita.objects.filter(
                partita__torneo=torneo,
                giocatore__squadra=iscrizione.squadra
            ).values('giocatore__nome').annotate(
                totale_k=Coalesce(Sum('kills'), 0),
                totale_d=Coalesce(Sum('deaths'), 0),
                totale_a=Coalesce(Sum('assists'), 0)
            ).annotate(
                kda=Round(
                    Case(
                        When(totale_d=0, then=F('totale_k') + F('totale_a')),
                        default=Cast(F('totale_k') + F('totale_a'), FloatField()) / Cast(Coalesce(F('totale_d'), 1), FloatField()),
                        output_field=FloatField()
                    ),
                    precision=2
                )
            ))

            squadre_dettagliate.append({
                'nome': iscrizione.squadra.nome,
                'giocatori': giocatori
            })

        tornei_con_dati.append({
            'id': torneo.id,
            'nome': torneo.nome,
            'data_inizio': torneo.data_inizio.strftime('%d/%m/%Y'),
            'data_fine': torneo.data_fine.strftime('%d/%m/%Y'),
            'formato': torneo.formato,
            'squadre': squadre_dettagliate,
            'num_squadre': len(squadre_dettagliate),
        })

    return tornei_con_dati

def get_riepilogo_tornei():
    squadra_con_piu_vittorie = (
        Squadra.objects.annotate(vittorie=Count('partite_vinte'))
            .order_by('-vittorie')
            .values('nome', 'vittorie')
            .first()
    )

    mvp_piu_votato = (
        Giocatore.objects.annotate(mvp_votes=Count('mvp'))
            .order_by('-mvp_votes')
            .values('nome', 'mvp_votes')
            .first()
    )

    return {
        'totale_tornei': Torneo.objects.filter(is_active=True).count(),
        'squadra_piu_vittorie': squadra_con_piu_vittorie['nome'] if squadra_con_piu_vittorie else "N/A",
        'mvp_piu_votato': mvp_piu_votato['nome'] if mvp_piu_votato else "N/A"
    }


def get_percentuali_vittorie():
    vittorie_blu = Partita.objects.filter(vincitore=F('squadra_blu')).count()
    vittorie_rosse = Partita.objects.filter(vincitore=F('squadra_rossa')).count()
    totale_partite = vittorie_blu + vittorie_rosse

    percentuale_blu = (vittorie_blu / totale_partite) * 100 if totale_partite > 0 else 0
    percentuale_rossa = (vittorie_rosse / totale_partite) * 100 if totale_partite > 0 else 0

    return percentuale_blu, percentuale_rossa


def get_tornei_events():
    tornei = Torneo.objects.filter(is_active=True)
    events = [
        {
            "title": torneo.nome,
            "start": torneo.data_inizio.strftime('%Y-%m-%d'),
            "end": torneo.data_fine.strftime('%Y-%m-%d'),
            "backgroundColor": "#FFC107",  # Giallo per evidenziare
            "borderColor": "#FFA000"
        }
        for torneo in tornei
    ]
    return JsonResponse(events, safe=False)


def dashboard_page_metrics(request):
    return render(request, 'modules/dashboard/dashboard.html', {
        'tornei': get_tornei_con_dati(),
        'riepilogo_tornei': get_riepilogo_tornei(),
        'percentuale_blu': get_percentuali_vittorie()[0],
        'percentuale_rossa': get_percentuali_vittorie()[1],
        'events': get_tornei_events(),
        'active_page': 'dashboard'
    })
