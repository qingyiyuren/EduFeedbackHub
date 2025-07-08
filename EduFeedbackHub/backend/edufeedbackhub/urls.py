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
    path('', views.root_redirect, name='root_api'),  # Redirect root URL to the home API endpoint
    path('api/home/', views.home_api, name='home_api'),
    path('api/years/', views.qs_year_list_api, name='qs_year_list_api'),
    path('api/rankings/<int:year>/', views.qs_year_detail_api, name='qs_year_detail_api'),
    path('api/university/<int:university_id>/', views.university_detail_api, name='university_detail_api'),
    path('api/university/<int:university_id>/comment/', views.add_comment_api, name='add_comment_api'),
    path('api/comment/<int:comment_id>/delete/', views.delete_comment_api, name='delete_comment_api'),
]
