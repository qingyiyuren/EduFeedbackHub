"""
This module contains API view functions for modifying data.
It provides endpoints for adding, deleting comments and managing various entities,
including user registration, login, and rating functionality.
"""

import json
from decimal import Decimal
from django.apps import apps
from django.contrib.auth import authenticate
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from rest_framework.authtoken.models import Token
from ..models import *


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

    # Get current user
    user = None
    is_anonymous = bool(data.get('is_anonymous', False))
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Token '):
        token_key = auth_header.split(' ', 1)[1]
        try:
            token_obj = Token.objects.get(key=token_key)
            user = token_obj.user
        except Token.DoesNotExist:
            pass

    # Create a Comment object, dynamically associating it with the target object
    comment = Comment.objects.create(
        content=content,
        parent=parent,
        is_anonymous=is_anonymous,
        user=user,
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
    Deletes a comment by ID. Only the comment's author can delete it.
    """
    comment = get_object_or_404(Comment, id=comment_id)
    # Get current logged-in user
    user = None
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Token '):
        from rest_framework.authtoken.models import Token
        token_key = auth_header.split(' ', 1)[1]
        try:
            token_obj = Token.objects.get(key=token_key)
            user = token_obj.user
        except Token.DoesNotExist:
            pass
    # Only the comment's author can delete it (including anonymous comments, user field always set)
    if not user or comment.user != user:
        return JsonResponse({'error': 'You do not have permission to delete this comment.'}, status=403)
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


@csrf_exempt
@require_POST
def login_api(request):
    """Handles user login by verifying credentials and returning an authentication token."""
    try:
        # Attempt to parse JSON data from the request body
        data = json.loads(request.body)
    except Exception:
        # Return 400 error if JSON is invalid
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    # Extract username and password from parsed data, default to empty string and strip whitespace
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    # Check if the user with the given username exists
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        # Return 401 error if user not found
        return JsonResponse({'error': 'Account does not exist. Please register first.'}, status=401)

    # Authenticate user credentials (username and password)
    user_auth = authenticate(username=username, password=password)
    if user_auth is None:
        # Return 401 error if password is incorrect
        return JsonResponse({'error': 'Password is incorrect.'}, status=401)

    # Verify if user profile exists
    if not hasattr(user, 'profile'):
        # Return 500 error if profile missing, ask to contact admin
        return JsonResponse({'error': 'User profile not found. Please contact admin.'}, status=500)

    # Create or get authentication token for the user
    token, _ = Token.objects.get_or_create(user=user)

    # Retrieve user role from profile
    user_role = user.profile.role

    # Return token, role, and user ID as JSON response
    return JsonResponse({'token': token.key, 'role': user_role, 'user_id': user.id})


@csrf_exempt
@require_POST
def register_api(request):
    """Handles user registration by creating a new user and profile with a specified role."""
    try:
        # Attempt to parse JSON data from the request body
        data = json.loads(request.body)
    except Exception:
        # Return 400 error if JSON is invalid
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    # Extract username and password from the data, stripping whitespace
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    # Extract role from data, default to 'student', and convert to lowercase
    role = data.get('role', 'student').strip().lower()

    # Validate that role is either 'student' or 'lecturer'
    if role not in ['student', 'lecturer']:
        return JsonResponse({'error': 'Invalid role. Must be "student" or "lecturer".'}, status=400)

    # Check that username and password are provided
    if not username or not password:
        return JsonResponse({'error': 'username and password are required'}, status=400)

    # Check if a user with this username already exists
    if User.objects.filter(username=username).exists():
        return JsonResponse({'error': 'Username already exists'}, status=409)

    # Create a new user with the given username and password
    user = User.objects.create_user(username=username, password=password)

    # Create a related profile for the user with the specified role
    Profile.objects.create(user=user, role=role)

    # Return success message and the new user's ID
    return JsonResponse({'message': 'Registration successful', 'user_id': user.id})


@csrf_exempt
@require_POST
def rate_api(request):
    """
    Generic API for rating any entity (university, college, school, module, etc.).
    Only students can rate. Auth required.
    """
    try:
        # Parse JSON data from request body
        data = json.loads(request.body)
    except Exception:
        # Return error if JSON is invalid
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    target_type = data.get('target_type')  # Target entity type, e.g. 'university'
    target_id = data.get('target_id')  # ID of the target entity
    score = data.get('score')  # Rating score

    # Validate input presence
    if not target_type or not target_id or score is None:
        return JsonResponse({'error': 'target_type, target_id, and score are required'}, status=400)
    try:
        # Convert score to Decimal for precision
        score = Decimal(str(score))
    except Exception:
        # Return error if score is not a valid number
        return JsonResponse({'error': 'Invalid score'}, status=400)
    # Check score is an integer between 1 and 5 inclusive
    if score not in [1, 2, 3, 4, 5]:
        return JsonResponse({'error': 'Score must be an integer between 1 and 5'}, status=400)

    # Authenticate user from Authorization header token
    auth_header = request.headers.get('Authorization')
    user = None
    if auth_header and auth_header.startswith('Token '):
        token_key = auth_header.split(' ', 1)[1]
        try:
            token_obj = Token.objects.get(key=token_key)
            user = token_obj.user
        except Token.DoesNotExist:
            pass
    # Reject if user not authenticated
    if not user:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    # Only users with profile role 'student' are allowed to rate
    if not hasattr(user, 'profile') or user.profile.role != 'student':
        return JsonResponse({'error': 'Only students can rate'}, status=403)

    # Map target_type string to model class name
    model_map = {
        'university': 'University',
        'college': 'College',
        'school': 'School',
        'module': 'Module',
        'lecturer': 'Lecturer',
        'teaching': 'Teaching',
    }
    # Validate target_type
    if target_type not in model_map:
        return JsonResponse({'error': 'Invalid target_type'}, status=400)
    # Dynamically get the model class
    model = apps.get_model('edufeedbackhub', model_map[target_type])
    # Get the target object by ID
    target_obj = model.objects.filter(id=target_id).first()
    if not target_obj:
        return JsonResponse({'error': 'Target object not found'}, status=404)

    # Use ContentType framework to create or update a generic Rating object
    ct = ContentType.objects.get_for_model(model)
    rating, created = Rating.objects.get_or_create(
        user=user,
        content_type=ct,
        object_id=target_id,
        defaults={'score': score}
    )
    if not created:
        # Update existing rating score
        rating.score = score
        rating.save()

    # Calculate average score and total number of ratings for the target object
    all_ratings = Rating.objects.filter(content_type=ct, object_id=target_id)
    avg = all_ratings.aggregate(models.Avg('score'))['score__avg'] or 0
    count = all_ratings.count()

    # Return JSON response with average score, count, and user's current score
    return JsonResponse({'average': round(float(avg), 1), 'count': count, 'score': float(score)})
