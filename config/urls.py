from django.conf import settings
from django.contrib import admin
from django.contrib.staticfiles.views import serve as serve_static
from django.urls import include, path, re_path
from django.views.static import serve

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("portfolio.urls")),
]

handler404 = "portfolio.views.error_404"
handler500 = "portfolio.views.error_500"

if settings.DEBUG or settings.SERVE_MEDIA:
    urlpatterns += [
        re_path(r"^static/(?P<path>.*)$", serve_static, {"insecure": True}),
    ]
    urlpatterns += [
        re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
    ]
