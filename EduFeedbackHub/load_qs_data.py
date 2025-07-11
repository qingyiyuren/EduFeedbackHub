"""
Load QS university rankings data into the database.
Deletes old data first, then inserts new ranking records year by year.
"""

import os
import sys
import django

# Add the current directory to sys.path to allow module imports
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

# Set up Django environment settings and initialize Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.edufeedbackhub.settings')
django.setup()

# Import Django models and QS rankings data
from backend.edufeedbackhub.models import YearRanking, UniversityRanking, University, Region
from backend.data.qs_2024_2026 import qs_rankings  # QS rankings data dictionary

def load_qs_rankings():
    """Delete old data and bulk insert new QS ranking records."""
    print("Deleting old data...")
    UniversityRanking.objects.all().delete()  # Delete all university ranking records
    University.objects.all().delete()          # Delete all university records
    YearRanking.objects.all().delete()        # Delete all year records
    Region.objects.all().delete()              # Delete all region records

    # Iterate through each year and its rankings
    for year_str, rankings in qs_rankings.items():
        year_obj, created = YearRanking.objects.get_or_create(year=year_str)  # Get or create Year object
        print(f"Loading data for year {year_str}, created new: {created}")

        objs = []
        for uni in rankings:
            # Get or create Region object
            region_obj, _ = Region.objects.get_or_create(name=uni['region'])
            # Get or create University object linked to the region
            university_obj, _ = University.objects.get_or_create(name=uni['name'], region=region_obj)
            # Create UniversityRanking object linked to year and university
            obj = UniversityRanking(year=year_obj, university=university_obj, rank=uni['rank'])
            objs.append(obj)

        # Bulk create UniversityRanking objects for efficiency
        UniversityRanking.objects.bulk_create(objs)
        print(f"Inserted {len(objs)} ranking records for year {year_str}")

if __name__ == "__main__":
    load_qs_rankings()
