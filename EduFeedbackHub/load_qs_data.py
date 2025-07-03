import os
import sys
import django

# Add the project root directory to sys.path to find the 'backend' package
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

# Set the Django settings module environment variable
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.edufeedbackhub.settings')

# Initialize Django
django.setup()

from backend.edufeedbackhub.models import YearRanking, UniversityRanking
from backend.data.qs_2024_2026 import qs_rankings


def load_qs_rankings():
    for year_str, rankings in qs_rankings.items():
        year_obj, created = YearRanking.objects.get_or_create(year=year_str)
        print(f"Loading data for year {year_str} (created={created})")

        objs = []
        for uni in rankings:
            obj = UniversityRanking(
                year=year_obj,
                rank=uni['rank'],
                name=uni['name'],
                region=uni['region']
            )
            objs.append(obj)
        UniversityRanking.objects.bulk_create(objs)
        print(f"Inserted {len(objs)} records for year {year_str}")


if __name__ == "__main__":
    load_qs_rankings()
