import os
import sys
import django

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.edufeedbackhub.settings')
django.setup()

from backend.edufeedbackhub.models import YearRanking, UniversityRanking, University
from backend.data.qs_2024_2026 import qs_rankings

def load_qs_rankings():
    print("Deleting old UniversityRanking, University, YearRanking data...")
    UniversityRanking.objects.all().delete()
    University.objects.all().delete()
    YearRanking.objects.all().delete()

    for year_str, rankings in qs_rankings.items():
        year_obj, created = YearRanking.objects.get_or_create(year=year_str)
        print(f"Loading data for year {year_str} (created={created})")

        objs = []
        for uni in rankings:
            university_obj, created_uni = University.objects.get_or_create(
                name=uni['name'],
                defaults={'region': uni['region']}
            )
            if not created_uni and university_obj.region != uni['region']:
                university_obj.region = uni['region']
                university_obj.save(update_fields=['region'])

            obj = UniversityRanking(
                year=year_obj,
                university=university_obj,
                rank=uni['rank']
            )
            objs.append(obj)
        UniversityRanking.objects.bulk_create(objs)
        print(f"Inserted {len(objs)} records for year {year_str}")

if __name__ == "__main__":
    load_qs_rankings()
