from flask import Blueprint, render_template
from models import Torneo

dashboard_routes = Blueprint("dashboard_routes", __name__)

@dashboard_routes.route("/")
def dashboard():
    tornei = Torneo.query.all()
    return render_template("dashboard.html", active_page="dashboard", tornei=tornei)
