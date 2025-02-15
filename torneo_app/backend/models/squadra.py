from django.db import models

class Squadra(models.Model):
    id = models.AutoField(primary_key=True)  # ID auto-incrementale
    nome = models.CharField(max_length=100)  # Nome della squadra
    data_iscrizione = models.DateField()  # Data di iscrizione della squadra
    is_active = models.BooleanField(default=True)  # Stato della squadra (attiva o ritirata)

    def __str__(self):
        return f"{self.nome} (Iscritta il {self.data_iscrizione.strftime('%d-%m-%Y')})"
