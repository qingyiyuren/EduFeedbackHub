"""
This file contains API view functions for entity detail pages.
It includes endpoints for retrieving university and college details with their comments.
"""

from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from ..models import University, College


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