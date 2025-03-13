from django.db import models

class Campione(models.Model):
    id = models.AutoField(primary_key=True)  # AUTO_INCREMENT
    nome = models.CharField(max_length=100)

    def __str__(self):
        return self.nome
