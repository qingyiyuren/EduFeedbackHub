"""
This file contains API view functions for querying data.
Includes endpoints for base API, rankings, entity details, and search operations.
"""

from django.shortcuts import get_object_or_404, redirect
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import csrf_exempt
from ..models import *


# Useful for guiding users or tools to a meaningful starting point.
def root_redirect(request):
    """Redirect the root URL to the homepage API endpoint."""
    return redirect('home_api')


# Useful for API health checks, testing, or showing the API is working.
def home_api(request):
    """Return a simple welcome message."""
    return JsonResponse({"message": "Welcome to EduFeedbackHub API"})


@require_GET  # Ensures that only GET requests are allowed for this view
def qs_year_list_api(request):
    """
    Return a list of all available ranking years, sorted in descending order.
    """
    # Get all years from YearRanking, ordered from newest to oldest
    years = list(
        YearRanking.objects
        .order_by('-year')
        .values_list('year', flat=True)
    )
    # Return the list of years as a JSON response
    return JsonResponse({'years': years})


@require_GET
def qs_year_detail_api(request, year):
    """
    Return ranking details for a specific year.
    """
    # Get the YearRanking object for the given year or return 404 if not found
    year_obj = get_object_or_404(YearRanking, year=year)

    # Query UniversityRanking entries for that year, ordered by rank
    rankings = UniversityRanking.objects.filter(year=year_obj).order_by('rank')

    # Prepare a list of ranking data with university details and region (if available)
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

    # Return the year and ranking data as JSON response
    return JsonResponse({'year': year, 'rankings': data})


@require_GET
def university_detail_api(request, university_id):
    """
    Return details and top-level comments for a specific university.
    """
    # Get the University object by ID or return 404 if not found
    university = get_object_or_404(University, id=university_id)

    # Get top-level comments (no parent) for the university, ordered by newest first
    comments_qs = university.comments.filter(parent=None).order_by('-created_at')

    # Recursively serialize a comment and its replies
    def serialize_comment(comment):
        return {
            'id': comment.id,
            'content': comment.content,
            'created_at': comment.created_at.isoformat(),
            'target': comment.target_object(),
            'replies': [
                serialize_comment(reply)
                for reply in comment.replies.all().order_by('created_at')
            ]
        }

    # Serialize all top-level comments
    comments = [serialize_comment(c) for c in comments_qs]

    # Prepare university data with region info if available
    university_data = {
        'id': university.id,
        'name': university.name,
        'region': university.region.name if university.region else None,
    }

    # Return university details and its comments as JSON
    return JsonResponse({
        'university': university_data,
        'comments': comments,
    })


@require_GET
def college_detail_api(request, college_id):
    """
    Return details and top-level comments for a specific college.
    """
    college = get_object_or_404(College, id=college_id)
    comments_qs = college.comments.filter(parent=None).order_by('-created_at')

    def serialize_comment(comment):
        return {
            'id': comment.id,
            'content': comment.content,
            'created_at': comment.created_at.isoformat(),
            'target': comment.target_object(),
            'replies': [
                serialize_comment(reply)
                for reply in comment.replies.all().order_by('created_at')
            ]
        }

    comments = [serialize_comment(c) for c in comments_qs]

    college_data = {
        'id': college.id,
        'name': college.name,
        'university': {
            'id': college.university.id,
            'name': college.university.name,
            'region': college.university.region.name if college.university.region else None,
        } if college.university else None,
    }

    return JsonResponse({
        'college': college_data,
        'comments': comments,
    })


@require_GET
def school_detail_api(request, school_id):
    """
    Return details and top-level comments for a specific school.
    """
    school = get_object_or_404(School, id=school_id)
    comments_qs = school.comments.filter(parent=None).order_by('-created_at')

    def serialize_comment(comment):
        return {
            'id': comment.id,
            'content': comment.content,
            'created_at': comment.created_at.isoformat(),
            'target': comment.target_object(),
            'replies': [
                serialize_comment(reply)
                for reply in comment.replies.all().order_by('created_at')
            ]
        }

    comments = [serialize_comment(c) for c in comments_qs]

    school_data = {
        'id': school.id,
        'name': school.name,
        'college': {
            'id': school.college.id,
            'name': school.college.name,
            'university': {
                'id': school.college.university.id,
                'name': school.college.university.name,
                'region': school.college.university.region.name if school.college.university.region else None,
            } if school.college.university else None,
        } if school.college else None,
    }

    return JsonResponse({
        'school': school_data,
        'comments': comments,
    })


