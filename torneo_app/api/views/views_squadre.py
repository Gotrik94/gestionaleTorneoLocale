from django.http import JsonResponse
from django.shortcuts import render
import logging

logger = logging.getLogger(__name__)

from backend.models import Squadra


def squadre_page(request):
    squadre = Squadra.objects.filter(is_active=True).order_by('-livello', '-exp')

    for squadra in squadre:
        squadra.exp_max = squadra.livello * 1000  # Formula base, puoi modificarla
        squadra.exp_percentage = (squadra.exp / squadra.exp_max) * 100 if squadra.exp_max > 0 else 0

    return render(request, 'modules/squadre/squadre.html', {'squadre': squadre, 'active_page': 'squadre'})


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

def modifica_squadra(request, squadra_id):
    if request.method == 'POST':
        try:
            squadra = Squadra.objects.get(id=squadra_id)

            # Log dei dati ricevuti
            logger.info(f"Dati ricevuti: nome={request.POST.get('nome')}, logo={request.FILES.get('logo')}")

            # Aggiorna i campi della squadra
            nome = request.POST.get('nome')
            logo = request.FILES.get('logo')

            if nome:
                squadra.nome = nome
            if logo:
                squadra.logo = logo

            squadra.save()
            logger.info(f"Squadra aggiornata: {squadra}")
            return JsonResponse({'message': 'Squadra modificata con successo'}, status=200)
        except Squadra.DoesNotExist:
            logger.error("Squadra non trovata")
            return JsonResponse({'error': 'Squadra non trovata'}, status=404)
        except Exception as e:
            logger.error(f"Errore durante la modifica della squadra: {e}")
            return JsonResponse({'error': 'Errore durante la modifica della squadra'}, status=500)
    return JsonResponse({'error': 'Metodo non permesso'}, status=405)

def elimina_squadra(request, squadra_id):
    if request.method == 'DELETE':
        try:
            squadra = Squadra.objects.get(id=squadra_id)
            squadra.is_active = False  # Imposta la squadra come inattiva
            squadra.save()
            return JsonResponse({'message': 'Squadra disattivata con successo'}, status=200)
        except Squadra.DoesNotExist:
            return JsonResponse({'error': 'Squadra non trovata'}, status=404)
    return JsonResponse({'error': 'Metodo non permesso'}, status=405)
