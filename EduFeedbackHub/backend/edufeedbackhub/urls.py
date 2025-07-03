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

# urlpatterns = [
#     #    path('admin/', admin.site.urls),
# ]
# The above is the default section

from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('qs/', views.qs_year_list, name='qs_year_list'),
    path('qs/<str:year>/', views.qs_year_detail, name='qs_year_detail'),
    path('university/<int:university_id>/', views.university_detail, name='university_detail'),
    path('comment/delete/<int:comment_id>/', views.delete_comment, name='delete_comment'),
]
