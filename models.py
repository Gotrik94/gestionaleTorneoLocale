from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Torneo(db.Model):
    __tablename__ = "torneo"
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    data_inizio = db.Column(db.Date, nullable=False)
    data_fine = db.Column(db.Date, nullable=False)
    formato = db.Column(db.String(50), nullable=False)
    squadre = db.relationship("Squadra", backref="torneo", lazy=True, cascade="all, delete-orphan")
    partite = db.relationship("Partita", backref="torneo", lazy=True, cascade="all, delete-orphan")

class Squadra(db.Model):
    __tablename__ = "squadra"
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    torneo_id = db.Column(db.Integer, db.ForeignKey("torneo.id"), nullable=False)
    giocatori = db.relationship("Giocatore", backref="squadra", lazy=True, cascade="all, delete-orphan")

class Giocatore(db.Model):
    __tablename__ = "giocatore"
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    kills = db.Column(db.Integer, default=0)
    deaths = db.Column(db.Integer, default=0)
    assists = db.Column(db.Integer, default=0)
    squadra_id = db.Column(db.Integer, db.ForeignKey("squadra.id"), nullable=False)

class Partita(db.Model):
    __tablename__ = "partita"
    id = db.Column(db.Integer, primary_key=True)
    torneo_id = db.Column(db.Integer, db.ForeignKey("torneo.id"), nullable=False)
    squadra1_id = db.Column(db.Integer, db.ForeignKey("squadra.id"), nullable=False)
    squadra2_id = db.Column(db.Integer, db.ForeignKey("squadra.id"), nullable=False)
    vincitore_id = db.Column(db.Integer, db.ForeignKey("squadra.id"), nullable=True)
    torri_squadra1 = db.Column(db.Integer, default=0)
    torri_squadra2 = db.Column(db.Integer, default=0)
    draghi_squadra1 = db.Column(db.Integer, default=0)
    draghi_squadra2 = db.Column(db.Integer, default=0)
    baroni_squadra1 = db.Column(db.Integer, default=0)
    baroni_squadra2 = db.Column(db.Integer, default=0)
    data_evento = db.Column(db.Date, nullable=False)
    pick_ban = db.relationship("PickBanPartita", backref="partita", lazy=True, cascade="all, delete-orphan")

class GiocatorePartita(db.Model):
    __tablename__ = "giocatore_partita"
    id = db.Column(db.Integer, primary_key=True)
    partita_id = db.Column(db.Integer, db.ForeignKey("partita.id"), nullable=False)
    giocatore_id = db.Column(db.Integer, db.ForeignKey("giocatore.id"), nullable=False)
    campione_usato = db.Column(db.String(50), nullable=False)

class StatisticheGiocatorePartita(db.Model):
    __tablename__ = "statistiche_giocatore_partita"
    id = db.Column(db.Integer, primary_key=True)
    partita_id = db.Column(db.Integer, db.ForeignKey("partita.id"), nullable=False)
    giocatore_id = db.Column(db.Integer, db.ForeignKey("giocatore.id"), nullable=False)
    kill = db.Column(db.Integer, default=0)
    death = db.Column(db.Integer, default=0)
    assist = db.Column(db.Integer, default=0)
    mvp = db.Column(db.Boolean, default=False)

class PickBanPartita(db.Model):
    __tablename__ = "pick_ban_partita"
    id = db.Column(db.Integer, primary_key=True)
    partita_id = db.Column(db.Integer, db.ForeignKey("partita.id"), nullable=False)
    squadra_id = db.Column(db.Integer, db.ForeignKey("squadra.id"), nullable=False)
    campione = db.Column(db.String(50), nullable=False)
    tipo = db.Column(db.String(10), nullable=False)  # "pick" o "ban"
