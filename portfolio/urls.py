from django.contrib.auth import views as auth_views
from django.urls import path

from . import views

app_name = "portfolio"

urlpatterns = [
    path("", views.home, name="home"),
    path("portfolio/", views.portfolio_list, name="portfolio_list"),
    path("portfolio/<slug:slug>/", views.project_detail, name="project_detail"),
    path("services/", views.services, name="services"),
    path("about/", views.about, name="about"),
    path("contact/", views.contact, name="contact"),
    path("track-visit/", views.track_visit, name="track_visit"),
    path("dashboard/", views.dashboard, name="dashboard"),
    path("dashboard/inquiries/<int:inquiry_id>/", views.dashboard_inquiry_detail, name="dashboard_inquiry_detail"),
    path("dashboard/login/", views.dashboard_login, name="dashboard_login"),
    path("dashboard/logout/", auth_views.LogoutView.as_view(next_page="portfolio:dashboard_login"), name="dashboard_logout"),
    path("privacy/", views.privacy, name="privacy"),
]
