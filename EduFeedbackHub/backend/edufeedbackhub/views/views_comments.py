"""
This file contains API view functions for comment management.
It includes endpoints for adding and deleting comments on various entities.
"""

from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from ..models import Comment
from django.apps import apps
import json


@csrf_exempt
@require_POST
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

    if not target_obj:
        # Return 400 error if no valid target object is specified
        return JsonResponse({'error': 'No valid target object specified'}, status=400)

    # Create the comment with the target object and optional parent
    comment = Comment.objects.create(
        content=content,
        parent=parent,
        **{target_field: target_obj}
    )

    # Return the created comment data
    return JsonResponse({
        'id': comment.id,
        'content': comment.content,
        'created_at': comment.created_at.isoformat(),
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