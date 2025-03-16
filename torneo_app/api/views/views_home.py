from datetime import date

from django.shortcuts import render
from backend.models import Torneo, Squadra, Partita, Iscrizione

def home(request):
    oggi = date.today()

    ultimi_tornei = Torneo.objects.filter(is_active=True).order_by('-data_inizio')[:4]
    tornei_attivi = Torneo.objects.filter(data_inizio__lte=oggi, data_fine__gte=oggi, is_active=True)
    tornei_attivi_counter = tornei_attivi.count()
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
        'tornei_attivi': tornei_attivi_counter,
        'totale_squadre': totale_squadre,
        'totale_partite': totale_partite,
        'active_page': 'home'
    })
