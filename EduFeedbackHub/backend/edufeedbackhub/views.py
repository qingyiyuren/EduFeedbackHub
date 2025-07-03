from django.shortcuts import render, get_object_or_404
from backend.edufeedbackhub.models import YearRanking, UniversityRanking

def qs_year_list(request):
    # Retrieve all years from the database, sorted in descending order.
    years = YearRanking.objects.order_by('-year').values_list('year', flat=True)
    return render(request, 'qs_year_list.html', {'years': years})

def qs_year_detail(request, year):
    # Query the ranking data for a specific year.
    year_obj = get_object_or_404(YearRanking, year=year)
    rankings = UniversityRanking.objects.filter(year=year_obj).order_by('rank')
    return render(request, 'qs_year_detail.html', {'year': year, 'rankings': rankings})


