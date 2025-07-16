"""
URL configuration for EduFeedbackHub project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
# from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('', views.root_redirect, name='root_api'),  # Redirect root path to home API
    path('api/home/', views.home_api, name='home_api'),  # API home welcome message

    ## Year Rankings
    path('api/years/', views.qs_year_list_api, name='qs_year_list_api'),  # List all ranking years
    path('api/rankings/<int:year>/', views.qs_year_detail_api, name='qs_year_detail_api'),
    # Rankings detail for a specific year

    ## Institute detail & comments add or delete
    path('api/university/<int:university_id>/', views.university_detail_api, name='university_detail_api'),
    # University details and comments
    path('api/college/<int:college_id>/', views.college_detail_api, name='college_detail_api'),
    # College details and comments
    path('api/school/<int:school_id>/', views.school_detail_api, name='school_detail_api'),
    # School details and comments
    path('api/module/<int:module_id>/', views.module_detail_api, name='module_detail_api'),
    # Module details and comments
    path('api/teaching/<int:teaching_id>/', views.teaching_detail_api, name='teaching_detail_api'),
    # Teaching record details and comments
    path('api/comment/add/', views.add_comment_api, name='add_comment_api'),  # Add a new comment
    path('api/comment/<int:comment_id>/delete/', views.delete_comment_api, name='delete_comment_api'),
    # Delete a comment by ID

    ## Search APIs
    path('api/university/search/', views.search_university_api, name='search_university_api'),
    # Search universities by name
    path('api/region/search/', views.search_region_api, name='search_region_api'),  # Search regions by name
    path('api/college/search/', views.search_college_api, name='search_college_api'),  # Search colleges by name
    path('api/school/search/', views.search_school_api, name='search_school_api'),  # Search schools by name
    path('api/module/search/', views.search_module_api, name='search_module_api'),  # Search modules by name
    path('api/lecturer/search/', views.search_lecturer_api, name='search_lecturer_api'),  # Search lecturers by name
    path('api/lecturer/<int:lecturer_id>/details/', views.lecturer_details_api, name='lecturer_details_api'),
    # Get lecturer details with teaching records
    path('api/lecturer/<int:lecturer_id>/rating_trend/', views.lecturer_rating_trend_api,
         name='lecturer_rating_trend_api'),

    ## Add APIs for entities
    path('api/university/add/', views.add_university_api, name='add_university_api'),  # Add a new university
    path('api/college/add/', views.add_college_api, name='add_college_api'),  # Add a new college
    path('api/school/add/', views.add_school_api, name='add_school_api'),  # Add a new school
    path('api/module/add/', views.add_module_api, name='add_module_api'),  # Add a new module
    path('api/lecturer/add/', views.add_lecturer_api, name='add_lecturer_api'),  # Add a new lecturer

    ## Teaching records
    path('api/teaching/add/', views.add_teaching_api, name='add_teaching_api'),  # Add a new teaching record
    path('api/rate/', views.rate_api, name='rate_api'),  # Generic rating API
    path('api/rate/user-rating/', views.get_user_rating_api, name='get_user_rating_api'),
    # Get current user's rating for an entity

    ## User Authentication
    path('api/register/', views.register_api, name='register_api'),  # Register a new user account
    path('api/login/', views.login_api, name='login_api'),  # User login and token retrieval
]
