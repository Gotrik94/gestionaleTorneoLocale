from django.db.models import Sum, Count, Q, F
from django.shortcuts import render

from django.shortcuts import render

from backend.models import Partita, Torneo, Squadra, Iscrizione, StatisticheGiocatorePartita, Giocatore


def home(request):
    ultimi_tornei = Torneo.objects.order_by('-data_inizio')[:3]
    totale_tornei = Torneo.objects.count()
    totale_squadre = Squadra.objects.count()
    totale_partite = Partita.objects.count()

    # Recupera il numero di squadre per ogni torneo
    tornei_con_squadre = []
    for torneo in ultimi_tornei:
        num_squadre = Iscrizione.objects.filter(torneo=torneo).count()
        tornei_con_squadre.append({
            'nome': torneo.nome,
            'data_inizio': torneo.data_inizio,
            'num_squadre': num_squadre  # Numero di squadre iscritte
        })

    return render(request, 'modules/home/home.html', {
        'tornei_con_squadre': tornei_con_squadre,
        'totale_tornei': totale_tornei,
        'totale_squadre': totale_squadre,
        'totale_partite': totale_partite,
        'active_page': 'home'
    })


def dashboard_page(request):
    tornei = Torneo.objects.filter(is_active=True)

    totale_tornei = tornei.count()

    tornei_con_dati = []
    for torneo in tornei:
        squadre_iscritte = Iscrizione.objects.filter(torneo=torneo).select_related('squadra')

        squadre_dettagliate = []
        for iscrizione in squadre_iscritte:
            squadra = iscrizione.squadra
            # 🔥 Filtra le statistiche SOLO per il torneo attuale
            giocatori = StatisticheGiocatorePartita.objects.filter(
                partita__torneo=torneo,  # Filtra per il torneo specifico
                giocatore__squadra=squadra
            ).values(
                'giocatore__nome'
            ).annotate(
                totale_k=Sum('kills'),
                totale_d=Sum('deaths'),
                totale_a=Sum('assists')
            )

            squadre_dettagliate.append({
                'nome': squadra.nome,
                'giocatori': list(giocatori)
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

        # 📌 Totale tornei attivi
        totale_tornei = tornei.count()

        # 📌 Squadra con più vittorie
        squadra_con_piu_vittorie = (
            Squadra.objects.annotate(vittorie=Count('partite_vinte'))
                .order_by('-vittorie')
                .values('nome', 'vittorie')
                .first()
        )

        # 📌 MVP più votato (sommiamo i voti nelle partite)
        mvp_piu_votato = (
            Giocatore.objects.annotate(mvp_votes=Count('mvp'))  # ✅ Usa il nuovo related_name
                .order_by('-mvp_votes')
                .values('nome', 'mvp_votes')
                .first()
        )

        riepilogo_tornei = {
            'totale_tornei': totale_tornei,
            'squadra_piu_vittorie': squadra_con_piu_vittorie['nome'] if squadra_con_piu_vittorie else "N/A",
            'mvp_piu_votato': mvp_piu_votato['nome'] if mvp_piu_votato else "N/A"
        }

    return render(request, 'modules/dashboard/dashboard.html', {
        'tornei': tornei_con_dati,
        'riepilogo_tornei': riepilogo_tornei,
        'active_page': 'dashboard'
    })
