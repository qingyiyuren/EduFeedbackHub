"""
This file contains API view functions for adding various entities (University, College, School under College, Department, Module, and Lecturer).
Each function handles POST requests for its corresponding entity, validates input data, avoids duplication, and creates new records.
"""

from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from ..models import (
    University, Region, College, School, Department,
    Module, Lecturer
)
import json


@csrf_exempt  # Disable CSRF protection to allow requests from external frontends like React
@require_http_methods(["POST"])  # Only allow POST requests
def add_university_api(request):
    """Add a new university under an existing region."""

    try:
        # Attempt to parse the JSON data from the request body
        data = json.loads(request.body)
    except Exception:
        # Return a 400 error if JSON parsing fails
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    # Extract and trim the university name from the data
    name = data.get('name', '').strip()
    # Extract and trim the region name from the data
    region_name = data.get('region', '').strip()

    # Return 400 error if either name or region is missing
    if not name or not region_name:
        return JsonResponse({'error': 'Both name and region are required'}, status=400)

    # Try to find a Region object matching the region name (case-insensitive)
    region_obj = Region.objects.filter(name__iexact=region_name).first()
    # Return 400 error if no matching region is found
    if not region_obj:
        return JsonResponse({'error': f'Region "{region_name}" not found'}, status=400)

    # Check if a university with the same name already exists in this region (case-insensitive)
    exists = University.objects.filter(name__iexact=name, region=region_obj).first()
    # If found, return 409 Conflict error with existing university info to avoid duplicates
    if exists:
        return JsonResponse({
            'error': 'University already exists',
            'existing_university': {
                'id': exists.id,
                'name': exists.name,
                'region': exists.region.name if exists.region else None,
            }
        }, status=409)

    # Create a new University instance linked to the found region
    uni = University.objects.create(name=name, region=region_obj)

    # Return the newly created university's ID, name, and region name as JSON
    return JsonResponse({
        'id': uni.id,
        'name': uni.name,
        'region': uni.region.name if uni.region else None
    })


@csrf_exempt
@require_http_methods(["POST"])
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
@require_http_methods(["POST"])
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
@require_http_methods(["POST"])
def add_department_api(request):
    """Add a new department under a given school."""
    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    name = data.get('name', '').strip()
    school_id = data.get('school_id')

    if not name or not school_id:
        return JsonResponse({'error': 'Both name and school_id are required'}, status=400)

    school = get_object_or_404(School, id=school_id)

    exists = Department.objects.filter(name__iexact=name, school=school).first()
    if exists:
        return JsonResponse({
            'error': 'Department already exists',
            'existing_department': {
                'id': exists.id,
                'name': exists.name,
                'school': exists.school.name,
            }
        }, status=409)

    department = Department.objects.create(name=name, school=school)
    return JsonResponse({'id': department.id, 'name': department.name, 'school': department.school.name})


@csrf_exempt
@require_http_methods(["POST"])
def add_module_api(request):
    """Add a new module under a given department."""
    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    name = data.get('name', '').strip()
    department_id = data.get('department_id')

    if not name or not department_id:
        return JsonResponse({'error': 'Both name and department_id are required'}, status=400)

    department = get_object_or_404(Department, id=department_id)

    exists = Module.objects.filter(name__iexact=name, department=department).first()
    if exists:
        return JsonResponse({
            'error': 'Module already exists',
            'existing_module': {
                'id': exists.id,
                'name': exists.name,
                'department': exists.department.name,
            }
        }, status=409)

    module = Module.objects.create(name=name, department=department)
    return JsonResponse({'id': module.id, 'name': module.name, 'department': module.department.name})


@csrf_exempt
@require_http_methods(["POST"])
def add_lecturer_api(request):
    """Add a new lecturer under a given department."""
    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    name = data.get('name', '').strip()
    department_id = data.get('department_id')

    if not name or not department_id:
        return JsonResponse({'error': 'Both name and department_id are required'}, status=400)

    department = get_object_or_404(Department, id=department_id)

    exists = Lecturer.objects.filter(name__iexact=name, department=department).first()
    if exists:
        return JsonResponse({
            'error': 'Lecturer already exists',
            'existing_lecturer': {
                'id': exists.id,
                'name': exists.name,
                'department': exists.department.name,
            }
        }, status=409)

    lecturer = Lecturer.objects.create(name=name, department=department)
    return JsonResponse({'id': lecturer.id, 'name': lecturer.name, 'department': lecturer.department.name})
