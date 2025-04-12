from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Case, When, F, IntegerField, Q


# ✅ View HTML classica
from backend.models.classifica_torneo import ClassificaTorneo
from backend.serializers.classifica_torneo import ClassificaTorneoSerializer


def classifica_view(request, torneo_id):
    queryset = ClassificaTorneo.objects.filter(torneo_id=torneo_id)

    classifica = queryset.annotate(
        vittorie=Count(Case(When(partita__vincitore=F('squadra'), then=1), output_field=IntegerField())),
        pareggi=Count(Case(When(Q(partita__punteggio_rossa=F('partita__punteggio_blu')), then=1), output_field=IntegerField())),
        sconfitte=Count(Case(
            When(
                Q(partita__vincitore__isnull=False) &
                ~Q(partita__vincitore=F('squadra')),
                then=1
            ),
            output_field=IntegerField()
        ))
    ).order_by('-punti', '-vittorie')

    return render(request, 'modules/classifica/classifica_torneo.html', {
        'classifica': classifica,
        'active_page': 'classifica'
    })


# ✅ API JSON con DRF
class ClassificaTorneoView(APIView):
    def get(self, request, torneo_id, fase_id=None, girone_id=None):
        queryset = ClassificaTorneo.objects.filter(torneo_id=torneo_id)

        if fase_id:
            queryset = queryset.filter(fase_id=fase_id)
        if girone_id:
            queryset = queryset.filter(girone_id=girone_id)

        classifica = queryset.annotate(
            vittorie=Count(Case(When(partita__vincitore=F('squadra'), then=1), output_field=IntegerField())),
            pareggi=Count(Case(When(Q(partita__punteggio_rossa=F('partita__punteggio_blu')), then=1), output_field=IntegerField())),
            sconfitte=Count(Case(
                When(
                    Q(partita__vincitore__isnull=False) &
                    ~Q(partita__vincitore=F('squadra')),
                    then=1
                ),
                output_field=IntegerField()
            ))
        ).order_by('-punti', '-vittorie')

        serializer = ClassificaTorneoSerializer(classifica, many=True)
        return Response(serializer.data)
