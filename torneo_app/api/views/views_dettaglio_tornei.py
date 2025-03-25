from django.shortcuts import render

def dettaglio_torneo(request, torneo_id):


    context = {
        'active_page': 'tornei',
    }

    return render(request, "modules/tornei/dettaglio_tornei/dettaglio_tornei.html", context)
