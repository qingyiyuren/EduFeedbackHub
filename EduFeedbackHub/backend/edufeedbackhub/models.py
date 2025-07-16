"""
This file defines the core data models for the EduFeedbackHub backend.
It includes models for educational entities (Region, University, College, School, Module, Lecturer, Teaching),
user profiles (Profile), and the comment system (Comment) with support for anonymous and hierarchical comments.
"""

from django.db import models
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey


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

    user = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='comments'
    )  # The user who posted the comment; nullable to allow anonymous or deleted users. If the user is deleted, set to NULL.

    content = models.TextField()  # The text content of the comment.

    created_at = models.DateTimeField(auto_now_add=True)  # Timestamp when the comment was created.

    parent = models.ForeignKey(
        'self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies'
    )  # Self-referential link to parent comment to support nested replies; cascades on delete.

    is_anonymous = models.BooleanField(
        default=False,
        help_text="Whether the comment is anonymous (for students)"
    )  # Indicates if the comment is posted anonymously by a student; when True, user identity should be hidden.

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


class Profile(models.Model):
    """User profile to distinguish between different user roles such as student or lecturer."""
    user = models.OneToOneField(
        User, on_delete=models.CASCADE
    )  # One-to-one relation to Django User model; deleting User deletes profile.

    role = models.CharField(
        max_length=10,
        choices=[('student', 'Student'), ('lecturer', 'Lecturer')]
    )  # Role of the user, limited to either 'student' or 'lecturer'.

    def __str__(self):
        return f"{self.user.username} - {self.role}"  # String representation showing username and role.


class Rating(models.Model):
    """Stores ratings given by users for various objects via generic relations. Score is an integer from 1 to 5."""
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='ratings'
    )  # The user who gave the rating; deleting the user deletes their ratings.

    score = models.IntegerField()  # Rating score from 1 to 5, integer only.

    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE
    )  # Generic foreign key content type to link to any rated model.

    object_id = models.PositiveIntegerField()  # ID of the rated object.

    content_object = GenericForeignKey('content_type', 'object_id')  # Generic relation to the rated object.

    created_at = models.DateTimeField(auto_now_add=True)  # Timestamp when the rating was created.

    updated_at = models.DateTimeField(auto_now=True)  # Timestamp when the rating was last updated.

    class Meta:
        unique_together = ('user', 'content_type', 'object_id')  # Each user can rate each object only once.

    def __str__(self):
        return f"{self.user.username} rated {self.content_object} {self.score}"  # String representation showing who rated what and the score.
