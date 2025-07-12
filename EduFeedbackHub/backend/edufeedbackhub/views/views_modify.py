"""
This file contains API view functions for modifying data.
It includes endpoints for adding comments and various entities.
"""

from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from ..models import *
from django.apps import apps
import json


@csrf_exempt  # Disable CSRF protection (for development/testing only).
@require_POST  # Ensures that only POST requests are allowed for this view
def add_comment_api(request):
    """
    Adds a new comment to a specified target object (e.g., university, college).
    """
    try:
        # Attempt to parse JSON data from the request body
        data = json.loads(request.body)
    except Exception:
        # If JSON is invalid, return HTTP 400 with error message
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    # Extract 'content' field and strip whitespace
    content = data.get('content', '').strip()
    # If content is empty, return error
    if not content:
        return JsonResponse({'error': 'Content is required'}, status=400)

    # Initialize parent comment as None
    parent = None
    # If 'parent_id' is provided, fetch the parent Comment object (reply case)
    if data.get('parent_id'):
        parent = get_object_or_404(Comment, id=data['parent_id'])

    # Map possible foreign key fields to model names
    field_model_map = {
        'university_id': 'University',
        'college_id': 'College',
        'school_id': 'School',
        'module_id': 'Module',
        'lecturer_id': 'Lecturer',
        'teaching_id': 'Teaching',
    }

    # Initialize variables for the target object and its field name
    target_obj = None
    target_field = None

    # Iterate over possible fields to find which target object is specified
    for field, model_name in field_model_map.items():
        val = data.get(field)
        if val:
            # Dynamically get the model class for the specified model name
            model = apps.get_model('edufeedbackhub', model_name)
            # Retrieve the target object by ID or return 404 if not found
            target_obj = get_object_or_404(model, id=val)
            # Remove the '_id' suffix to get the model field name (e.g., 'university')
            target_field = field.replace('_id', '')
            break  # Stop after finding the first valid target object

    # If no valid target object is specified, return error
    if not target_obj:
        return JsonResponse({'error': 'No valid target object specified'}, status=400)

    # Create a Comment object, dynamically associating it with the target object
    comment = Comment.objects.create(
        content=content,
        parent=parent,
        # Using dictionary unpacking to dynamically set the foreign key field
        # Equivalent to something like university=target_obj if target_field is 'university'
        **{target_field: target_obj}
    )

    # Return the newly created comment data as JSON
    return JsonResponse({
        'id': comment.id,
        'content': comment.content,
        'created_at': comment.created_at.isoformat(),
        # Assumes Comment model has a method target_object() to describe the linked target
        'target': comment.target_object(),
    })


@csrf_exempt
@require_POST
def delete_comment_api(request, comment_id):
    """
    Deletes a comment by ID.
    """
    comment = get_object_or_404(Comment, id=comment_id)
    comment.delete()
    return JsonResponse({'message': 'Comment deleted successfully'})


@csrf_exempt
@require_POST
def add_university_api(request):
    """Add a new university under an existing region."""
    try:
        # Attempt to parse JSON data from the request body
        data = json.loads(request.body)
    except Exception:
        # Return 400 error if JSON is invalid
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    # Retrieve university name and region name from data, stripping whitespace
    name = data.get('name', '').strip()
    region_name = data.get('region', '').strip()

    # Return error if either university name or region name is missing
    if not name or not region_name:
        return JsonResponse({'error': 'Both name and region are required'}, status=400)

    # Query the Region object by name (case-insensitive), take the first match
    region_obj = Region.objects.filter(name__iexact=region_name).first()
    # Return error if the region does not exist
    if not region_obj:
        return JsonResponse({'error': f'Region "{region_name}" not found'}, status=400)

    # Check if a university with the same name already exists in this region (case-insensitive)
    exists = University.objects.filter(name__iexact=name, region=region_obj).first()
    # If such university exists, return error and existing university info with status 409 Conflict
    if exists:
        return JsonResponse({
            'error': 'University already exists',
            'existing_university': {
                'id': exists.id,
                'name': exists.name,
                'region': exists.region.name if exists.region else None,
            }
        }, status=409)

    # Create a new University object linked to the found region
    uni = University.objects.create(name=name, region=region_obj)

    # Return the newly created university info, including id, name, and region name
    return JsonResponse({
        'id': uni.id,
        'name': uni.name,
        'region': uni.region.name if uni.region else None
    })


