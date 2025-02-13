from flask import Blueprint

# Creiamo il blueprint principale
app_routes = Blueprint("app_routes", __name__)

# Importiamo i moduli delle routes
from routes.dashboard_routes import *
from routes.torneo_routes import *
from routes.squadra_routes import *
from routes.partita_routes import *
from routes.statistiche_routes import *
