from django.shortcuts import render
from data.qs_2024_2026 import qs_rankings


def qs_year_list(request):
    # Homepage, display links for 3 years
    years = sorted(qs_rankings.keys(), reverse=True)
    return render(request, 'qs_year_list.html', {'years': years})

def qs_year_detail(request, year):
    # Display QS rankings for a specific year
    year = str(year)
    rankings = qs_rankings.get(year, [])
    return render(request, 'qs_year_detail.html', {'year': year, 'rankings': rankings})

