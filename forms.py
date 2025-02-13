from flask_wtf import FlaskForm
from wtforms import StringField, DateField, IntegerField, SubmitField, SelectField
from wtforms.validators import DataRequired

class TorneoForm(FlaskForm):
    nome = StringField("Nome Torneo", validators=[DataRequired()])
    data_inizio = DateField("Data Inizio", format='%Y-%m-%d', validators=[DataRequired()])
    data_fine = DateField("Data Fine", format='%Y-%m-%d', validators=[DataRequired()])
    fascia_oraria = StringField("Fascia Oraria", validators=[DataRequired()])
    formato = SelectField("Formato", choices=[("Draft", "Draft"), ("ARAM", "ARAM")], validators=[DataRequired()])
    submit = SubmitField("Crea Torneo")

class SquadraForm(FlaskForm):
    nome = StringField("Nome Squadra", validators=[DataRequired()])
    torneo_id = IntegerField("ID Torneo", validators=[DataRequired()])
    submit = SubmitField("Aggiungi Squadra")

class GiocatoreForm(FlaskForm):
    nome = StringField("Nome Giocatore", validators=[DataRequired()])
    squadra_id = IntegerField("ID Squadra", validators=[DataRequired()])
    submit = SubmitField("Aggiungi Giocatore")

class PartitaForm(FlaskForm):
    torneo_id = IntegerField("ID Torneo", validators=[DataRequired()])
    squadra1_id = IntegerField("ID Squadra 1", validators=[DataRequired()])
    squadra2_id = IntegerField("ID Squadra 2", validators=[DataRequired()])
    vincitore_id = IntegerField("ID Vincitore", validators=[DataRequired()])
    torri_squadra1 = IntegerField("Torri Squadra 1")
    torri_squadra2 = IntegerField("Torri Squadra 2")
    draghi_squadra1 = IntegerField("Draghi Squadra 1")
    draghi_squadra2 = IntegerField("Draghi Squadra 2")
    baroni_squadra1 = IntegerField("Baroni Squadra 1")
    baroni_squadra2 = IntegerField("Baroni Squadra 2")
    submit = SubmitField("Registra Partita")
