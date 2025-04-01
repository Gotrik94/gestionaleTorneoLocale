from django.db.models import Count

from backend.models import Squadra, Giocatore


def get_squadra_con_piu_vittorie():
    return (
        Squadra.objects.annotate(vittorie=Count('partite_vinte'))
        .order_by('-vittorie')
        .values('nome', 'vittorie')
        .first()
    )

def get_mvp_piu_votato():
    return (
        Giocatore.objects.annotate(mvp_votes=Count('partite_mvp'))
        .order_by('-mvp_votes')
        .values('nome', 'mvp_votes')
        .first()
    )