"""
This file contains basic API view functions for the EduFeedbackHub application.
It includes root redirect and home API endpoints.
"""

from django.shortcuts import redirect
from django.http import JsonResponse


def root_redirect(request):
    """Redirects the root URL to the home API endpoint."""
    return redirect('home_api')


def home_api(request):
    """Returns a simple welcome message."""
    return JsonResponse({"message": "Welcome to EduFeedbackHub API"}) 