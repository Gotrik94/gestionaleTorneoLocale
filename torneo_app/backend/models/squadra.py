from django.db import models

class Squadra(models.Model):
    id = models.AutoField(primary_key=True)  # ID auto-incrementale
    nome = models.CharField(max_length=100)  # Nome della squadra
    data_iscrizione = models.DateField()  # Data di iscrizione della squadra
    logo = models.ImageField(upload_to='logos/', null=True, blank=True)  # Logo della squadra
    is_active = models.BooleanField(default=True)  # Stato della squadra (attiva o ritirata)
    exp = models.IntegerField(default=0)  # 🔥 Esperienza accumulata dalla squadra
    livello = models.IntegerField(default=1)  # 🔥 Livello della squadra

    def aggiorna_livello(self):
        """ Aggiorna il livello della squadra in base all'EXP accumulata """
        livelli = [0, 100, 250, 500, 1000, 2000, 3500, 5000]  # Soglie di esperienza per i livelli
        nuovo_livello = sum(1 for soglia in livelli if self.exp >= soglia)
        self.livello = nuovo_livello
        self.save()

    def __str__(self):
        return f"{self.nome} - Livello {self.livello} (EXP: {self.exp})"
