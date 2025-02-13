from flask import Flask
from models import db, Torneo, Squadra, Giocatore, Partita
from routes import app_routes, dashboard_routes, torneo_routes, squadra_routes, partita_routes, statistiche_routes
from datetime import date
import random

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///tornei.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = "supersegreto"

db.init_app(app)

# Registriamo i blueprint
app.register_blueprint(app_routes)
app.register_blueprint(dashboard_routes)
app.register_blueprint(torneo_routes)
#app.register_blueprint(squadra_routes)
#app.register_blueprint(partita_routes)
#app.register_blueprint(statistiche_routes)


def insert_mock_data():
    """Inserisce dati mockati nel database se non esistono già"""
    if not Torneo.query.first():  # Controlla se ci sono già dati
        print("📌 Inserimento dati mockati nel database...")

        # Creazione tornei
        torneo1 = Torneo(nome="Spring Cup", data_inizio=date(2024, 3, 1), data_fine=date(2024, 3, 15), formato="BO3")
        torneo2 = Torneo(nome="Summer Clash", data_inizio=date(2024, 6, 10), data_fine=date(2024, 6, 25), formato="BO5")
        torneo3 = Torneo(nome="Winter Invitational", data_inizio=date(2024, 12, 1), data_fine=date(2024, 12, 20),
                         formato="BO3")
        db.session.add_all([torneo1, torneo2, torneo3])
        db.session.commit()

        # Creazione squadre
        squadre_data = [
            ("Team Alpha", torneo1.id), ("Team Beta", torneo1.id),
            ("Team Gamma", torneo2.id), ("Team Delta", torneo2.id),
            ("Team Omega", torneo3.id), ("Team Phoenix", torneo3.id)
        ]
        squadre = []
        for nome, torneo_id in squadre_data:
            squadra = Squadra(nome=nome, torneo_id=torneo_id)
            db.session.add(squadra)
            squadre.append(squadra)
        db.session.commit()

        # Creazione giocatori con KDA mockati
        nomi_giocatori = [
            "ShadowKiller", "BlazeMaster", "PhantomStriker", "NightHunter", "StormBreaker",
            "IronFist", "GhostRider", "FireBlade", "ThunderLord", "VenomSniper"
        ]

        for squadra in squadre:
            for _ in range(3):  # Crea 3 giocatori per squadra
                nome = random.choice(nomi_giocatori)
                k = random.randint(5, 30)  # Kills casuali
                d = random.randint(1, 15)  # Deaths casuali
                a = random.randint(5, 25)  # Assists casuali

                giocatore = Giocatore(nome=nome, kills=k, deaths=d, assists=a, squadra_id=squadra.id)
                db.session.add(giocatore)

        db.session.commit()

        # Creazione partite con eventi di gioco
        partite_data = [
            (torneo1.id, squadre[0].id, squadre[1].id, squadre[0].id, 5, 3, 2, 1, 1, 0, date(2024, 3, 5)),
            (torneo2.id, squadre[2].id, squadre[3].id, squadre[3].id, 4, 6, 1, 3, 0, 1, date(2024, 6, 15)),
            (torneo3.id, squadre[4].id, squadre[5].id, squadre[5].id, 6, 5, 3, 2, 1, 1, date(2024, 12, 5))
        ]

        for p in partite_data:
            partita = Partita(
                torneo_id=p[0], squadra1_id=p[1], squadra2_id=p[2], vincitore_id=p[3],
                torri_squadra1=p[4], torri_squadra2=p[5], draghi_squadra1=p[6], draghi_squadra2=p[7],
                baroni_squadra1=p[8], baroni_squadra2=p[9], data_evento=p[10]
            )
            db.session.add(partita)

        db.session.commit()

        print("✅ Dati mockati inseriti con successo!")

if __name__ == "__main__":
    with app.app_context():
        print("⚠️ Eliminazione del database esistente...")
        db.drop_all()  # Cancella tutte le tabelle
        db.create_all()  # Ricrea tutte le tabelle
        print("✅ Database rigenerato!")
        insert_mock_data()  # Inserisce nuovi dati mockati

    print("✅ Server Flask avviato!")
    app.run(debug=True)

