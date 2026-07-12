import json
import re

from django.conf import settings
from django.contrib import messages
from django.contrib.auth import get_user_model, login
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.forms import AuthenticationForm
from django.core.cache import cache
from django.core.mail import send_mail
from django.core.paginator import Paginator
from django.db.models import Count
from django.http import JsonResponse
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .content import DISCIPLINES, EDITING_TOOLS, KHMER, SERVICES, SKILLS, SOFTWARE
from .forms import ProjectInquiryForm
from .models import Category, Project, ProjectInquiry, VisitorEvent


def client_ip(request):
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "")


def published_projects():
    return Project.objects.select_related("category").filter(status=Project.PUBLISHED)


def safe_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def parse_user_agent(user_agent):
    user_agent = user_agent or ""
    lower_agent = user_agent.lower()

    if "ipad" in lower_agent or "tablet" in lower_agent:
        device_type = "Tablet"
    elif "mobile" in lower_agent or "android" in lower_agent or "iphone" in lower_agent:
        device_type = "Phone"
    else:
        device_type = "Desktop"

    device_model = "Unknown"
    android_model = re.search(r";\s*([^;()]+?)\s+Build/", user_agent)
    if "iphone" in lower_agent:
        device_model = "iPhone"
    elif "ipad" in lower_agent:
        device_model = "iPad"
    elif android_model:
        device_model = android_model.group(1).strip()
    elif "macintosh" in lower_agent:
        device_model = "Mac"
    elif "windows" in lower_agent:
        device_model = "Windows PC"

    browser = "Unknown"
    if "edg/" in lower_agent:
        browser = "Microsoft Edge"
    elif "chrome/" in lower_agent and "chromium" not in lower_agent:
        browser = "Chrome"
    elif "safari/" in lower_agent and "chrome/" not in lower_agent:
        browser = "Safari"
    elif "firefox/" in lower_agent:
        browser = "Firefox"

    os_name = "Unknown"
    if "android" in lower_agent:
        os_name = "Android"
    elif "iphone" in lower_agent or "ipad" in lower_agent:
        os_name = "iOS"
    elif "windows" in lower_agent:
        os_name = "Windows"
    elif "mac os" in lower_agent or "macintosh" in lower_agent:
        os_name = "macOS"
    elif "linux" in lower_agent:
        os_name = "Linux"

    return device_type, device_model, browser, os_name


def admin_only(user):
    return user.is_active and user.is_staff


def ensure_dashboard_admin(username=None, password=None):
    configured_username = settings.DASHBOARD_ADMIN_USERNAME
    configured_password = settings.DASHBOARD_ADMIN_PASSWORD
    if not configured_username or not configured_password:
        return None
    if username is not None and username != configured_username:
        return None
    if password is not None and password != configured_password:
        return None

    User = get_user_model()
    user, _created = User.objects.get_or_create(
        username=configured_username,
        defaults={"is_staff": True, "is_superuser": True, "is_active": True},
    )
    changed_fields = []
    for field, value in {"is_staff": True, "is_superuser": True, "is_active": True}.items():
        if getattr(user, field) != value:
            setattr(user, field, value)
            changed_fields.append(field)
    if not user.check_password(configured_password):
        user.set_password(configured_password)
        changed_fields.append("password")
    if changed_fields:
        user.save(update_fields=changed_fields)
    return user


def dashboard_login(request):
    if request.user.is_authenticated and admin_only(request.user):
        return redirect("portfolio:dashboard")

    form = AuthenticationForm(request, data=request.POST or None)
    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        password = request.POST.get("password", "")
        ensure_dashboard_admin(username=username, password=password)
        form = AuthenticationForm(request, data={"username": username, "password": password})
        if form.is_valid():
            user = form.get_user()
            if admin_only(user):
                login(request, user)
                redirect_to = request.POST.get("next") or request.GET.get("next") or reverse("portfolio:dashboard")
                if not url_has_allowed_host_and_scheme(redirect_to, allowed_hosts={request.get_host()}):
                    redirect_to = reverse("portfolio:dashboard")
                return redirect(redirect_to)
            form.add_error(None, "This account does not have dashboard access.")

    return render(
        request,
        "portfolio/dashboard_login.html",
        {
            "form": form,
            "next": request.GET.get("next", ""),
            "page_name": "dashboard",
        },
    )


