"""
This file defines the data models representing the hierarchical structure of educational institutions,
including regions, universities, colleges, schools, modules, lecturers, and their related
ranking and teaching information. It also defines a comment model to support user comments on these entities.
"""

from django.db import models


class Region(models.Model):
    """Represents a geographical region where universities are located; region names are unique."""
    name = models.CharField(max_length=100, unique=True)  # Unique region name

    def __str__(self):
        return self.name


class University(models.Model):
    """Represents a university, linked to a Region; unique per (name, region)."""
    name = models.CharField(max_length=200)  # Name of the university
    region = models.ForeignKey(
        Region, null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='universities'
    )  # Foreign key linking to the Region; allows null and blank, sets to NULL if region is deleted

    class Meta:
        unique_together = ('name', 'region')  # Ensure that the combination of university name and region is unique

    def __str__(self):
        return f"{self.name} ({self.region.name if self.region else 'No Region'})"  # String representation showing name and region or 'No Region'


class College(models.Model):
    """ Represents a college under a university; unique per (university, name)."""
    university = models.ForeignKey(
        University, on_delete=models.CASCADE, related_name='colleges'
    )  # Foreign key linking to the University; if the university is deleted, all its colleges are deleted too
    name = models.CharField(max_length=200)  # Name of the college

    class Meta:
        unique_together = ('university', 'name')  # Ensure that college name is unique within the same university

    def __str__(self):
        return f"{self.name} ({self.university.name})"  # String representation showing college name and its university


class School(models.Model):
    """ Represents a school under a college; unique per (college, name)."""
    college = models.ForeignKey(College, on_delete=models.CASCADE, related_name='schools')
    name = models.CharField(max_length=200)

    class Meta:
        unique_together = ('college', 'name')

    def __str__(self):
        return f"{self.name} ({self.college.name})"


class Module(models.Model):
    """ Represents a course module, which belongs to a School."""
    school = models.ForeignKey(
        School, on_delete=models.CASCADE, related_name='modules'
    )  # Module belongs to a School; if the School is deleted, its Modules are also deleted.

    name = models.CharField(max_length=200)  # Name of the Module

    class Meta:
        unique_together = ('school', 'name')  # Ensure Module names are unique within the same School

    def __str__(self):
        return f"{self.name} ({self.school})"


class Lecturer(models.Model):
    """Represents a lecturer with name only."""
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class YearRanking(models.Model):
    """ Represents a ranking year, unique by year string."""
    year = models.CharField(max_length=4, unique=True)

    def __str__(self):
        return self.year


class UniversityRanking(models.Model):
    """ Represents university ranking for a specific year; unique per (year, university)."""
    year = models.ForeignKey(YearRanking, on_delete=models.CASCADE, related_name='rankings')
    university = models.ForeignKey(University, on_delete=models.CASCADE, related_name='rankings')
    rank = models.IntegerField()

    class Meta:
        unique_together = ('year', 'university')

    def __str__(self):
        return f"{self.rank} - {self.university.name} ({self.year.year})"


class Teaching(models.Model):
    """ Represents a teaching instance where a lecturer teaches a module in a particular year."""
    lecturer = models.ForeignKey(
        Lecturer, on_delete=models.CASCADE, related_name='teachings'
    )  # Teaching record links to a Lecturer; if the Lecturer is deleted, related teachings are deleted.

    module = models.ForeignKey(
        Module, on_delete=models.CASCADE, related_name='teachings'
    )  # Teaching record links to a Module; if the Module is deleted, related teachings are deleted.

    year = models.CharField(max_length=4)  # The academic year of this teaching record (e.g., "2024")

    class Meta:
        unique_together = (
            'lecturer', 'module', 'year')  # Ensure a Lecturer teaches a specific Module only once per year

    def __str__(self):
        return f"{self.lecturer} - {self.module} ({self.year})"  # String representation: Lecturer - Module (Year)


class Comment(models.Model):
    """ Represents comments linked optionally to various entities (university, college, etc.)."""
    university = models.ForeignKey(
        University, null=True, blank=True, on_delete=models.CASCADE, related_name='comments'
    )  # Optional link to a University; if the University is deleted, related comments are deleted.

    college = models.ForeignKey(
        College, null=True, blank=True, on_delete=models.CASCADE, related_name='comments'
    )  # Optional link to a College; cascades on delete.

    school = models.ForeignKey(
        School, null=True, blank=True, on_delete=models.CASCADE, related_name='comments'
    )  # Optional link to a School; cascades on delete.



    module = models.ForeignKey(
        Module, null=True, blank=True, on_delete=models.CASCADE, related_name='comments'
    )  # Optional link to a Module; cascades on delete.

    lecturer = models.ForeignKey(
        Lecturer, null=True, blank=True, on_delete=models.CASCADE, related_name='comments'
    )  # Optional link to a Lecturer; cascades on delete.

    teaching = models.ForeignKey(
        Teaching, null=True, blank=True, on_delete=models.CASCADE, related_name='comments'
    )  # Optional link to a Teaching record; cascades on delete.

    content = models.TextField()  # The text content of the comment.

    created_at = models.DateTimeField(auto_now_add=True)  # Timestamp when the comment was created.

    parent = models.ForeignKey(
        'self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies'
    )  # Self-referential link to parent comment to support nested replies; cascades on delete.

    def target_object(self):
        # Returns a string describing the target entity this comment belongs to.
        for field in ['university', 'college', 'school', 'module', 'lecturer', 'teaching']:
            obj = getattr(self, field)
            if obj:
                return f"{field.capitalize()}: {obj}"
        return "Unknown"

    target_object.short_description = "Comment Target"  # Admin display name for the method.

    def __str__(self):
        # Returns a concise string representation of the comment with its target and creation date.
        return f"Comment on {self.target_object()} ({self.created_at.date()})"