@require_GET
def module_detail_api(request, module_id):
    """
    Return details and top-level comments for a specific module.
    """
    module = get_object_or_404(Module, id=module_id)
    comments_qs = module.comments.filter(parent=None).order_by('-created_at')

    def serialize_comment(comment):
        return {
            'id': comment.id,
            'content': comment.content,
            'created_at': comment.created_at.isoformat(),
            'target': comment.target_object(),
            'replies': [
                serialize_comment(reply)
                for reply in comment.replies.all().order_by('created_at')
            ]
        }

    comments = [serialize_comment(c) for c in comments_qs]

    from ..models import Teaching
    teachings = Teaching.objects.filter(module=module)
    teachings_data = [
        {
            'id': teaching.id,
            'lecturer': teaching.lecturer.name,
            'year': teaching.year,
        }
        for teaching in teachings
    ]

    module_data = {
        'id': module.id,
        'name': module.name,
        'school': {
            'id': module.school.id,
            'name': module.school.name,
            'college': {
                'id': module.school.college.id,
                'name': module.school.college.name,
                'university': {
                    'id': module.school.college.university.id,
                    'name': module.school.college.university.name,
                    'region': module.school.college.university.region.name if module.school.college.university.region else None,
                } if module.school.college.university else None,
            } if module.school.college else None,
        } if module.school else None,
    }

    return JsonResponse({
        'module': module_data,
        'teachings': teachings_data,
        'comments': comments,
    })


@require_GET
def teaching_detail_api(request, teaching_id):
    """
    Return details and top-level comments for a specific teaching record.
    """
    # Get the Teaching object by ID or return 404 if not found
    teaching = get_object_or_404(Teaching, id=teaching_id)

    # Get top-level comments (no parent) for this teaching, newest first
    comments_qs = teaching.comments.filter(parent=None).order_by('-created_at')

    # Recursively serialize a comment and its nested replies
    def serialize_comment(comment):
        return {
            'id': comment.id,
            'content': comment.content,
            'created_at': comment.created_at.isoformat(),
            'target': comment.target_object(),
            'replies': [
                serialize_comment(reply)
                for reply in comment.replies.all().order_by('created_at')
            ]
        }

    # Serialize all top-level comments
    comments = [serialize_comment(c) for c in comments_qs]

    # Build module info with nested school, college, and university details if available
    module = teaching.module
    module_info = None
    if module:
        module_info = {
            'id': module.id,
            'name': module.name,
            'school': None,
        }
        if module.school:
            school_info = {
                'id': module.school.id,
                'name': module.school.name,
                'college': None,
            }
            if module.school.college:
                college_info = {
                    'id': module.school.college.id,
                    'name': module.school.college.name,
                    'university': None,
                }
                if module.school.college.university:
                    college_info['university'] = {
                        'id': module.school.college.university.id,
                        'name': module.school.college.university.name,
                        'region': module.school.college.university.region.name if module.school.college.university.region else None,
                    }
                school_info['college'] = college_info
            module_info['school'] = school_info

    # Prepare teaching data including lecturer, year, and module info
    teaching_data = {
        'id': teaching.id,
        'lecturer': teaching.lecturer.name,
        'year': teaching.year,
        'module': teaching.module.name,
        'module_id': teaching.module.id,
        'module_info': module_info,
    }

    # Return teaching details and associated comments as JSON response
    return JsonResponse({
        'teaching': teaching_data,
        'comments': comments,
    })


@require_GET
def search_university_api(request):
    """
    Search for universities by name, with optional region filter.
    """
    # Get the search query from URL parameter 'q', strip whitespace
    query = request.GET.get('q', '').strip()

    # If query is empty, return empty list
    if not query:
        return JsonResponse({'universities': []})

    # Filter universities whose name contains the query (case-insensitive)
    universities = University.objects.filter(name__icontains=query)

    # Optionally filter by region name if provided
    region_query = request.GET.get('region', '').strip()
    if region_query:
        universities = universities.filter(region__name__icontains=region_query)

    # Limit results to 10
    universities = universities[:10]

    # Prepare JSON-serializable list of universities with id, name, and region
    data = [
        {
            'id': uni.id,
            'name': uni.name,
            'region': uni.region.name if uni.region else None,
        }
        for uni in universities
    ]

    # Return the filtered universities as JSON
    return JsonResponse({'universities': data})


