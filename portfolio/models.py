from io import BytesIO

from django.core.files.base import ContentFile
from django.db import models
from django.urls import reverse
from django.utils.text import slugify
from PIL import Image


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


def optimize_image_field(instance, field_name, max_width=1800, quality=84):
    image_field = getattr(instance, field_name)
    if not image_field:
        return
    original_name = image_field.name
    try:
        image = Image.open(image_field)
    except Exception:
        return

    image_format = image.format or "JPEG"
    if image.mode in {"RGBA", "P"} and image_format.upper() == "JPEG":
        image = image.convert("RGB")
    if image.width > max_width:
        ratio = max_width / float(image.width)
        image = image.resize((max_width, int(image.height * ratio)), Image.LANCZOS)

    buffer = BytesIO()
    save_kwargs = {"quality": quality, "optimize": True}
    if image_format.upper() == "PNG":
        save_kwargs = {"optimize": True}
    image.save(buffer, format=image_format, **save_kwargs)
    image.close()
    image_field.close()
    with image_field.storage.open(original_name, "wb") as destination:
        destination.write(buffer.getvalue())
    image_field.name = original_name


class SiteSetting(TimeStampedModel):
    site_name = models.CharField(max_length=120, default="LONG SENGCHHUN")
    professional_title = models.CharField(max_length=160, default="Multidisciplinary Creative Designer")
    hero_intro = models.TextField(default="Creating cinematic visuals, thoughtful designs, and digital experiences that bring ideas to life.")
    khmer_intro = models.CharField(
        max_length=255,
        blank=True,
        default="បង្កើតស្នាដៃដែលភ្ជាប់ជាមួយគំនិត​និង ការរចនា របស់លោកអ្នកជាមួយយើងឥឡូវនេះ",
    )
    professional_intro = models.TextField(
        default=(
            "I am a multidisciplinary creative based in Cambodia, working across graphic design, "
            "photography, filmmaking, video editing, and 3D visualization. I create visual content "
            "that helps brands, businesses, and organizations communicate ideas clearly and memorably.\n\n"
            "My work includes brand visuals, promotional content, social media design, video production, "
            "3D modeling, animation, product visualization, environment design, and cinematic storytelling. "
            "I combine creative direction with practical production skills to develop visuals that are both "
            "purposeful and engaging."
        )
    )
    portrait = models.ImageField(upload_to="site/", blank=True)
    showreel_title = models.CharField(max_length=160, blank=True)
    showreel_thumbnail = models.ImageField(upload_to="site/", blank=True)
    youtube_url = models.URLField(blank=True)
    vimeo_url = models.URLField(blank=True)
    local_video_url = models.URLField(blank=True)
    email = models.EmailField(default="longsengchhun@gmail.com")
    phone = models.CharField(max_length=40, default="016 590 899")
    location = models.CharField(max_length=120, default="Phnom Penh, Cambodia")

    class Meta:
        verbose_name = "Site setting"
        verbose_name_plural = "Site settings"

    def __str__(self):
        return self.site_name

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        changed = False
        for field in ("portrait", "showreel_thumbnail"):
            if getattr(self, field):
                optimize_image_field(self, field, max_width=1600)
                changed = True
        if changed:
            super().save(update_fields=["portrait", "showreel_thumbnail"])


class SocialLink(models.Model):
    label = models.CharField(max_length=60)
    url = models.URLField()
    icon_name = models.CharField(max_length=60, blank=True, help_text="Optional Bootstrap Icons name, for example instagram or behance.")
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["order", "label"]

    def __str__(self):
        return self.label


class Category(models.Model):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=90, unique=True, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "name"]
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Project(TimeStampedModel):
    DRAFT = "draft"
    PUBLISHED = "published"
    STATUS_CHOICES = [(DRAFT, "Draft"), (PUBLISHED, "Published")]

    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="projects")
    title = models.CharField(max_length=180)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    year = models.PositiveIntegerField()
    short_description = models.TextField(max_length=420)
    project_type = models.CharField(max_length=120, blank=True)
    cover_image = models.ImageField(upload_to="projects/covers/", blank=True)
    cover_video_url = models.URLField(blank=True)
    video_file = models.FileField(upload_to="projects/videos/", blank=True)
    client = models.CharField(max_length=160, blank=True)
    role = models.CharField(max_length=180, blank=True)
    project_duration = models.CharField(max_length=80, blank=True)
    software_used = models.CharField(max_length=255, blank=True, help_text="Comma-separated list.")
    introduction = models.TextField(blank=True)
    objective = models.TextField(blank=True)
    creative_approach = models.TextField(blank=True)
    process = models.TextField(blank=True)
    final_result = models.TextField(blank=True)
    embedded_video_url = models.URLField(blank=True)
    before_image = models.ImageField(upload_to="projects/before-after/", blank=True)
    after_image = models.ImageField(upload_to="projects/before-after/", blank=True)
    credits = models.TextField(blank=True)
    is_featured = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=DRAFT)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "-year", "-created_at"]

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return reverse("portfolio:project_detail", kwargs={"slug": self.slug})

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)
        changed = False
        for field in ("cover_image", "before_image", "after_image"):
            if getattr(self, field):
                optimize_image_field(self, field)
                changed = True
        if changed:
            super().save(update_fields=["cover_image", "before_image", "after_image"])