def notify_inquiry_client(inquiry, status_label):
    if not inquiry.email:
        return False, "No client email was provided. Use the phone or Telegram contact link instead."

    subject = "We received your project inquiry"
    message = (
        f"Hello {inquiry.full_name},\n\n"
        "សូមអរគុណ។ សំណើរបស់លោកអ្នកត្រូវបានទទួលដោយជោគជ័យ។\n\n"
        f"We received your project inquiry for {inquiry.service_needed}. "
        "We will contact you back as soon as possible.\n\n"
        f"Request status: {status_label}\n\n"
        "LONG SENGCHHUN"
    )
    try:
        sent_count = send_mail(subject, message, None, [inquiry.email], fail_silently=False)
    except Exception as error:
        return False, f"Client email could not be sent: {error}"
    return sent_count > 0, "Client notification email was sent."


def home(request):
    featured_video_project = (
        published_projects()
        .filter(category__slug="video-and-3d-modeling", video_file__gt="")
        .first()
    )
    return render(
        request,
        "portfolio/home.html",
        {
            "featured_projects": published_projects().filter(is_featured=True)[:8],
            "featured_video_project": featured_video_project,
            "disciplines": DISCIPLINES,
            "services": SERVICES[:6],
            "software": SOFTWARE,
            "editing_tools": EDITING_TOOLS,
            "page_name": "home",
        },
    )


def portfolio_list(request):
    projects = published_projects()
    selected_category = request.GET.get("category", "")
    selected_year = request.GET.get("year", "")
    search = request.GET.get("search", "").strip()

    if selected_category:
        projects = projects.filter(category__slug=selected_category)
    if selected_year.isdigit():
        projects = projects.filter(year=int(selected_year))
    if search:
        projects = projects.filter(
            Q(title__icontains=search)
            | Q(short_description__icontains=search)
            | Q(project_type__icontains=search)
        )

    years = (
        Project.objects.filter(status=Project.PUBLISHED)
        .order_by("-year")
        .values_list("year", flat=True)
        .distinct()
    )
    page_obj = Paginator(projects, 9).get_page(request.GET.get("page"))

    return render(
        request,
        "portfolio/portfolio_list.html",
        {
            "page_obj": page_obj,
            "categories": Category.objects.all(),
            "years": years,
            "selected_category": selected_category,
            "selected_year": selected_year,
            "search": search,
            "page_name": "work",
        },
    )


def project_detail(request, slug):
    project = get_object_or_404(
        Project.objects.select_related("category").prefetch_related("gallery_items"),
        slug=slug,
        status=Project.PUBLISHED,
    )
    related_projects = published_projects().filter(category=project.category).exclude(id=project.id)[:3]
    previous_project = published_projects().filter(order__lt=project.order).order_by("-order").first()
    next_project = published_projects().filter(order__gt=project.order).order_by("order").first()
    return render(
        request,
        "portfolio/project_detail.html",
        {
            "project": project,
            "related_projects": related_projects,
            "previous_project": previous_project,
            "next_project": next_project,
            "page_name": "work",
        },
    )


def services(request):
    return render(request, "portfolio/services.html", {"services": SERVICES, "khmer_cta": KHMER["project_cta"], "page_name": "services"})


def about(request):
    return render(request, "portfolio/about.html", {"skills": SKILLS, "software": SOFTWARE, "page_name": "about"})


def contact(request):
    ip = client_ip(request)
    rate_key = f"inquiry:{ip}"
    if request.method == "POST":
        if cache.get(rate_key):
            messages.error(request, "Please wait a few minutes before sending another inquiry.")
            return redirect(reverse("portfolio:contact"))
        form = ProjectInquiryForm(request.POST, request.FILES)
        if form.is_valid():
            inquiry = form.save(commit=False)
            inquiry.ip_address = ip or None
            inquiry.save()
            cache.set(rate_key, True, 300)
            messages.success(request, "Thank you. Your project inquiry has been received.")
            return redirect(f"{reverse('portfolio:contact')}?sent=1")
    else:
        form = ProjectInquiryForm()

    return render(
        request,
        "portfolio/contact.html",
        {
            "form": form,
            "budget_note": "Budget ranges are only a starting point for discussion, not fixed prices.",
            "success_submitted": request.GET.get("sent") == "1",
            "page_name": "contact",
        },
    )


