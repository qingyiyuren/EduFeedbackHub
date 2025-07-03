from django.shortcuts import render, get_object_or_404, redirect
from django.urls import reverse
from .models import YearRanking, UniversityRanking, University, Comment
from .forms import CommentForm
from django.views.decorators.http import require_POST


def home(request):
    # Render the homepage template
    return render(request, 'home.html')


def qs_year_list(request):
    # Get all ranking years, ordered descending, return only the year field
    years = YearRanking.objects.order_by('-year').values_list('year', flat=True)
    # Render the year list template with the years data
    return render(request, 'qs_year_list.html', {'years': years})


def qs_year_detail(request, year):
    # Retrieve the YearRanking object for the given year or return 404 if not found
    year_obj = get_object_or_404(YearRanking, year=year)
    # Get all UniversityRanking for this year, ordered by rank ascending
    rankings = UniversityRanking.objects.filter(year=year_obj).order_by('rank')
    # Render the ranking detail template with year and rankings data
    return render(request, 'qs_year_detail.html', {'year': year, 'rankings': rankings})


def university_detail(request, university_id):
    # Retrieve the University object by ID or return 404
    university = get_object_or_404(University, id=university_id)
    # Get all top-level comments (not replies) for this university, newest first
    comments = university.comments.filter(parent=None).order_by('-created_at')
    form = CommentForm()

    # Get the 'year' parameter from URL query string to maintain context
    current_year = request.GET.get('year')

    if request.method == 'POST':
        # Handle comment form submission
        form = CommentForm(request.POST)
        if form.is_valid():
            comment = form.save(commit=False)
            comment.university = university  # Link comment to this university
            parent_id = request.POST.get('parent_id')
            if parent_id:
                # If replying to another comment, set the parent comment
                comment.parent = Comment.objects.get(id=parent_id)
            comment.save()

            # After saving, redirect back to university detail page, preserving 'year' param if present
            redirect_url = reverse('university_detail', args=[university.id])
            # Use Django's reverse function to generate the URL for the university_detail view,
            # inserting the university's ID as a positional argument (e.g., /university/3/).
            if current_year:
                # Check if the current_year variable exists (meaning the year was passed in the request)
                redirect_url += f'?year={current_year}'
                # Append the year as a query parameter to the URL (e.g., /university/3/?year=2025)
            return redirect(redirect_url)
            # Redirect the user to the constructed URL, preserving the year parameter if it was present.

    # Render university detail page with comments, form, and current year
    return render(request, 'university_detail.html', {
        'university': university,
        'comments': comments,
        'form': form,
        'current_year': current_year,
    })


@require_POST
def delete_comment(request, comment_id):
    # Retrieve comment by ID or 404
    comment = get_object_or_404(Comment, id=comment_id)
    university_id = comment.university.id
    # Get 'year' parameter from URL to preserve after deletion
    year = request.GET.get('year')
    # Delete the comment
    comment.delete()

    # Redirect back to university detail page, preserving 'year' param if exists
    redirect_url = reverse('university_detail', args=[university_id])
    if year:
        redirect_url += f'?year={year}'
    return redirect(redirect_url)