@csrf_exempt
@require_POST
def add_college_api(request):
    """Add a new college under a given university."""
    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    name = data.get('name', '').strip()
    university_id = data.get('university_id')

    if not name or not university_id:
        return JsonResponse({'error': 'Both name and university_id are required'}, status=400)

    university = get_object_or_404(University, id=university_id)

    exists = College.objects.filter(name__iexact=name, university=university).first()
    if exists:
        return JsonResponse({
            'error': 'College already exists',
            'existing_college': {
                'id': exists.id,
                'name': exists.name,
                'university': exists.university.name,
            }
        }, status=409)

    college = College.objects.create(name=name, university=university)
    return JsonResponse({'id': college.id, 'name': college.name, 'university': college.university.name})


@csrf_exempt
@require_POST
def add_school_api(request):
    """Add a new school under a given college."""
    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    name = data.get('name', '').strip()
    college_id = data.get('college_id')

    if not name or not college_id:
        return JsonResponse({'error': 'Both name and college_id are required'}, status=400)

    college = get_object_or_404(College, id=college_id)

    exists = School.objects.filter(name__iexact=name, college=college).first()
    if exists:
        return JsonResponse({
            'error': 'School already exists',
            'existing_school': {
                'id': exists.id,
                'name': exists.name,
                'college': exists.college.name,
            }
        }, status=409)

    school = School.objects.create(name=name, college=college)
    return JsonResponse({'id': school.id, 'name': school.name, 'college': school.college.name})


@csrf_exempt
@require_POST
def add_module_api(request):
    """Add a new module under a given school."""
    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    name = data.get('name', '').strip()
    school_id = data.get('school_id')

    if not name or not school_id:
        return JsonResponse({'error': 'Both name and school_id are required'}, status=400)

    school = get_object_or_404(School, id=school_id)

    exists = Module.objects.filter(name__iexact=name, school=school).first()
    if exists:
        return JsonResponse({
            'error': 'Module already exists',
            'existing_module': {
                'id': exists.id,
                'name': exists.name,
                'school': exists.school.name,
            }
        }, status=409)

    module = Module.objects.create(name=name, school=school)
    return JsonResponse({
        'id': module.id,
        'name': module.name,
        'school': module.school.name,
    })


@csrf_exempt
@require_POST
def add_lecturer_api(request):
    """Add a new lecturer."""
    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    name = data.get('name', '').strip()

    if not name:
        return JsonResponse({'error': 'Name is required'}, status=400)

    exists = Lecturer.objects.filter(name__iexact=name).first()
    if exists:
        return JsonResponse({
            'error': 'Lecturer already exists',
            'existing_lecturer': {
                'id': exists.id,
                'name': exists.name,
            }
        }, status=409)

    lecturer = Lecturer.objects.create(name=name)
    return JsonResponse({
        'id': lecturer.id,
        'name': lecturer.name
    })


@csrf_exempt
@require_POST
def add_teaching_api(request):
    """Add a teaching record where a lecturer teaches a module in a specific year."""
    try:
        # Attempt to parse JSON data from the request body
        data = json.loads(request.body)
    except Exception:
        # Return error if JSON is invalid
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    # Extract lecturer ID, module ID, and year from the request data
    lecturer_id = data.get('lecturer_id')
    module_id = data.get('module_id')
    year = data.get('year')

    # Return error if any required field is missing
    if not lecturer_id or not module_id or not year:
        return JsonResponse({'error': 'lecturer_id, module_id, and year are required'}, status=400)

    # Retrieve the Lecturer and Module objects based on the given IDs
    lecturer = get_object_or_404(Lecturer, id=lecturer_id)
    module = get_object_or_404(Module, id=module_id)

    # Check if a Teaching record for this lecturer-module-year combination already exists
    exists = Teaching.objects.filter(
        lecturer=lecturer,
        module=module,
        year=year
    ).first()

    # If such a record exists, return a 409 Conflict error with existing data
    if exists:
        return JsonResponse({
            'error': 'Teaching record already exists',
            'existing_teaching': {
                'id': exists.id,
                'lecturer': exists.lecturer.name,
                'module': exists.module.name,
                'year': exists.year,
            }
        }, status=409)

    # Create a new Teaching record
    teaching = Teaching.objects.create(
        lecturer=lecturer,
        module=module,
        year=year
    )

    # Return the newly created teaching record as a JSON response
    return JsonResponse({
        'id': teaching.id,
        'lecturer': teaching.lecturer.name,
        'module': teaching.module.name,
        'year': teaching.year,
    })
