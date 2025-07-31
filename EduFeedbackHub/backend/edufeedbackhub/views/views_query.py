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

    # Initialize nested dictionaries to store ratings
    course_year_rating = {name: {year: [] for year in years} for name in course_names}
    overall_year_rating = {year: [] for year in years}

    # Use Django ContentType to filter ratings tied to Teaching model
    ct = ContentType.objects.get_for_model(Teaching)

    # Aggregate ratings by module and year
    for t in teachings:
        ratings = Rating.objects.filter(content_type=ct, object_id=t.id)
        avg = ratings.aggregate(Avg('score'))['score__avg']
        if avg is not None:
            course_year_rating[t.module.name][t.year].append(float(avg))
            overall_year_rating[t.year].append(float(avg))

    # Prepare the JSON response
    result = {
        'years': years,  # List of years in sorted order

        # Overall average ratings per year
        'overall': [
            round(sum(overall_year_rating[y]) / len(overall_year_rating[y]), 2) if overall_year_rating[y] else None
            for y in years
        ],

        # Per-course average ratings per year
        'courses': {
            name: [
                round(sum(course_year_rating[name][y]) / len(course_year_rating[name][y]), 2)
                if course_year_rating[name][y] else None
                for y in years
            ]
            for name in course_names
        }
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
        # --- Backend deduplication: only save if no recent record for this user/entity ---
        now = timezone.now()
        one_minute_ago = now - timedelta(minutes=1)
        exists = VisitHistory.objects.filter(
            user=user,
            entity_type=data.get('entityType', ''),
            entity_id=data.get('entityId'),
            timestamp__gte=one_minute_ago
        ).exists()
        if exists:
            # Return the latest record (or just a message)
            latest = VisitHistory.objects.filter(
                user=user,
                entity_type=data.get('entityType', ''),
                entity_id=data.get('entityId')
            ).order_by('-timestamp').first()
            return JsonResponse({
                'id': latest.id,
                'entityType': latest.entity_type,
                'entityId': latest.entity_id,
                'entityName': latest.entity_name,
                'timestamp': latest.timestamp.isoformat(),
                'info': 'duplicate visit ignored'
            })
        # Create VisitHistory record
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
