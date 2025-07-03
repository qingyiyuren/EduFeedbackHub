from django.shortcuts import render
from data.qs_2024_2026 import qs_rankings


def qs_year_list(request):
    # 首页，显示3个年份链接
    years = sorted(qs_rankings.keys(), reverse=True)
    return render(request, 'qs_year_list.html', {'years': years})

def qs_year_detail(request, year):
    # 显示某年QS排名
    year = str(year)
    rankings = qs_rankings.get(year, [])
    return render(request, 'qs_year_detail.html', {'year': year, 'rankings': rankings})

