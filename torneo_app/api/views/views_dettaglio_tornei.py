from django.shortcuts import render, get_object_or_404

from backend.models import Partita, Iscrizione, Torneo


def dettaglio_torneo(request, torneo_id):

    torneo = get_object_or_404(Torneo, id=torneo_id)
    iscrizioni = Iscrizione.objects.filter(torneo=torneo)
    #squadre = [iscrizione.squadra for iscrizione in iscrizioni]
    #partite = Partita.objects.filter(torneo=torneo).order_by('data_ora')


    return render(request, "modules/tornei/dettaglio_tornei/dettaglio_tornei.html", {
        'torneo': torneo,
        #'squadre': squadre,
        #'partite': partite,
        'active_page': 'tornei'
    })
