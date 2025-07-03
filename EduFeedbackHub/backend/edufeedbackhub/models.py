from django.db import models

class YearRanking(models.Model):
    year = models.CharField(max_length=4, unique=True)  # Year, e.g., '2025', unique to avoid duplicates

    def __str__(self):
        return self.year

class University(models.Model):
    name = models.CharField(max_length=200, unique=True)  # University name, unique to avoid duplicates
    region = models.CharField(max_length=100)             # Region or location of the university

    def __str__(self):
        return self.name

class UniversityRanking(models.Model):
    year = models.ForeignKey(YearRanking, on_delete=models.CASCADE, related_name='rankings')
    university = models.ForeignKey(University, on_delete=models.CASCADE, related_name='rankings')
    rank = models.IntegerField()  # Rank position for the university in the given year

    class Meta:
        unique_together = ('year', 'university')  # Ensure each university has only one ranking per year

    def __str__(self):
        return f"{self.rank} - {self.university.name} ({self.year.year})"

class Comment(models.Model):
    university = models.ForeignKey(University, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()  # Comment text
    created_at = models.DateTimeField(auto_now_add=True)  # Timestamp when comment was created
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='replies'
    )  # Self-referential foreign key for nested replies (optional)

    def __str__(self):
        return f"Comment on {self.university.name} ({self.created_at.date()})"