@csrf_exempt
@require_POST
def track_visit(request):
    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        payload = {}

    if not request.session.session_key:
        request.session.save()

    path = str(payload.get("path") or request.META.get("HTTP_REFERER") or "/")[:255]
    session_key = request.session.session_key or ""
    cache_key = f"visitor-event:{session_key}:{path}"
    if cache.get(cache_key):
        return JsonResponse({"ok": True, "tracked": False})

    user_agent = request.META.get("HTTP_USER_AGENT", "")
    device_type, device_model, browser, os_name = parse_user_agent(user_agent)

    VisitorEvent.objects.create(
        session_key=session_key,
        path=path,
        referrer=str(payload.get("referrer") or "")[:1000],
        ip_address=client_ip(request) or None,
        user_agent=user_agent,
        device_type=device_type,
        device_model=device_model,
        browser=browser,
        os=os_name,
        platform=str(payload.get("platform") or "")[:120],
        language=str(payload.get("language") or "")[:40],
        timezone=str(payload.get("timezone") or "")[:80],
        screen_width=safe_int(payload.get("screenWidth")),
        screen_height=safe_int(payload.get("screenHeight")),
        viewport_width=safe_int(payload.get("viewportWidth")),
        viewport_height=safe_int(payload.get("viewportHeight")),
    )
    cache.set(cache_key, True, 60 * 30)
    return JsonResponse({"ok": True, "tracked": True})


@login_required(login_url="portfolio:dashboard_login")
@user_passes_test(admin_only, login_url="portfolio:dashboard_login")
def dashboard(request):
    today = timezone.localdate()
    visits = VisitorEvent.objects.all()
    inquiries = ProjectInquiry.objects.all()

    return render(
        request,
        "portfolio/dashboard.html",
        {
            "page_name": "dashboard",
            "total_visits": visits.count(),
            "today_visits": visits.filter(created_at__date=today).count(),
            "unique_visitors": visits.values("session_key").distinct().count(),
            "new_inquiries": inquiries.filter(status="new").count(),
            "accepted_projects": inquiries.filter(status="accepted").count(),
            "latest_visits": visits[:40],
            "latest_inquiries": inquiries[:20],
            "device_breakdown": visits.values("device_type").annotate(total=Count("id")).order_by("-total"),
            "top_pages": visits.values("path").annotate(total=Count("id")).order_by("-total")[:8],
        },
    )


@login_required(login_url="portfolio:dashboard_login")
@user_passes_test(admin_only, login_url="portfolio:dashboard_login")
def dashboard_inquiry_detail(request, inquiry_id):
    inquiry = get_object_or_404(ProjectInquiry, id=inquiry_id)
    if request.method == "POST":
        action = request.POST.get("action", "save")
        if action == "accept":
            next_status = "accepted"
        elif action == "reject":
            next_status = "declined"
        else:
            next_status = request.POST.get("status", inquiry.status)

        allowed_statuses = {value for value, _label in ProjectInquiry.STATUS_CHOICES}
        if next_status in allowed_statuses:
            inquiry.status = next_status
        update_fields = ["status", "is_reviewed", "updated_at"]
        if "admin_notes" in request.POST:
            inquiry.admin_notes = request.POST.get("admin_notes", "").strip()
            update_fields.append("admin_notes")
        inquiry.is_reviewed = request.POST.get("is_reviewed") == "on" or next_status != "new"
        inquiry.save(update_fields=update_fields)
        if action in {"accept", "reject"}:
            status_label = dict(ProjectInquiry.STATUS_CHOICES).get(inquiry.status, inquiry.status)
            sent, notice = notify_inquiry_client(inquiry, status_label)
            if sent:
                messages.success(request, f"Inquiry {status_label.lower()} and client notified.")
            else:
                messages.warning(request, f"Inquiry {status_label.lower()}. {notice}")
        else:
            messages.success(request, "Inquiry updated.")
        if request.POST.get("next") == "dashboard":
            return redirect("portfolio:dashboard")
        return redirect("portfolio:dashboard_inquiry_detail", inquiry_id=inquiry.id)

    return render(
        request,
        "portfolio/dashboard_inquiry_detail.html",
        {
            "inquiry": inquiry,
            "status_choices": ProjectInquiry.STATUS_CHOICES,
            "page_name": "dashboard",
        },
    )


def privacy(request):
    return render(request, "portfolio/privacy.html", {"page_name": "privacy"})


def error_404(request, exception):
    return render(request, "404.html", status=404)


def error_500(request):
    return render(request, "500.html", status=500)
