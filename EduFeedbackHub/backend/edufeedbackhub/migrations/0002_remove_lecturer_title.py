# Generated manually to remove title field from Lecturer model

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('edufeedbackhub', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='lecturer',
            name='title',
        ),
    ] 