class ProjectGalleryItem(models.Model):
    IMAGE = "image"
    VIDEO = "video"
    ITEM_TYPE_CHOICES = [(IMAGE, "Image"), (VIDEO, "Video")]
    LAYOUT_CHOICES = [("landscape", "Landscape"), ("portrait", "Portrait"), ("full", "Full width")]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="gallery_items")
    item_type = models.CharField(max_length=20, choices=ITEM_TYPE_CHOICES, default=IMAGE)
    image = models.ImageField(upload_to="projects/gallery/", blank=True)
    video_url = models.URLField(blank=True)
    video_file = models.FileField(upload_to="projects/gallery/videos/", blank=True)
    caption = models.CharField(max_length=220, blank=True)
    alt_text = models.CharField(max_length=180, blank=True)
    layout = models.CharField(max_length=20, choices=LAYOUT_CHOICES, default="landscape")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"{self.project.title} gallery item"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.image:
            optimize_image_field(self, "image")
            super().save(update_fields=["image"])


class ProjectInquiry(TimeStampedModel):
    STATUS_CHOICES = [
        ("new", "New"),
        ("reviewing", "Reviewing"),
        ("replied", "Replied"),
        ("accepted", "Accepted"),
        ("declined", "Declined"),
        ("archived", "Archived"),
    ]

    SERVICE_CHOICES = [
        ("Graphic Design", "Graphic Design"),
        ("Poster Design", "Poster Design"),
        ("Video Editing", "Video Editing"),
        ("Photo / Video Production", "Photo / Video Production"),
        ("Photography", "Photography"),
        ("Videography", "Videography"),
        ("Filmmaking", "Filmmaking"),
        ("3D Design and Modeling", "3D Design and Modeling"),
        ("3D Modeling", "3D Modeling"),
        ("3D Animation", "3D Animation"),
        ("Product Visualization", "Product Visualization"),
        ("Motion Graphics", "Motion Graphics"),
        ("Social Media Content", "Social Media Content"),
        ("Other", "Other"),
    ]
    BUDGET_CHOICES = [
        ("Not decided yet", "Not decided yet"),
        ("Under $100", "Under $100"),
        ("$100-$300", "$100-$300"),
        ("$300-$700", "$300-$700"),
        ("$700-$1,500", "$700-$1,500"),
        ("Above $1,500", "Above $1,500"),
        ("Prefer to discuss privately", "Prefer to discuss privately"),
    ]

    full_name = models.CharField(max_length=120)
    email = models.EmailField()
    phone_or_telegram = models.CharField(max_length=80, blank=True)
    company = models.CharField(max_length=140, blank=True)
    service_needed = models.CharField(max_length=80, choices=SERVICE_CHOICES)
    estimated_budget = models.CharField(max_length=80, choices=BUDGET_CHOICES, blank=True)
    preferred_timeline = models.CharField(max_length=120, blank=True)
    project_description = models.TextField()
    attachment = models.FileField(upload_to="inquiries/", blank=True)
    consent = models.BooleanField(default=False)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="new")
    admin_notes = models.TextField(blank=True)
    is_reviewed = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Project inquiries"

    def __str__(self):
        return f"{self.full_name} - {self.service_needed}"


class VisitorEvent(TimeStampedModel):
    session_key = models.CharField(max_length=80, blank=True, db_index=True)
    path = models.CharField(max_length=255, db_index=True)
    referrer = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    device_type = models.CharField(max_length=40, blank=True, db_index=True)
    device_model = models.CharField(max_length=120, blank=True)
    browser = models.CharField(max_length=80, blank=True)
    os = models.CharField(max_length=80, blank=True)
    platform = models.CharField(max_length=120, blank=True)
    language = models.CharField(max_length=40, blank=True)
    timezone = models.CharField(max_length=80, blank=True)
    screen_width = models.PositiveIntegerField(null=True, blank=True)
    screen_height = models.PositiveIntegerField(null=True, blank=True)
    viewport_width = models.PositiveIntegerField(null=True, blank=True)
    viewport_height = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.path} - {self.device_type or 'visitor'}"
