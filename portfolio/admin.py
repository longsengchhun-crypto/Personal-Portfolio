from django.contrib import admin

from .models import Category, Project, ProjectGalleryItem, ProjectInquiry, SiteSetting, SocialLink, VisitorEvent


@admin.register(SiteSetting)
class SiteSettingAdmin(admin.ModelAdmin):
    fieldsets = (
        ("Identity", {"fields": ("site_name", "professional_title", "portrait")}),
        ("Copy", {"fields": ("hero_intro", "khmer_intro", "professional_intro")}),
        ("Showreel", {"fields": ("showreel_title", "showreel_thumbnail", "youtube_url", "vimeo_url", "local_video_url")}),
        ("Contact", {"fields": ("email", "phone", "location")}),
    )

    def has_add_permission(self, request):
        return not SiteSetting.objects.exists()


@admin.register(SocialLink)
class SocialLinkAdmin(admin.ModelAdmin):
    list_display = ("label", "url", "icon_name", "order", "is_active")
    list_editable = ("order", "is_active")
    search_fields = ("label", "url")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "order")
    list_editable = ("order",)
    prepopulated_fields = {"slug": ("name",)}


class ProjectGalleryInline(admin.TabularInline):
    model = ProjectGalleryItem
    extra = 1
    fields = ("order", "item_type", "image", "video_file", "video_url", "layout", "caption", "alt_text")


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    inlines = [ProjectGalleryInline]
    list_display = ("title", "category", "year", "status", "is_featured", "order")
    list_filter = ("status", "is_featured", "category", "year")
    list_editable = ("status", "is_featured", "order")
    search_fields = ("title", "short_description", "client", "role", "software_used")
    prepopulated_fields = {"slug": ("title",)}
    fieldsets = (
        ("Publishing", {"fields": ("title", "slug", "category", "status", "is_featured", "order")}),
        ("Summary", {"fields": ("year", "short_description", "project_type", "cover_image", "cover_video_url", "video_file")}),
        ("Project details", {"fields": ("client", "role", "project_duration", "software_used")}),
        ("Case study", {"fields": ("introduction", "objective", "creative_approach", "process", "final_result")}),
        ("Media", {"fields": ("embedded_video_url", "before_image", "after_image")}),
        ("Credits", {"fields": ("credits",)}),
    )


@admin.register(ProjectInquiry)
class ProjectInquiryAdmin(admin.ModelAdmin):
    list_display = ("full_name", "service_needed", "email", "status", "created_at", "is_reviewed")
    list_filter = ("service_needed", "status", "is_reviewed", "created_at")
    search_fields = ("full_name", "email", "company", "project_description")
    readonly_fields = ("created_at", "updated_at", "ip_address")
    list_editable = ("status", "is_reviewed")
    fieldsets = (
        ("Inquiry", {"fields": ("full_name", "email", "phone_or_telegram", "company", "service_needed", "estimated_budget", "preferred_timeline", "project_description", "attachment")}),
        ("Workflow", {"fields": ("status", "is_reviewed", "admin_notes")}),
        ("Meta", {"fields": ("created_at", "updated_at", "ip_address")}),
    )


@admin.register(VisitorEvent)
class VisitorEventAdmin(admin.ModelAdmin):
    list_display = ("path", "device_type", "device_model", "browser", "os", "created_at")
    list_filter = ("device_type", "browser", "os", "created_at")
    search_fields = ("path", "device_model", "browser", "os", "user_agent", "ip_address")
    readonly_fields = (
        "created_at",
        "updated_at",
        "session_key",
        "path",
        "referrer",
        "ip_address",
        "user_agent",
        "device_type",
        "device_model",
        "browser",
        "os",
        "platform",
        "language",
        "timezone",
        "screen_width",
        "screen_height",
        "viewport_width",
        "viewport_height",
    )

    def has_add_permission(self, request):
        return False
