"""
This file contains API view functions for querying university-related data and managing comments.
It includes endpoints for listing rankings, retrieving details of institutions, posting and deleting comments, and performing search operations.
"""

from django.shortcuts import get_object_or_404, redirect
from django.http import JsonResponse
from django.views.decorators.http import require_POST, require_GET
from django.views.decorators.csrf import csrf_exempt
from ..models import (
    YearRanking, UniversityRanking, University, College, School, Department,
    Module, Lecturer, Teaching, Comment, Region
)
import json
from django.apps import apps  # Used for dynamically loading models


def root_redirect(request):
    # Redirects the root URL to the home API endpoint.
    return redirect('home_api')


def home_api(request):
    # Returns a simple welcome message.
    return JsonResponse({"message": "Welcome to EduFeedbackHub API"})


@require_GET  # Ensures that the view only accepts HTTP GET requests; returns 405 Method Not Allowed for others
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


@require_GET
def university_detail_api(request, university_id):
    """
    Returns detail and top-level comments for a given university.
    """
    # Retrieve the University object by ID, or return 404 if not found
    university = get_object_or_404(University, id=university_id)

    # Query top-level comments for the university (comments with no parent), ordered by creation date descending
    comments_qs = university.comments.filter(parent=None).order_by('-created_at')

    # Recursive function to serialize a comment and its replies into dictionary form
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

    # Serialize all top-level comments into a list
    comments = [serialize_comment(c) for c in comments_qs]

    # Construct university data dictionary with id, name, and region name (if available)
    university_data = {
        'id': university.id,
        'name': university.name,
        'region': university.region.name if university.region else None,
    }

    # Return JSON response with university info and serialized comments
    return JsonResponse({
        'university': university_data,
        'comments': comments,
    })


