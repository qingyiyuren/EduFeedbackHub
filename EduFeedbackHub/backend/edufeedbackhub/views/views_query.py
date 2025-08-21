"""
This module contains API view functions for EduFeedbackHub.
Includes endpoints for entry, rankings, details, ratings, trends, and entity search.
"""

from django.shortcuts import get_object_or_404, redirect
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import csrf_exempt
from django.apps import apps
from django.db.models import Avg
from rest_framework.authtoken.models import Token
from ..models import *
from django.utils import timezone
from datetime import timedelta
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from django.views.decorators.http import require_http_methods
import json


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

    # Get rating statistics
    ct = ContentType.objects.get_for_model(University)
    ratings = Rating.objects.filter(content_type=ct, object_id=university_id)
    avg_rating = ratings.aggregate(models.Avg('score'))['score__avg'] or 0
    rating_count = ratings.count()

    # Recursively serialize a comment and its replies
    def serialize_comment(comment):
        return {
            'id': comment.id,
            'content': comment.content,
            'created_at': comment.created_at.isoformat(),
            'is_anonymous': comment.is_anonymous,
            'user': comment.user.id if comment.user else None,
            'username': comment.user.username if (comment.user and not comment.is_anonymous) else None,
            'role': comment.user.profile.role if (
                    comment.user and hasattr(comment.user, 'profile') and not comment.is_anonymous) else None,
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
        'rating': {
            'average': round(float(avg_rating), 1),
            'count': rating_count
        }
    })


@require_GET
def college_detail_api(request, college_id):
    """
    Return details and top-level comments for a specific college.
    """
    college = get_object_or_404(College, id=college_id)
    comments_qs = college.comments.filter(parent=None).order_by('-created_at')

    # Get rating statistics
    ct = ContentType.objects.get_for_model(College)
    ratings = Rating.objects.filter(content_type=ct, object_id=college_id)
    avg_rating = ratings.aggregate(models.Avg('score'))['score__avg'] or 0
    rating_count = ratings.count()

    def serialize_comment(comment):
        return {
            'id': comment.id,
            'content': comment.content,
            'created_at': comment.created_at.isoformat(),
            'is_anonymous': comment.is_anonymous,
            'user': comment.user.id if comment.user else None,
            'username': comment.user.username if (comment.user and not comment.is_anonymous) else None,
            'role': comment.user.profile.role if (
                    comment.user and hasattr(comment.user, 'profile') and not comment.is_anonymous) else None,
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
        'rating': {
            'average': round(float(avg_rating), 1),
            'count': rating_count
        }
    })


@require_GET
def school_detail_api(request, school_id):
    """
    Return details and top-level comments for a specific school.
    """
    school = get_object_or_404(School, id=school_id)
    comments_qs = school.comments.filter(parent=None).order_by('-created_at')

    # Get rating statistics
    ct = ContentType.objects.get_for_model(School)
    ratings = Rating.objects.filter(content_type=ct, object_id=school_id)
    avg_rating = ratings.aggregate(models.Avg('score'))['score__avg'] or 0
    rating_count = ratings.count()

    def serialize_comment(comment):
        return {
            'id': comment.id,
            'content': comment.content,
            'created_at': comment.created_at.isoformat(),
            'is_anonymous': comment.is_anonymous,
            'user': comment.user.id if comment.user else None,
            'username': comment.user.username if (comment.user and not comment.is_anonymous) else None,
            'role': comment.user.profile.role if (
                    comment.user and hasattr(comment.user, 'profile') and not comment.is_anonymous) else None,
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
        'rating': {
            'average': round(float(avg_rating), 1),
            'count': rating_count
        }
    })


