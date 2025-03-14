from django.shortcuts import render
from backend.models import Torneo, Squadra, Partita, Iscrizione

def home(request):
    ultimi_tornei = Torneo.objects.filter(is_active=True).order_by('-data_inizio')[:4]
    totale_tornei = Torneo.objects.filter(is_active=True).count()
    totale_squadre = Squadra.objects.count()
    totale_partite = Partita.objects.filter(conclusa=True).count()

    tornei_con_squadre = [
        {
            'nome': torneo.nome,
            'data_inizio': torneo.data_inizio,
            'num_squadre': Iscrizione.objects.filter(torneo=torneo).count()
        }
        for torneo in ultimi_tornei
    ]

    return render(request, 'modules/home/home.html', {
        'tornei_con_squadre': tornei_con_squadre,
        'totale_tornei': totale_tornei,
        'totale_squadre': totale_squadre,
        'totale_partite': totale_partite,
        'active_page': 'home'
    })
