from flask import Blueprint, render_template, request, redirect, url_for, flash
from models import db, Torneo
from forms import TorneoForm

torneo_routes = Blueprint("torneo_routes", __name__)

# 📌 Pagina gestione tornei
@torneo_routes.route("/tornei", methods=["GET", "POST"])
def tornei():
    form = TorneoForm()  # Inizializza il form
    tornei = Torneo.query.all()
    if form.validate_on_submit():
        torneo = Torneo(
            nome=form.nome.data,
            data_inizio=form.data_inizio.data,
            data_fine=form.data_fine.data,
            fascia_oraria=form.fascia_oraria.data,
            formato=form.formato.data
        )
        db.session.add(torneo)
        db.session.commit()
        flash("Torneo creato con successo!", "success")
        return redirect(url_for("torneo_routes.tornei"))

    # Passiamo il form al template
    return render_template("tornei.html", active_page="tornei", form=form, tornei=tornei)

# 📌 Creazione nuovo torneo
@torneo_routes.route("/nuovo_torneo", methods=["GET", "POST"])
def nuovo_torneo():
    form = TorneoForm()  # Assicurati di creare il form
    if form.validate_on_submit():
        torneo = Torneo(
            nome=form.nome.data,
            data_inizio=form.data_inizio.data,
            data_fine=form.data_fine.data,
            formato=form.formato.data
        )
        db.session.add(torneo)
        db.session.commit()
        flash("Torneo creato con successo!", "success")
        return redirect(url_for("torneo_routes.tornei"))

    # 🔹 Passa esplicitamente il form nel template
    return render_template("tornei.html", form=form)

# 📌 Dettaglio torneo
@torneo_routes.route("/torneo/<int:torneo_id>")
def dettaglio_torneo(torneo_id):
    torneo = Torneo.query.get_or_404(torneo_id)  # Assicura che il torneo esista
    return render_template("dettaglio_torneo.html", torneo=torneo)