@require_GET
def module_detail_api(request, module_id):
    """
    Return details and top-level comments for a specific module.
    """
    module = get_object_or_404(Module, id=module_id)
    comments_qs = module.comments.filter(parent=None).order_by('-created_at')

    # Get rating statistics
    ct = ContentType.objects.get_for_model(Module)
    ratings = Rating.objects.filter(content_type=ct, object_id=module_id)
    avg_rating = ratings.aggregate(models.Avg('score'))['score__avg'] or 0
    rating_count = ratings.count()

    def serialize_comment(comment):
        return {
            'id': comment.id,
            'content': comment.content,
            'created_at': comment.created_at.isoformat(),
            'is_anonymous': comment.is_anonymous,
            'user': comment.user.id if comment.user else None,
            'username': comment.user.username if (comment.user and not comment.is_anonymous) else None,
            'role': comment.user.profile.role if (
                    comment.user and hasattr(comment.user, 'profile') and not comment.is_anonymous) else None,
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
        'rating': {
            'average': round(float(avg_rating), 1),
            'count': rating_count
        }
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

    # Get rating statistics
    ct = ContentType.objects.get_for_model(Teaching)
    ratings = Rating.objects.filter(content_type=ct, object_id=teaching_id)
    avg_rating = ratings.aggregate(models.Avg('score'))['score__avg'] or 0
    rating_count = ratings.count()

    # Recursively serialize a comment and its nested replies
    def serialize_comment(comment):
        return {
            'id': comment.id,
            'content': comment.content,
            'created_at': comment.created_at.isoformat(),
            'is_anonymous': comment.is_anonymous,
            'user': comment.user.id if comment.user else None,
            'username': comment.user.username if (comment.user and not comment.is_anonymous) else None,
            'role': comment.user.profile.role if (
                    comment.user and hasattr(comment.user, 'profile') and not comment.is_anonymous) else None,
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
        'lecturer_id': teaching.lecturer.id,
        'year': teaching.year,
        'module': teaching.module.name,
        'module_id': teaching.module.id,
        'module_info': module_info,
    }

    # Return teaching details and associated comments as JSON response
    return JsonResponse({
        'teaching': teaching_data,
        'comments': comments,
        'rating': {
            'average': round(float(avg_rating), 1),
            'count': rating_count
        }
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
    """Search for lecturers by name, with optional filters on university, college, school, module, and year."""

    # Retrieve query and filter parameters from the GET request
    query = request.GET.get('q', '').strip()  # Lecturer name (partial match)
    university_filter = request.GET.get('university_filter', '').strip()
    college_filter = request.GET.get('college_filter', '').strip()
    school_filter = request.GET.get('school_filter', '').strip()
    module_filter = request.GET.get('module_filter', '').strip()
    year_filter = request.GET.get('year_filter', '').strip()

    # Return early if no query is provided
    if not query:
        return JsonResponse({'lecturers': []})

    # Build filtering conditions for the Teaching model
    teaching_filters = {}

    # Parse university filter (can be either an ID or a name string)
    if university_filter:
        # Check if the filter string contains an explicit ID (format: "Name (ID: 123)")
        if '(ID:' in university_filter:
            # Extract the numeric ID from the string, e.g. "Oxford (ID: 123)" → "123"
            university_id = university_filter.split('(ID: ')[1].split(')')[0]
            # Filter teachings where the associated university matches this ID
            teaching_filters['module__school__college__university_id'] = university_id
        else:
            # If no ID is provided, treat the input as a university name substring
            # Apply a case-insensitive filter on the university name
            teaching_filters['module__school__college__university__name__icontains'] = university_filter

    # Parse college filter (by ID or name)
    if college_filter:
        if '(ID:' in college_filter:
            college_id = college_filter.split('(ID: ')[1].split(')')[0]
            teaching_filters['module__school__college_id'] = college_id
        else:
            teaching_filters['module__school__college__name__icontains'] = college_filter

    # Parse school filter (by ID or name)
    if school_filter:
        if '(ID:' in school_filter:
            school_id = school_filter.split('(ID: ')[1].split(')')[0]
            teaching_filters['module__school_id'] = school_id
        else:
            teaching_filters['module__school__name__icontains'] = school_filter

    # Parse module filter (by ID or name)
    if module_filter:
        if '(ID:' in module_filter:
            module_id = module_filter.split('(ID: ')[1].split(')')[0]
            teaching_filters['module_id'] = module_id
        else:
            teaching_filters['module__name__icontains'] = module_filter

    # Apply year filter if specified
    if year_filter:
        teaching_filters['year'] = year_filter

    # Query Teaching records based on the filters
    teachings_qs = Teaching.objects.filter(**teaching_filters)

    # Further filter by lecturer name (case-insensitive partial match)
    if query:
        teachings_qs = teachings_qs.filter(lecturer__name__icontains=query)

    # Get distinct lecturer IDs from the filtered teaching records
    lecturer_ids = teachings_qs.values_list('lecturer_id', flat=True).distinct()

    # Retrieve Lecturer objects matching the IDs, limit to top 10
    lecturers = Lecturer.objects.filter(id__in=lecturer_ids)[:10]

    # Prepare response data with teaching count for each lecturer
    data = []
    for lecturer in lecturers:
        count = teachings_qs.filter(lecturer=lecturer).count()  # Count matching teachings
        data.append({
            'id': lecturer.id,
            'name': lecturer.name,
            'teaching_count': count,
        })

    # Return the lecturer search results as JSON
    return JsonResponse({'lecturers': data})


@require_GET
def lecturer_details_api(request, lecturer_id):
    """
    Retrieve detailed information about a specific lecturer, including all teaching records
    and aggregated rating statistics. Supports optional filtering by university, college, school, and year.
    """

    # Get the Lecturer object by ID or return 404 if not found
    lecturer = get_object_or_404(Lecturer, id=lecturer_id)

    # Optional filters for narrowing down teaching records
    university_id = request.GET.get('university_id')
    college_id = request.GET.get('college_id')
    school_id = request.GET.get('school_id')
    year_filter = request.GET.get('year_filter')  # Get year filter from request

    # Base filter: only teachings by this lecturer
    teaching_filters = {'lecturer': lecturer}

    # Apply the most specific filter available (school > college > university)
    if school_id:
        teaching_filters['module__school_id'] = school_id
    elif college_id:
        teaching_filters['module__school__college_id'] = college_id
    elif university_id:
        teaching_filters['module__school__college__university_id'] = university_id
    # Apply year filter if provided
    if year_filter:
        teaching_filters['year'] = year_filter

    # Fetch all relevant Teaching records, including related module, school, college, university
    teachings = Teaching.objects.filter(**teaching_filters).select_related(
        'module__school__college__university'
    ).order_by('-year', 'module__name')

    # Initialize results structure and counters for rating aggregation
    teachings_by_year = {}  # Dictionary to group teaching records by year
    total_ratings = 0  # Total number of ratings received across all teachings
    total_rating_sum = 0.0  # Weighted sum of all rating scores

    # Loop through each teaching to compute statistics
    for teaching in teachings:
        year = teaching.year

        # Initialize the year bucket if needed
        if year not in teachings_by_year:
            teachings_by_year[year] = []

        # Fetch rating data for this specific teaching record
        ct = ContentType.objects.get_for_model(Teaching)
        ratings = Rating.objects.filter(content_type=ct, object_id=teaching.id)
        avg_rating = ratings.aggregate(models.Avg('score'))['score__avg'] or 0
        rating_count = ratings.count()

        # Update overall statistics
        total_ratings += rating_count
        total_rating_sum += float(avg_rating) * rating_count

        # Prepare individual teaching entry
        teaching_data = {
            'id': teaching.id,
            'module_name': teaching.module.name,
            'school_name': teaching.module.school.name,
            'college_name': teaching.module.school.college.name,
            'university_name': teaching.module.school.college.university.name,
            'year': teaching.year,
            'average_rating': round(float(avg_rating), 1),
            'rating_count': rating_count,
        }

        # Add the teaching to the appropriate year group
        teachings_by_year[year].append(teaching_data)

    # Compute overall average rating (only if there are any ratings)
    overall_average = 0
    if total_ratings > 0:
        overall_average = total_rating_sum / total_ratings

    # Build response object with lecturer info and stats
    lecturer_data = {
        'id': lecturer.id,
        'name': lecturer.name,
        'total_records': teachings.count(),  # Number of teaching records after filtering
        'total_ratings': total_ratings,  # Total number of ratings received
        'average_rating': round(overall_average, 1),  # Overall average score
        'teaching_records': teachings_by_year  # Teaching grouped by year
    }

    # Return as JSON response
    return JsonResponse(lecturer_data)


@require_GET
def lecturer_rating_trend_api(request, lecturer_id):
    """
    Return rating trends for a lecturer: per year, per course, and overall. Supports filtering by university_id, college_id, school_id, and year.
    Also returns per-year quartile statistics (Q1, median, Q3, min, max) for the overall distribution
    so that the frontend can render an interquartile-range (IQR) chart.
    """
    # Get the lecturer object or return 404 if not found
    lecturer = get_object_or_404(Lecturer, id=lecturer_id)

    # Optional filters to narrow down teachings
    university_id = request.GET.get('university_id')
    college_id = request.GET.get('college_id')
    school_id = request.GET.get('school_id')
    year_filter = request.GET.get('year_filter')  # Get year filter from request

    # Base queryset: all teachings by this lecturer
    teachings = Teaching.objects.filter(lecturer=lecturer)

    # Apply most specific location filter (school > college > university)
    if school_id:
        teachings = teachings.filter(module__school_id=school_id)
    elif college_id:
        teachings = teachings.filter(module__school__college_id=college_id)
    elif university_id:
        teachings = teachings.filter(module__school__college__university_id=university_id)
    # Apply year filter if provided
    if year_filter:
        teachings = teachings.filter(year=year_filter)

    # Optimize query to avoid extra DB hits
    teachings = teachings.select_related('module')

    # Get distinct years and module names taught
    years = sorted(set(t.year for t in teachings))  # All years taught
    course_names = sorted(set(t.module.name for t in teachings))  # All course/module names

    # Initialize nested dictionaries to store RAW rating scores (not per-teaching averages)
    course_year_scores = {name: {year: [] for year in years} for name in course_names}
    overall_year_scores = {year: [] for year in years}

    # Use Django ContentType to filter ratings tied to Teaching model
    ct = ContentType.objects.get_for_model(Teaching)

    # Aggregate RAW scores by module and year
    for t in teachings:
        ratings = Rating.objects.filter(content_type=ct, object_id=t.id)
        for r in ratings:
            try:
                score_val = float(r.score)
            except Exception:
                continue
            course_year_scores[t.module.name][t.year].append(score_val)
            overall_year_scores[t.year].append(score_val)

    # --- Compute per-year quartile statistics for the overall distribution ---
    def compute_quartiles(values):
        """Compute min, Q1, median (Q2), Q3, max for a list of numeric values.
        Returns a tuple (vmin, q1, q2, q3, vmax). If values is empty, returns Nones.
        """
        if not values:
            return (None, None, None, None, None)
        arr = sorted(values)
        n = len(arr)

        def median(a):
            m = len(a)
            mid = m // 2
            if m == 0:
                return None
            if m % 2 == 1:
                return float(a[mid])
            return (a[mid - 1] + a[mid]) / 2.0

        q2 = median(arr)
        if n % 2 == 0:
            lower = arr[: n // 2]
            upper = arr[n // 2 :]
        else:
            lower = arr[: n // 2]
            upper = arr[n // 2 + 1 :]

        q1 = median(lower)
        q3 = median(upper)
        return (float(arr[0]), float(q1) if q1 is not None else None, float(q2) if q2 is not None else None, float(q3) if q3 is not None else None, float(arr[-1]))

    overall_min = []
    overall_q1 = []
    overall_q2 = []  # median
    overall_q3 = []
    overall_max = []
    overall_avg = []
    for y in years:
        values = overall_year_scores[y]
        if values:
            vmin, q1, q2, q3, vmax = compute_quartiles(values)
            overall_min.append(round(vmin, 2) if vmin is not None else None)
            overall_q1.append(round(q1, 2) if q1 is not None else None)
            overall_q2.append(round(q2, 2) if q2 is not None else None)
            overall_q3.append(round(q3, 2) if q3 is not None else None)
            overall_max.append(round(vmax, 2) if vmax is not None else None)
            overall_avg.append(round(sum(values) / len(values), 2))
        else:
            overall_min.append(None)
            overall_q1.append(None)
            overall_q2.append(None)
            overall_q3.append(None)
            overall_max.append(None)
            overall_avg.append(None)

    # Utility to round a value to 2 decimals or return None
    def r2(val):
        return round(val, 2) if val is not None else None

    # Build per-course quartiles per year safely (avoid repeated compute calls and handle empties)
    courses_quartiles_safe = {}
    for name in course_names:
        per_year_min = []
        per_year_q1 = []
        per_year_q2 = []
        per_year_q3 = []
        per_year_max = []
        for y in years:
            vals = course_year_scores[name][y]
            if vals:
                vmin, q1, q2, q3, vmax = compute_quartiles(vals)
                per_year_min.append(r2(vmin))
                per_year_q1.append(r2(q1))
                per_year_q2.append(r2(q2))
                per_year_q3.append(r2(q3))
                per_year_max.append(r2(vmax))
            else:
                per_year_min.append(None)
                per_year_q1.append(None)
                per_year_q2.append(None)
                per_year_q3.append(None)
                per_year_max.append(None)
        courses_quartiles_safe[name] = {
            'min': per_year_min,
            'q1': per_year_q1,
            'median': per_year_q2,
            'q3': per_year_q3,
            'max': per_year_max,
        }

    # Prepare the JSON response
    result = {
        'years': years,  # List of years in sorted order

        # Overall average ratings per year (same as before)
        'overall': overall_avg,

        # Per-course average ratings per year (computed from RAW scores)
        'courses': {
            name: [
                round(sum(course_year_scores[name][y]) / len(course_year_scores[name][y]), 2)
                if course_year_scores[name][y] else None
                for y in years
            ]
            for name in course_names
        },

        # New: per-year quartile arrays for overall distribution
        'overall_quartiles': {
            'min': overall_min,
            'q1': overall_q1,
            'median': overall_q2,
            'q3': overall_q3,
            'max': overall_max,
        },

        # New: per-course quartile arrays per year (computed on the underlying per-teaching averages)
        'courses_quartiles': courses_quartiles_safe
    }

    return JsonResponse(result)


@require_GET
def lecturer_sentiment_api(request, lecturer_id):
    """
    Analyze sentiment of all comments for a given lecturer using VADER.
    Returns aggregate sentiment statistics and optionally per-comment sentiment.
    """
    # Get the Lecturer object by ID or return 404 if not found
    lecturer = get_object_or_404(Lecturer, id=lecturer_id)

    # Get all comments linked to this lecturer (including replies)
    comments = Comment.objects.filter(lecturer=lecturer)

    analyzer = SentimentIntensityAnalyzer()
    sentiment_results = []
    agg = {'pos': 0, 'neu': 0, 'neg': 0, 'compound': 0}
    count = 0

    for comment in comments:
        text = comment.content or ''
        scores = analyzer.polarity_scores(text)
        sentiment_results.append({
            'id': comment.id,
            'content': text,
            'sentiment': scores
        })
        agg['pos'] += scores['pos']
        agg['neu'] += scores['neu']
        agg['neg'] += scores['neg']
        agg['compound'] += scores['compound']
        count += 1

    # Compute average sentiment scores
    avg = {k: (v / count if count > 0 else 0) for k, v in agg.items()}

    return JsonResponse({
        'lecturer_id': lecturer.id,
        'lecturer_name': lecturer.name,
        'comment_count': count,
        'average_sentiment': avg,
        'comments': sentiment_results  # Optionally include per-comment sentiment
    })


@require_GET
def teaching_sentiment_api(request, teaching_id):
    """
    Analyze sentiment of all comments for a given teaching record using VADER.
    Returns aggregate sentiment statistics and optionally per-comment sentiment.
    """
    # Get the Teaching object by ID or return 404 if not found
    teaching = get_object_or_404(Teaching, id=teaching_id)

    # Get all comments linked to this teaching (including replies)
    comments = Comment.objects.filter(teaching=teaching)

    analyzer = SentimentIntensityAnalyzer()
    sentiment_results = []
    agg = {'pos': 0, 'neu': 0, 'neg': 0, 'compound': 0}
    count = 0

    for comment in comments:
        text = comment.content or ''
        scores = analyzer.polarity_scores(text)
        sentiment_results.append({
            'id': comment.id,
            'content': text,
            'sentiment': scores
        })
        agg['pos'] += scores['pos']
        agg['neu'] += scores['neu']
        agg['neg'] += scores['neg']
        agg['compound'] += scores['compound']
        count += 1

    # Compute average sentiment scores
    avg = {k: (v / count if count > 0 else 0) for k, v in agg.items()}

    return JsonResponse({
        'teaching_id': teaching.id,
        'lecturer_name': teaching.lecturer.name,
        'module_name': teaching.module.name,
        'comment_count': count,
        'average_sentiment': avg,
        'comments': sentiment_results  # Optionally include per-comment sentiment
    })


@require_GET
def teaching_wordcloud_api(request, teaching_id):
    """
    Generate word cloud data from all comments for a given teaching record.
    Returns word frequency data for visualization using simple text processing.
    """
    import re
    from collections import Counter
    
    # Get the Teaching object by ID or return 404 if not found
    teaching = get_object_or_404(Teaching, id=teaching_id)
    
    # Get all comments linked to this teaching (including replies)
    comments = Comment.objects.filter(teaching=teaching)
    
    # Combine all comment text
    all_text = ' '.join([comment.content or '' for comment in comments])
    
    # Clean and tokenize text using simple regex
    # Remove special characters and convert to lowercase
    cleaned_text = re.sub(r'[^\w\s]', '', all_text.lower())
    
    # Split into words
    words = cleaned_text.split()
    
    # Define common stop words to exclude from word cloud
    stop_words = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
        'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
        'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
        'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
        'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'his', 'hers', 'ours', 'theirs',
        'very', 'really', 'quite', 'just', 'only', 'also', 'too', 'so', 'as', 'than', 'more', 'most',
        # Keep evaluation words to show sentiment patterns
        # 'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'terrible', 'bad', 'awful',
        'like', 'love', 'hate', 'enjoy', 'dislike', 'think', 'feel', 'know', 'see', 'look', 'get', 'go',
        'come', 'make', 'take', 'give', 'say', 'tell', 'ask', 'want', 'need', 'use', 'work', 'study',
        'learn', 'teach', 'help', 'understand', 'explain', 'show', 'find', 'try', 'start', 'stop',
        'well', 'much', 'many', 'some', 'any', 'all', 'every', 'each', 'both', 'either', 'neither',
        'first', 'last', 'next', 'previous', 'current', 'new', 'old', 'young', 'big', 'small', 'high', 'low',
        'easy', 'hard', 'difficult', 'simple', 'complex', 'important', 'interesting', 'boring', 'fun',
        'nice', 'kind', 'friendly', 'helpful', 'patient', 'clear', 'organized', 'structured', 'logical'
    }
    
    # Filter words: remove stop words and short words
    filtered_words = [word for word in words if word not in stop_words and len(word) > 2]
    
    # Count word frequencies
    word_freq = Counter(filtered_words)
    
    # Get top 30 most frequent words
    top_words = word_freq.most_common(30)
    
    # Format data for word cloud visualization
    wordcloud_data = [
        {
            'text': word,
            'value': freq,
            'size': min(16 + freq * 3, 50)  # Scale font size based on frequency
        }
        for word, freq in top_words
    ]
    
    return JsonResponse({
        'teaching_id': teaching.id,
        'lecturer_name': teaching.lecturer.name,
        'module_name': teaching.module.name,
        'comment_count': len(comments),
        'wordcloud_data': wordcloud_data,
        'total_words': len(filtered_words)
    })


@csrf_exempt
def quick_search_api(request):
    """Perform a quick search across all entity types."""
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


@require_GET
def get_user_rating_api(request):
    """
    Get the current user's rating for a specific entity.
    """

    # Get entity type and ID from query parameters
    target_type = request.GET.get('target_type')
    target_id = request.GET.get('target_id')

    # Validate required parameters
    if not target_type or not target_id:
        return JsonResponse({'error': 'target_type and target_id are required'}, status=400)

    # --- User Authentication via Token ---
    auth_header = request.headers.get('Authorization')
    user = None
    if auth_header and auth_header.startswith('Token '):
        token_key = auth_header.split(' ', 1)[1]  # Extract token string
        try:
            token_obj = Token.objects.get(key=token_key)
            user = token_obj.user
        except Token.DoesNotExist:
            pass  # Invalid token

    # If user is not authenticated
    if not user:
        return JsonResponse({'error': 'Authentication required'}, status=401)

    # --- Check if the authenticated user is a student ---
    if not hasattr(user, 'profile') or user.profile.role != 'student':
        return JsonResponse({'score': 0})  # Only students can rate

    # --- Validate and get model by target_type ---
    model_map = {
        'university': 'University',
        'college': 'College',
        'school': 'School',
        'module': 'Module',
        'lecturer': 'Lecturer',
        'teaching': 'Teaching',
    }

    # Ensure the provided type is valid
    if target_type not in model_map:
        return JsonResponse({'error': 'Invalid target_type'}, status=400)

    # Get the model class and corresponding content type
    model = apps.get_model('edufeedbackhub', model_map[target_type])
    ct = ContentType.objects.get_for_model(model)

    # --- Retrieve the rating object for this user and entity ---
    try:
        rating = Rating.objects.get(user=user, content_type=ct, object_id=target_id)
        return JsonResponse({'score': float(rating.score)})  # Found rating
    except Rating.DoesNotExist:
        return JsonResponse({'score': 0})  # No rating found


@csrf_exempt
def visit_history_api(request):
    """
    GET: Return the current user's recent visit history records (max 20).
    POST: Save a new visit record for the current user (any entity type).
    Both require token authentication (Token in Authorization header).
    """
    # Get user from token
    user = None
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Token '):
        token_key = auth_header.split(' ', 1)[1]
        try:
            token_obj = Token.objects.get(key=token_key)
            user = token_obj.user
        except Token.DoesNotExist:
            return JsonResponse({'error': 'Invalid token'}, status=401)
    if not user:
        return JsonResponse({'error': 'Authentication required'}, status=401)

    if request.method == 'GET':
        # Query recent visit history for this user
        records = VisitHistory.objects.filter(user=user).order_by('-timestamp')[:20]
        # Serialize records for JSON response
        data = [
            {
                'id': r.id,
                'entityType': r.entity_type,
                'entityId': r.entity_id,
                'entityName': r.entity_name,
                'timestamp': r.timestamp.isoformat(),
            }
            for r in records
        ]
        return JsonResponse(data, safe=False)
    elif request.method == 'POST':
        import json
        try:
            data = json.loads(request.body)
        except Exception:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
        # Validate required fields
        required_fields = ['entityType', 'entityId', 'entityName']
        for field in required_fields:
            if not data.get(field):
                return JsonResponse({'error': f'Missing required field: {field}'}, status=400)
        
        # --- Improved Backend deduplication: check for recent record for this user/entity ---
        now = timezone.now()
        # Increase deduplication window to 5 minutes to avoid rapid duplicate visits
        five_minutes_ago = now - timedelta(minutes=5)
        
        # Check for existing record within the time window
        existing_record = VisitHistory.objects.filter(
            user=user,
            entity_type=data.get('entityType', ''),
            entity_id=data.get('entityId'),
            timestamp__gte=five_minutes_ago
        ).order_by('-timestamp').first()
        
        if existing_record:
            # Return the existing record with info about deduplication
            return JsonResponse({
                'id': existing_record.id,
                'entityType': existing_record.entity_type,
                'entityId': existing_record.entity_id,
                'entityName': existing_record.entity_name,
                'timestamp': existing_record.timestamp.isoformat(),
                'info': 'duplicate visit ignored - record exists within 5 minutes'
            })
        
        # Create new VisitHistory record
        try:
            record = VisitHistory.objects.create(
                user=user,
                entity_type=data.get('entityType', ''),
                entity_id=data.get('entityId'),
                entity_name=data.get('entityName', ''),
            )
            return JsonResponse({
                'id': record.id,
                'entityType': record.entity_type,
                'entityId': record.entity_id,
                'entityName': record.entity_name,
                'timestamp': record.timestamp.isoformat(),
            })
        except Exception as e:
            # Log the error and return a user-friendly message
            print(f"Error creating visit history record: {e}")
            return JsonResponse({'error': 'Failed to create visit record'}, status=500)
    else:
        # Method not allowed
        return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
@require_http_methods(["GET", "PUT"])
def profile_api(request):
    """
    API endpoint to get or update the current user's profile information.
    Supports GET (fetch profile) and PUT (update profile).
    Returns/updates: first_name, last_name, university, college, school, role.
    """
    # --- User Authentication via Token ---
    user = None
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Token '):
        token_key = auth_header.split(' ', 1)[1]
        try:
            from rest_framework.authtoken.models import Token
            token_obj = Token.objects.get(key=token_key)
            user = token_obj.user
        except Token.DoesNotExist:
            return JsonResponse({'error': 'Invalid token.'}, status=401)
    if not user:
        return JsonResponse({'error': 'Authentication required.'}, status=401)
    if not hasattr(user, 'profile'):
        return JsonResponse({'error': 'User profile not found.'}, status=404)
    profile = user.profile

    if request.method == 'GET':
        # Return profile info
        return JsonResponse({
            'first_name': user.first_name,
            'last_name': user.last_name,
            'university': getattr(profile, 'university', ''),
            'college': getattr(profile, 'college', ''),
            'school': getattr(profile, 'school', ''),
            'role': profile.role,
        })

    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
        except Exception:
            return JsonResponse({'error': 'Invalid JSON.'}, status=400)
        user.first_name = data.get('first_name', user.first_name)
        user.last_name = data.get('last_name', user.last_name)
        for field in ['university', 'college', 'school']:
            if field in data:
                setattr(profile, field, data[field])
        user.save()
        profile.save()
        return JsonResponse({'success': True})


@csrf_exempt
@require_http_methods(["GET", "PUT"])
def notifications_api(request):
    """
    API endpoint to get user notifications and mark them as read.
    GET: Returns all notifications for the current user.
    PUT: Marks specified notifications as read.
    """
    # User authentication via token
    user = None
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Token '):
        token_key = auth_header.split(' ', 1)[1]
        try:
            from rest_framework.authtoken.models import Token
            token_obj = Token.objects.get(key=token_key)
            user = token_obj.user
        except Token.DoesNotExist:
            return JsonResponse({'error': 'Invalid token.'}, status=401)
    if not user:
        return JsonResponse({'error': 'Authentication required.'}, status=401)

    if request.method == 'GET':
        # Get all notifications for the user, ordered by most recent first
        notifications = Notification.objects.filter(recipient=user).order_by('-created_at')
        
        # Serialize notifications for JSON response
        data = []
        for notification in notifications:
            # Get the target entity information for the original comment
            target_info = notification.comment.target_object()
            
            # Extract entity type and ID for creating links
            entity_type = None
            entity_id = None
            
            # Check which entity field is set and get its ID
            for field in ['university', 'college', 'school', 'module', 'lecturer', 'teaching']:
                obj = getattr(notification.comment, field)
                if obj:
                    entity_type = field
                    entity_id = obj.id
                    break
            
            # Determine if this is a follow notification or reply notification
            is_follow_notification = notification.comment.id == notification.reply.id
            
            data.append({
                'id': notification.id,
                'is_read': notification.is_read,
                'created_at': notification.created_at.isoformat(),
                'is_follow_notification': is_follow_notification,
                'original_comment': {
                    'id': notification.comment.id,
                    'content': notification.comment.content[:100] + '...' if len(notification.comment.content) > 100 else notification.comment.content,
                    'target': target_info,
                    'entity_type': entity_type,
                    'entity_id': entity_id,
                },
                'reply': {
                    'id': notification.reply.id,
                    'content': notification.reply.content[:100] + '...' if len(notification.reply.content) > 100 else notification.reply.content,
                    'user': notification.reply.user.email if notification.reply.user and not notification.reply.is_anonymous else 'Anonymous',
                    'created_at': notification.reply.created_at.isoformat(),
                }
            })
        
        return JsonResponse({
            'notifications': data,
            'unread_count': notifications.filter(is_read=False).count()
        })

    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
        except Exception:
            return JsonResponse({'error': 'Invalid JSON.'}, status=400)
        
        # Mark notifications as read
        notification_ids = data.get('notification_ids', [])
        if notification_ids:
            Notification.objects.filter(
                id__in=notification_ids,
                recipient=user
            ).update(is_read=True)
        
        return JsonResponse({'success': True})


@require_GET
def unread_notifications_count_api(request):
    """
    API endpoint to get the count of unread notifications for the current user.
    Used for displaying notification badge in the navigation bar.
    """
    # User authentication via token
    user = None
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Token '):
        token_key = auth_header.split(' ', 1)[1]
        try:
            from rest_framework.authtoken.models import Token
            token_obj = Token.objects.get(key=token_key)
            user = token_obj.user
        except Token.DoesNotExist:
            return JsonResponse({'error': 'Invalid token.'}, status=401)
    if not user:
        return JsonResponse({'error': 'Authentication required.'}, status=401)

    # Count unread notifications
    unread_count = Notification.objects.filter(recipient=user, is_read=False).count()
    
    return JsonResponse({'unread_count': unread_count})


@csrf_exempt
@require_http_methods(["POST", "DELETE"])
def follow_api(request):
    """
    API endpoint to follow or unfollow an entity.
    POST: Follow an entity
    DELETE: Unfollow an entity
    """
    # User authentication via token
    user = None
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Token '):
        token_key = auth_header.split(' ', 1)[1]
        try:
            from rest_framework.authtoken.models import Token
            token_obj = Token.objects.get(key=token_key)
            user = token_obj.user
        except Token.DoesNotExist:
            return JsonResponse({'error': 'Invalid token.'}, status=401)
    if not user:
        return JsonResponse({'error': 'Authentication required.'}, status=401)

    # Parse request data
    try:
        data = json.loads(request.body)
        entity_type = data.get('entity_type')
        entity_id = data.get('entity_id')
    except Exception:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    # Validate required fields
    if not entity_type or not entity_id:
        return JsonResponse({'error': 'entity_type and entity_id are required.'}, status=400)

    # Validate entity_type
    valid_entity_types = ['university', 'college', 'school', 'module', 'lecturer', 'teaching']
    if entity_type not in valid_entity_types:
        return JsonResponse({'error': 'Invalid entity_type.'}, status=400)

    # Validate entity_id is a positive integer
    try:
        entity_id = int(entity_id)
        if entity_id <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return JsonResponse({'error': 'entity_id must be a positive integer.'}, status=400)

    if request.method == 'POST':
        # Follow the entity
        follow, created = Follow.objects.get_or_create(
            user=user,
            entity_type=entity_type,
            entity_id=entity_id
        )
        if created:
            return JsonResponse({'success': True, 'action': 'followed'})
        else:
            return JsonResponse({'success': True, 'action': 'already_following'})
    
    elif request.method == 'DELETE':
        # Unfollow the entity
        try:
            follow = Follow.objects.get(
                user=user,
                entity_type=entity_type,
                entity_id=entity_id
            )
            follow.delete()
            return JsonResponse({'success': True, 'action': 'unfollowed'})
        except Follow.DoesNotExist:
            return JsonResponse({'success': True, 'action': 'not_following'})


@require_GET
def follow_status_api(request):
    """
    API endpoint to check if a user is following a specific entity.
    """
    # User authentication via token
    user = None
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Token '):
        token_key = auth_header.split(' ', 1)[1]
        try:
            from rest_framework.authtoken.models import Token
            token_obj = Token.objects.get(key=token_key)
            user = token_obj.user
        except Token.DoesNotExist:
            return JsonResponse({'error': 'Invalid token.'}, status=401)
    if not user:
        return JsonResponse({'error': 'Authentication required.'}, status=401)

    # Get query parameters
    entity_type = request.GET.get('entity_type')
    entity_id = request.GET.get('entity_id')

    # Validate required fields
    if not entity_type or not entity_id:
        return JsonResponse({'error': 'entity_type and entity_id are required.'}, status=400)

    # Validate entity_type
    valid_entity_types = ['university', 'college', 'school', 'module', 'lecturer', 'teaching']
    if entity_type not in valid_entity_types:
        return JsonResponse({'error': 'Invalid entity_type.'}, status=400)

    # Validate entity_id is a positive integer
    try:
        entity_id = int(entity_id)
        if entity_id <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return JsonResponse({'error': 'entity_id must be a positive integer.'}, status=400)

    # Check if user is following the entity
    is_following = Follow.objects.filter(
        user=user,
        entity_type=entity_type,
        entity_id=entity_id
    ).exists()

    return JsonResponse({'is_following': is_following})
