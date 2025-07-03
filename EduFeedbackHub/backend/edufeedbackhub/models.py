from django.db import models

class YearRanking(models.Model):
    year = models.CharField(max_length=4, unique=True)

    def __str__(self):
        return self.year

class UniversityRanking(models.Model):
    year = models.ForeignKey(YearRanking, on_delete=models.CASCADE, related_name='rankings')
    rank = models.IntegerField()
    name = models.CharField(max_length=200)
    region = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.rank} - {self.name} ({self.year.year})"
