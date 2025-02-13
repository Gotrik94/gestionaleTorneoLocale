from flask import Blueprint, render_template
from models import db, Torneo, PickBanPartita
from sqlalchemy.sql import func

statistiche_routes = Blueprint("statistiche_routes", __name__)

# 📌 Statistiche tornei
@statistiche_routes.route("/statistiche")
def statistiche():
    tornei = Torneo.query.all()

    # 📌 Campioni più pickati overall
    top_pickati = db.session.query(
        PickBanPartita.campione, func.count(PickBanPartita.campione).label("count")
    ).filter(
        PickBanPartita.tipo == "pick"
    ).group_by(PickBanPartita.campione).order_by(func.count(PickBanPartita.campione).desc()).limit(5).all()

    # 📌 Campioni più bannati overall
    top_bannati = db.session.query(
        PickBanPartita.campione, func.count(PickBanPartita.campione).label("count")
    ).filter(
        PickBanPartita.tipo == "ban"
    ).group_by(PickBanPartita.campione).order_by(func.count(PickBanPartita.campione).desc()).limit(5).all()

    return render_template("statistiche.html", tornei=tornei, top_pickati=top_pickati, top_bannati=top_bannati)
