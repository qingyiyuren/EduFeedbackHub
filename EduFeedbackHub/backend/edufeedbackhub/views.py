# Views for EduFeedbackHub API handling university rankings, comments, and related actions.

from django.shortcuts import get_object_or_404, redirect
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from .models import YearRanking, UniversityRanking, University, Comment


# Redirects root URL (e.g., "/") to the home API endpoint (e.g., "/api/home/")
def root_redirect(request):
    return redirect('home_api')


# Simple API endpoint to verify that the backend is working
def home_api(request):
    return JsonResponse({"message": "Welcome to EduFeedbackHub API"})


# Returns a list of available ranking years in descending order
def qs_year_list_api(request):
    years = list(YearRanking.objects.order_by('-year').values_list('year', flat=True))
    return JsonResponse({'years': years})


# Returns all university rankings for a specific year
def qs_year_detail_api(request, year):
    # Get the YearRanking instance for the given year
    year_obj = get_object_or_404(YearRanking, year=year)

    # Get university rankings for that year, sorted by rank
    rankings = UniversityRanking.objects.filter(year=year_obj).order_by('rank')

    # Serialize ranking data
    data = [
        {
            'id': ranking.id,
            'rank': ranking.rank,
            'university': {
                'id': ranking.university.id,
                'name': ranking.university.name,
                'region': ranking.university.region,
            }
        }
        for ranking in rankings
    ]
    return JsonResponse({'year': year, 'rankings': data})


# API to get details of a university including its comments and replies
def university_detail_api(request, university_id):
    # Retrieve the university by its ID or return 404 if not found
    university = get_object_or_404(University, id=university_id)

    # Fetch all top-level comments for the university (those without a parent),
    # ordered by creation time descending (newest first)
    comments_qs = university.comments.filter(parent=None).order_by('-created_at')

    # Helper function to convert a comment and its replies into a serializable dict
    def serialize_comment(comment):
        return {
            'id': comment.id,
            'content': comment.content,
            'created_at': comment.created_at.isoformat(),
            # Recursively serialize replies to support nested replies
            'replies': [serialize_comment(reply) for reply in comment.replies.all().order_by('created_at')]
        }

    # Serialize all top-level comments with their replies
    comments = [serialize_comment(c) for c in comments_qs]

    # Prepare basic university information
    university_data = {
        'id': university.id,
        'name': university.name,
        'region': university.region,
    }

    # Return a JSON response containing university info and nested comments with replies
    return JsonResponse({
        'university': university_data,
        'comments': comments,
    })


@csrf_exempt  # Disable CSRF protection to allow POST requests from frontend (use with caution in production)
@require_POST  # Only allow POST requests to access this view
def add_comment_api(request, university_id):
    """
    API endpoint to add a new comment or reply:
    - Reads JSON data from request body
    - Retrieves comment content and optional parent comment ID
    - Validates that content is not empty
    - Creates and saves the comment object
    - Returns a JSON response with the result
    """

    import json

    # Get the university instance by ID, return 404 if not found
    university = get_object_or_404(University, id=university_id)

    # request.body contains the raw request payload in bytes
    # Django does not parse JSON automatically, so parse it manually
    try:
        data = json.loads(request.body)
    except Exception:
        # Return 400 error if JSON is invalid
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    # Extract and trim the comment content
    content = data.get('content', '').strip()
    # Optional parent comment ID for replies
    parent_id = data.get('parent_id')

    # Return error if content is empty
    if not content:
        return JsonResponse({'error': 'Content is required'}, status=400)

    # Create a new Comment object linked to the university
    comment = Comment(university=university, content=content)

    # If this is a reply, fetch the parent comment and set the relationship
    if parent_id:
        parent_comment = get_object_or_404(Comment, id=parent_id)
        comment.parent = parent_comment

    # Save the comment to the database
    comment.save()

    # Return success message with new comment ID
    return JsonResponse({'message': 'Comment added', 'comment_id': comment.id})


# Deletes a comment by ID (including top-level or replies)
@csrf_exempt
@require_POST
def delete_comment_api(request, comment_id):
    # Find and delete the comment
    comment = get_object_or_404(Comment, id=comment_id)
    comment.delete()
    return JsonResponse({'message': 'Comment deleted'})
