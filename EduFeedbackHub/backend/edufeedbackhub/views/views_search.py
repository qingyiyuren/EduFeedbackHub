"""
This file contains API view functions for search operations.
It includes endpoints for searching universities, regions, colleges, and other entities.
"""

from django.http import JsonResponse
from django.views.decorators.http import require_GET
from ..models import University, Region, College


@require_GET
def search_university_api(request):
    """
    Search universities by name with optional region filtering.
    """
    query = request.GET.get('q', '').strip()
    if not query:
        return JsonResponse({'universities': []})

    # Search universities by name (case-insensitive)
    universities = University.objects.filter(name__icontains=query)
    
    # If region is specified, filter by region
    region_query = request.GET.get('region', '').strip()
    if region_query:
        universities = universities.filter(region__name__icontains=region_query)

    # Limit results and serialize
    universities = universities[:10]  # Limit to 10 results
    data = [
        {
            'id': uni.id,
            'name': uni.name,
            'region': uni.region.name if uni.region else None,
        }
        for uni in universities
    ]
    
    return JsonResponse({'universities': data})


@require_GET
def search_region_api(request):
    """
    Search regions by name.
    """
    query = request.GET.get('q', '').strip()
    if not query:
        return JsonResponse({'regions': []})

    # Search regions by name (case-insensitive)
    regions = Region.objects.filter(name__icontains=query)[:10]  # Limit to 10 results
    
    data = [region.name for region in regions]
    return JsonResponse({'regions': data})


@require_GET
def search_college_api(request):
    """
    Search colleges by name within a specific university.
    """
    query = request.GET.get('q', '').strip()
    university_id = request.GET.get('university_id', '').strip()
    
    if not query:
        return JsonResponse({'colleges': []})

    # Search colleges by name (case-insensitive)
    colleges = College.objects.filter(name__icontains=query)
    
    # If university_id is specified, filter by university
    if university_id:
        colleges = colleges.filter(university_id=university_id)

    # Limit results and serialize
    colleges = colleges[:10]  # Limit to 10 results
    data = [
        {
            'id': college.id,
            'name': college.name,
            'university': college.university.name if college.university else None,
        }
        for college in colleges
    ]
    
    return JsonResponse({'colleges': data})


# Future search APIs for other entities
# def search_school_api(request):
#     """
#     Search schools by name within a specific college.
#     """
#     query = request.GET.get('q', '').strip()
#     college_id = request.GET.get('college_id', '').strip()
#     
#     if not query:
#         return JsonResponse({'schools': []})
#
#     schools = School.objects.filter(name__icontains=query)
#     if college_id:
#         schools = schools.filter(college_id=college_id)
#
#     schools = schools[:10]
#     data = [
#         {
#             'id': school.id,
#             'name': school.name,
#             'college': school.college.name if school.college else None,
#         }
#         for school in schools
#     ]
#     
#     return JsonResponse({'schools': data})


# def search_department_api(request):
#     """
#     Search departments by name within a specific school.
#     """
#     query = request.GET.get('q', '').strip()
#     school_id = request.GET.get('school_id', '').strip()
#     
#     if not query:
#         return JsonResponse({'departments': []})
#
#     departments = Department.objects.filter(name__icontains=query)
#     if school_id:
#         departments = departments.filter(school_id=school_id)
#
#     departments = departments[:10]
#     data = [
#         {
#             'id': dept.id,
#             'name': dept.name,
#             'school': dept.school.name if dept.school else None,
#         }
#         for dept in departments
#     ]
#     
#     return JsonResponse({'departments': data})


# def search_module_api(request):
#     """
#     Search modules by name within a specific department.
#     """
#     query = request.GET.get('q', '').strip()
#     department_id = request.GET.get('department_id', '').strip()
#     
#     if not query:
#         return JsonResponse({'modules': []})
#
#     modules = Module.objects.filter(name__icontains=query)
#     if department_id:
#         modules = modules.filter(department_id=department_id)
#
#     modules = modules[:10]
#     data = [
#         {
#             'id': module.id,
#             'name': module.name,
#             'department': module.department.name if module.department else None,
#         }
#         for module in modules
#     ]
#     
#     return JsonResponse({'modules': data})


# def search_lecturer_api(request):
#     """
#     Search lecturers by name within a specific department.
#     """
#     query = request.GET.get('q', '').strip()
#     department_id = request.GET.get('department_id', '').strip()
#     
#     if not query:
#         return JsonResponse({'lecturers': []})
#
#     lecturers = Lecturer.objects.filter(name__icontains=query)
#     if department_id:
#         lecturers = lecturers.filter(department_id=department_id)
#
#     lecturers = lecturers[:10]
#     data = [
#         {
#             'id': lecturer.id,
#             'name': lecturer.name,
#             'title': lecturer.title,
#             'department': lecturer.department.name if lecturer.department else None,
#         }
#         for lecturer in lecturers
#     ]
#     
#     return JsonResponse({'lecturers': data}) 