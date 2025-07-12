"""
This file contains API view functions for QS World University Rankings.
It includes endpoints for listing ranking years and retrieving ranking details for specific years.
"""

from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from ..models import YearRanking, UniversityRanking


@require_GET
def qs_year_list_api(request):
    """
    Returns a list of all available ranking years in descending order.
    """
    # Query all YearRanking entries, order them by year in descending order,
    # and extract the 'year' field as a flat list.
    years = list(
        YearRanking.objects
        .order_by('-year')
        .values_list('year', flat=True)
    )
    return JsonResponse({'years': years})


@require_GET
def qs_year_detail_api(request, year):
    """
    Returns ranking details for a specific year.
    """
    # Retrieve the YearRanking object for the specified year, or return 404 if not found
    year_obj = get_object_or_404(YearRanking, year=year)

    # Query UniversityRanking entries for that year, ordered by rank ascending
    rankings = UniversityRanking.objects.filter(year=year_obj).order_by('rank')

    # Construct a list of dictionaries containing ranking and university details
    data = [
        {
            'id': ranking.id,
            'rank': ranking.rank,
            'university': {
                'id': ranking.university.id,
                'name': ranking.university.name,
                'region': ranking.university.region.name if ranking.university.region else None,
            }
        }
        for ranking in rankings
    ]

    # Return the year and the ranking data as a JSON response
    return JsonResponse({'year': year, 'rankings': data}) 