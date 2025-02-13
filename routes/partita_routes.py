from flask import Blueprint, render_template, request, redirect, url_for, flash
from models import db, Partita
from forms import PartitaForm

partita_routes = Blueprint("partita_routes", __name__)

# 📌 Gestione partite
@partita_routes.route("/gestione_partite")
def gestione_partite():
    partite = Partita.query.all()
    return render_template("gestione_partite.html", partite=partite)

# 📌 Registrazione partita
@partita_routes.route("/registrazione_partita", methods=["GET", "POST"])
def registrazione_partita():
    form = PartitaForm()
    if form.validate_on_submit():
        partita = Partita(
            torneo_id=form.torneo_id.data,
            squadra1_id=form.squadra1_id.data,
            squadra2_id=form.squadra2_id.data,
            vincitore_id=form.vincitore_id.data if form.vincitore_id.data != 0 else None,
            torri_squadra1=form.torri_squadra1.data,
            torri_squadra2=form.torri_squadra2.data,
            draghi_squadra1=form.draghi_squadra1.data,
            draghi_squadra2=form.draghi_squadra2.data,
            baroni_squadra1=form.baroni_squadra1.data,
            baroni_squadra2=form.baroni_squadra2.data,
            data_evento=form.data_evento.data
        )
        db.session.add(partita)
        db.session.commit()
        flash("Partita registrata con successo!", "success")
        return redirect(url_for("partita_routes.gestione_partite"))

    return render_template("registrazione_partita.html", form=form)