@require_GET
def search_region_api(request):
    """
    Search for regions by name.
    """
    query = request.GET.get('q', '').strip()
    if not query:
        return JsonResponse({'regions': []})

    regions = Region.objects.filter(name__icontains=query)[:10]
    data = [region.name for region in regions]
    return JsonResponse({'regions': data})


@require_GET
def search_college_api(request):
    """
    Search for colleges by name within a specific university.
    """
    query = request.GET.get('q', '').strip()
    university_id = request.GET.get('university_id', '').strip()

    if not query:
        return JsonResponse({'colleges': []})

    colleges = College.objects.filter(name__icontains=query)

    if university_id:
        colleges = colleges.filter(university_id=university_id)

    colleges = colleges[:10]
    data = [
        {
            'id': college.id,
            'name': college.name,
            'university': college.university.name if college.university else None,
        }
        for college in colleges
    ]

    return JsonResponse({'colleges': data})


@require_GET
def search_school_api(request):
    """
    Search for schools by name within a specific college.
    """
    query = request.GET.get('q', '').strip()
    college_id = request.GET.get('college_id', '').strip()

    if not query:
        return JsonResponse({'schools': []})

    schools = School.objects.filter(name__icontains=query)

    if college_id:
        schools = schools.filter(college_id=college_id)

    schools = schools[:10]
    data = [
        {
            'id': school.id,
            'name': school.name,
            'college': school.college.name if school.college else None,
        }
        for school in schools
    ]

    return JsonResponse({'schools': data})


@require_GET
def search_module_api(request):
    """
    Search for modules by name within a specific school.
    """
    query = request.GET.get('q', '').strip()
    school_id = request.GET.get('school_id', '').strip()

    if not query:
        return JsonResponse({'modules': []})

    modules = Module.objects.filter(name__icontains=query)

    if school_id:
        modules = modules.filter(school_id=school_id)

    modules = modules[:10]
    data = [
        {
            'id': module.id,
            'name': module.name,
            'school': module.school.name if module.school else None,
        }
        for module in modules
    ]

    return JsonResponse({'modules': data})


@csrf_exempt
def search_lecturer_api(request):
    """Search for lecturers by name."""
    query = request.GET.get('q', '').strip()
    if not query:
        return JsonResponse({'lecturers': []})

    lecturers = Lecturer.objects.filter(name__icontains=query)[:10]
    data = []
    for lecturer in lecturers:
        data.append({
            'id': lecturer.id,
            'name': lecturer.name,
        })

    return JsonResponse({'lecturers': data})


@csrf_exempt
def global_search_api(request):
    """Perform a global search across all entity types."""
    # Get search query from URL parameter 'q' and strip whitespace
    query = request.GET.get('q', '').strip()

    # If query is empty, return empty results list
    if not query:
        return JsonResponse({'results': []})

    results = []

    # Search up to 5 universities matching query (case-insensitive)
    universities = University.objects.filter(name__icontains=query)[:5]
    for uni in universities:
        results.append({
            'name': uni.name,
            'type': 'University',
            'url': f'/university/{uni.id}',
            'parent': uni.region.name if uni.region else None,
        })

    # Search up to 5 colleges matching query
    colleges = College.objects.filter(name__icontains=query)[:5]
    for college in colleges:
        results.append({
            'name': college.name,
            'type': 'College',
            'url': f'/college/{college.id}',
            'parent': f"{college.university.name} ({college.university.region.name if college.university.region else 'No Region'})",
        })

    # Search up to 5 schools matching query
    schools = School.objects.filter(name__icontains=query)[:5]
    for school in schools:
        results.append({
            'name': school.name,
            'type': 'School',
            'url': f'/school/{school.id}',
            'parent': f"{school.college.name} → {school.college.university.name}",
        })

    # Search up to 5 modules matching query
    modules = Module.objects.filter(name__icontains=query)[:5]
    for module in modules:
        results.append({
            'name': module.name,
            'type': 'Module',
            'url': f'/module/{module.id}',
            'parent': f"{module.school.name} → {module.school.college.name} → {module.school.college.university.name}",
        })

    # Return combined search results as JSON
    return JsonResponse({'results': results})
