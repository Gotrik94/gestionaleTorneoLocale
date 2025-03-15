from django.http import JsonResponse
from django.shortcuts import render

from backend.models import Squadra


def squadre_page(request):
    squadre = Squadra.objects.filter(is_active=True).order_by('-livello', '-exp')

    for squadra in squadre:
        squadra.exp_max = squadra.livello * 1000  # Formula base, puoi modificarla
        squadra.exp_percentage = (squadra.exp / squadra.exp_max) * 100 if squadra.exp_max > 0 else 0

    return render(request, 'modules/squadre/squadre.html', {'squadre': squadre})


def crea_squadra(request):
    if request.method == "POST":
        try:
            nome = request.POST.get("nome")
            data_iscrizione = request.POST.get("data_iscrizione")
            logo = request.FILES.get("logo")

            if not nome or not data_iscrizione or not logo:
                return JsonResponse({"success": False, "error": "Tutti i campi sono obbligatori"}, status=400)

            nuova_squadra = Squadra(
                nome=nome,
                data_iscrizione=data_iscrizione,
                logo=logo,
                livello=1,  # Il livello inizia da 1
                exp=0  # L'EXP inizia da 0
            )
            nuova_squadra.save()

            return JsonResponse({"success": True, "message": "Squadra creata con successo!"})

        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=500)

    return JsonResponse({"success": False, "error": "Metodo non consentito"}, status=405)