@require_GET
def college_detail_api(request, college_id):
    """
    Returns detail and top-level comments for a given college.
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


@csrf_exempt  # Disable CSRF protection to allow requests from external frontends like React
@require_POST
# Decorator that ensures the view only accepts POST requests.
# If the request method is not POST, it returns a 405 Method Not Allowed response.
def add_comment_api(request):
    """
    Adds a new comment to a specified target object (e.g., university, college).
    """
    try:
        # Attempt to parse the request body as JSON data
        data = json.loads(request.body)
    except Exception:
        # Return 400 error if JSON is invalid
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    # Extract and strip comment content from the data
    content = data.get('content', '').strip()
    if not content:
        # Return 400 error if content is empty
        return JsonResponse({'error': 'Content is required'}, status=400)

    parent = None
    # If a parent_id is provided, retrieve the parent comment (for replies)
    if data.get('parent_id'):
        parent = get_object_or_404(Comment, id=data['parent_id'])

    # Map of target ID fields to model names that can be commented on
    field_model_map = {
        'university_id': 'University',
        'college_id': 'College',
        'school_id': 'School',
        'department_id': 'Department',
        'module_id': 'Module',
        'lecturer_id': 'Lecturer',
        'teaching_id': 'Teaching',
    }

    target_obj = None
    target_field = None

    # Iterate over the map to find which target object is specified in the request
    for field, model_name in field_model_map.items():
        val = data.get(field)
        if val:
            # Dynamically get the model class
            model = apps.get_model('edufeedbackhub', model_name)
            # Retrieve the target object by ID or return 404 if not found
            target_obj = get_object_or_404(model, id=val)
            # Remove '_id' suffix to get the Comment model field name
            target_field = field.replace('_id', '')
            break

    # If no target object is specified, return 400 error
    if not target_obj:
        return JsonResponse({'error': 'Must specify one target object to comment on'}, status=400)

    # Create a new Comment instance with content and optional parent
    comment = Comment(content=content, parent=parent)
    # Set the target object field (e.g., university, college) dynamically
    setattr(comment, target_field, target_obj)
    # Save the comment in the database
    comment.save()

    # Return success message and the new comment's ID
    return JsonResponse({'message': 'Comment added', 'comment_id': comment.id})


@csrf_exempt
@require_POST
def delete_comment_api(request, comment_id):
    """
    Deletes a specific comment by ID.
    """
    comment = get_object_or_404(Comment, id=comment_id)
    comment.delete()
    return JsonResponse({'message': 'Comment deleted'})


@require_GET
def search_university_api(request):
    """
    Searches universities by name substring.
    """
    query = request.GET.get('q', '').strip()
    # Return an empty list if the search query is empty
    if not query:
        return JsonResponse({'universities': []})

    # Perform a case-insensitive search for universities whose name contains the query string, limit to 20 results
    matches = University.objects.filter(name__icontains=query)[:20]

    # Convert query results to a list of dictionaries with id, name, and region name (if available)
    results = [
        {
            'id': u.id,
            'name': u.name,
            'region': u.region.name if u.region else None
        } for u in matches
    ]

    # Return a JSON response containing the list of matched universities
    return JsonResponse({'universities': results})


@require_GET
def search_region_api(request):
    """
    Searches regions by name substring.
    """
    query = request.GET.get('q', '').strip()
    if not query:
        return JsonResponse({'regions': []})

    matches = Region.objects.filter(name__icontains=query)[:20]
    regions = [r.name for r in matches]
    return JsonResponse({'regions': regions})


@require_GET
def search_college_api(request):
    """
    Searches colleges by name substring within a specific university.
    """
    query = request.GET.get('q', '').strip()
    uni_id = request.GET.get('university_id')
    if not query or not uni_id:
        return JsonResponse({'colleges': []})

    matches = College.objects.filter(name__icontains=query, university_id=uni_id)[:20]
    results = [{'id': c.id, 'name': c.name} for c in matches]
    return JsonResponse({'colleges': results})


# @require_GET
# def search_school_api(request):
#     """
#     Searches schools by name substring within a specific college.
#     """
#     query = request.GET.get('q', '').strip()
#     college_id = request.GET.get('college_id')
#     if not query or not college_id:
#         return JsonResponse({'schools': []})
#
#     School = apps.get_model('edufeedbackhub', 'School')
#     matches = School.objects.filter(name__icontains=query, college_id=college_id)[:20]
#     results = [{'id': s.id, 'name': s.name} for s in matches]
#     return JsonResponse({'schools': results})
#
#
# @require_GET
# def search_department_api(request):
#     """
#     Searches departments by name substring within a specific school.
#     """
#     query = request.GET.get('q', '').strip()
#     school_id = request.GET.get('school_id')
#     if not query or not school_id:
#         return JsonResponse({'departments': []})
#
#     Department = apps.get_model('edufeedbackhub', 'Department')
#     matches = Department.objects.filter(name__icontains=query, school_id=school_id)[:20]
#     results = [{'id': d.id, 'name': d.name} for d in matches]
#     return JsonResponse({'departments': results})
#
#
# @require_GET
# def search_module_api(request):
#     """
#     Searches modules by name substring within a specific school or department.
#     """
#     query = request.GET.get('q', '').strip()
#     school_id = request.GET.get('school_id')
#     department_id = request.GET.get('department_id')
#
#     if not query or (not school_id and not department_id):
#         return JsonResponse({'modules': []})
#
#     Module = apps.get_model('edufeedbackhub', 'Module')
#     filters = {'name__icontains': query}
#     if school_id:
#         filters['school_id'] = school_id
#     if department_id:
#         filters['department_id'] = department_id
#
#     matches = Module.objects.filter(**filters)[:20]
#     results = [{'id': m.id, 'name': m.name} for m in matches]
#     return JsonResponse({'modules': results})
#
#
# @require_GET
# def search_lecturer_api(request):
#     """
#     Searches lecturers by name substring.
#     """
#     query = request.GET.get('q', '').strip()
#     if not query:
#         return JsonResponse({'lecturers': []})
#
#     Lecturer = apps.get_model('edufeedbackhub', 'Lecturer')
#     matches = Lecturer.objects.filter(name__icontains=query)[:20]
#     results = [{'id': l.id, 'name': l.name} for l in matches]
#     return JsonResponse({'lecturers': results})
