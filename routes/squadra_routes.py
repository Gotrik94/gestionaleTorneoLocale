from flask import Blueprint, render_template, request, redirect, url_for, flash
from models import db, Squadra
from forms import SquadraForm

squadra_routes = Blueprint("squadra_routes", __name__)

# 📌 Gestione squadre
@squadra_routes.route("/gestione_squadre", methods=["GET", "POST"])
def gestione_squadre():
    form = SquadraForm()
    if form.validate_on_submit():
        squadra = Squadra(nome=form.nome.data, torneo_id=form.torneo_id.data)
        db.session.add(squadra)
        db.session.commit()
        flash("Squadra aggiunta con successo!", "success")
        return redirect(url_for("squadra_routes.gestione_squadre"))

    squadre = Squadra.query.all()
    return render_template("gestione_squadre.html", form=form, squadre=squadre)
