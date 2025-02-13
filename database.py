from models import db
from flask import Flask

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///tornei.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = "supersegreto"

db.init_app(app)

with app.app_context():
    db.create_all()
    print("✅ Database Creato!")
