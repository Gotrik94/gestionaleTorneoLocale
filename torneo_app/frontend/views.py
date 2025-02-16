from django.shortcuts import render

from django.shortcuts import render

from backend.models import Partita, Torneo, Squadra, Iscrizione


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

    # Debug nel terminale
    print("🏆 DEBUG: Home Page Loaded")
    print(f"Tornei Attivi: {totale_tornei}")
    print(f"Squadre Iscritte: {totale_squadre}")
    print(f"Partite Giocate: {totale_partite}")
    print(f"Ultimi Tornei: {ultimi_tornei}")
    for torneo in tornei_con_squadre:
        print(f"Torneo: {torneo['nome']} - Numero Squadre: {torneo['num_squadre']}")

    return render(request, 'modules/home/home.html', {
        'tornei_con_squadre': tornei_con_squadre,
        'totale_tornei': totale_tornei,
        'totale_squadre': totale_squadre,
        'totale_partite': totale_partite,
        'active_page': 'home'
    })



def test_page(request):
    return render(request, 'test.html')
