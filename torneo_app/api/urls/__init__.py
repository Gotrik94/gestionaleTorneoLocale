from .urls_tornei import urlpatterns as tornei_urls
from .urls_squadre import urlpatterns as squadre_urls
from .urls_giocatori import urlpatterns as giocatori_urls
from .urls_partite import urlpatterns as partite_urls
from .urls_pickban import urlpatterns as pickban_urls
from .urls_nota_partita import urlpatterns as notapartita_urls
from .urls_statistiche_giocatore_partita import urlpatterns as statistiche_urls
from .urls_iscrizione import urlpatterns as iscrizione_urls

urlpatterns = []
urlpatterns += tornei_urls
urlpatterns += squadre_urls
urlpatterns += giocatori_urls
urlpatterns += partite_urls
urlpatterns += pickban_urls
urlpatterns += notapartita_urls
urlpatterns += statistiche_urls
urlpatterns += iscrizione_urls
