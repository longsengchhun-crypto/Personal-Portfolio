from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand
from django.utils.text import slugify

from portfolio.models import Category, Project, SiteSetting


POSTER_SELECTION = [
    {
        "file": "Burger poster copy.jpg",
        "title": "Fast Food Promotional Poster",
        "type": "Food Poster",
        "description": "A bold food promotion layout designed to make the product feel immediate, energetic, and easy to recognize.",
    },
    {
        "file": "Backery copy.jpg",
        "title": "Bakery Product Poster",
        "type": "Bakery Poster",
        "description": "A warm bakery-focused poster composition for presenting fresh products with a clear promotional mood.",
    },
    {
        "file": "Blue Berry Smootie 3.jpg",
        "title": "Blueberry Smoothie Beverage Poster",
        "type": "Beverage Poster",
        "description": "A fresh drink poster direction built around color, product appetite, and social-media-ready impact.",
    },
    {
        "file": "GREEN TEAA POSTER copy.jpg",
        "title": "Green Tea Campaign Poster",
        "type": "Beverage Campaign Poster",
        "description": "A tea product poster using a clean visual hierarchy and refreshing green tones for quick audience recognition.",
    },
    {
        "file": "Cerave poster copy.jpg",
        "title": "CeraVe Skincare Product Poster",
        "type": "Skincare Product Poster",
        "description": "A skincare product poster focused on clean product presentation, benefit-driven layout, and premium spacing.",
    },
    {
        "file": "GREEN MOOD Cosmetics.jpg",
        "title": "Green Mood Cosmetics Poster",
        "type": "Cosmetic Campaign Poster",
        "description": "A cosmetic campaign-style poster with polished product emphasis and a refined beauty visual direction.",
    },
    {
        "file": "Asus Phone copy.jpg",
        "title": "ASUS Phone Product Poster",
        "type": "Technology Product Poster",
        "description": "A technology poster concept designed to highlight the product with sharp contrast and a modern promotional feel.",
    },
    {
        "file": "TUF Gaming Laptop copy.jpg",
        "title": "TUF Gaming Laptop Poster",
        "type": "Gaming Technology Poster",
        "description": "A gaming product poster built for high-energy visual impact, strong product focus, and digital campaign use.",
    },
    {
        "file": "PS 5 copy.jpg",
        "title": "PS5 Gaming Poster",
        "type": "Gaming Promo Poster",
        "description": "A gaming promotional poster using dramatic contrast and clear product staging for entertainment audiences.",
    },
    {
        "file": "Travel With Us Poster copy.jpg",
        "title": "Travel With Us Campaign Poster",
        "type": "Travel Poster",
        "description": "A travel campaign poster with an inviting layout made for destination promotion and visual storytelling.",
    },
    {
        "file": "ចូលព្រះវស្សា copy.jpg",
        "title": "Khmer Cultural Event Poster",
        "type": "Cultural Event Poster",
        "description": "A Khmer cultural poster direction that keeps the message respectful, readable, and visually memorable.",
    },
    {
        "file": "ប្រាសាទព្រះវិហារ copy.jpg",
        "title": "Preah Vihear Heritage Poster",
        "type": "Cultural Heritage Poster",
        "description": "A cultural heritage poster that presents place, atmosphere, and identity through a strong visual composition.",
    },
    {
        "file": "CETAPHIL copy.jpg",
        "title": "Cetaphil Skincare Poster",
        "type": "Skincare Product Poster",
        "description": "A clean skincare poster focused on product trust, soft contrast, and easy-to-read visual hierarchy.",
    },
    {
        "file": "Bareminral copy.jpg",
        "title": "BareMinerals Beauty Poster",
        "type": "Beauty Product Poster",
        "description": "A beauty product poster with a polished commercial layout and a soft premium product mood.",
    },
    {
        "file": "COSMETIC POSTER 11 copy.jpg",
        "title": "Cosmetic Launch Poster",
        "type": "Cosmetic Product Poster",
        "description": "A product launch style poster built around strong product staging, contrast, and campaign-ready composition.",
    },
    {
        "file": "GP of cosmetic product.jpg",
        "title": "Cosmetic Group Product Poster",
        "type": "Cosmetic Collection Poster",
        "description": "A grouped cosmetic product poster designed to present multiple items as one clear campaign visual.",
    },
    {
        "file": "New Cosmetic Product copy.jpg",
        "title": "New Cosmetic Product Poster",
        "type": "Cosmetic Promo Poster",
        "description": "A social-ready cosmetic promotional poster with a clean product-first visual direction.",
    },
    {
        "file": "BUNNY'S FOOD CASTLE copy.jpg",
        "title": "Food Castle Restaurant Poster",
        "type": "Restaurant Poster",
        "description": "A restaurant poster concept with playful food branding, clear offer presentation, and strong appetite appeal.",
    },
    {
        "file": "Food poster gf copy.jpg",
        "title": "Grilled Food Poster",
        "type": "Food Campaign Poster",
        "description": "A food campaign poster designed for bold menu promotion and quick social media recognition.",
    },
    {
        "file": "matcha new poster copy.jpg",
        "title": "Matcha Beverage Poster",
        "type": "Beverage Poster",
        "description": "A matcha drink poster with fresh color direction and a clean promotional composition.",
    },
    {
        "file": "OMEGA 3 copy.jpg",
        "title": "Omega 3 Product Poster",
        "type": "Health Product Poster",
        "description": "A health product poster with a structured product layout and practical information hierarchy.",
    },
    {
        "file": "Panasonic Product 4 copy.jpg",
        "title": "Panasonic Product Poster",
        "type": "Electronics Product Poster",
        "description": "An electronics product poster emphasizing product clarity, modern contrast, and commercial presentation.",
    },
    {
        "file": "RACING PD copy.jpg",
        "title": "Racing Promo Poster",
        "type": "Sports Promo Poster",
        "description": "A racing-themed promotional poster with motion energy, bold contrast, and event-style impact.",
    },
    {
        "file": "Passapp1 copy.jpg",
        "title": "PassApp Promotion Poster",
        "type": "Service Promo Poster",
        "description": "A service promotion poster direction designed for fast recognition and clear digital campaign use.",
    },
    {
        "file": "NEW MENU.jpg",
        "title": "Restaurant Menu Poster",
        "type": "Menu Poster",
        "description": "A menu poster layout focused on organized food presentation and practical readability.",
    },
    {
        "file": "រដ្ឋធម្មនុញ្ញ copy.jpg",
        "title": "Constitution Day Poster",
        "type": "Civic Poster",
        "description": "A civic poster concept with Khmer-language presentation, respectful tone, and clear public-message design.",
    },
]

FEATURED_POSTERS = {
    "Green Mood Cosmetics Poster",
    "TUF Gaming Laptop Poster",
    "Travel With Us Campaign Poster",
    "Blueberry Smoothie Beverage Poster",
    "ASUS Phone Product Poster",
    "PS5 Gaming Poster",
    "Preah Vihear Heritage Poster",
    "Matcha Beverage Poster",
}


class Command(BaseCommand):
    help = "Import a curated selection of poster artworks from static/images into the portfolio."

    def handle(self, *args, **options):
        image_dir = settings.BASE_DIR / "static" / "images"
        category, _ = Category.objects.get_or_create(
            name="Poster Design",
            defaults={"slug": "poster-design", "order": 1},
        )
        Category.objects.get_or_create(name="Graphic Design", defaults={"slug": "graphic-design", "order": 0})
        SiteSetting.objects.get_or_create()
        Project.objects.filter(category=category).update(is_featured=False)

        imported = 0
        for order, item in enumerate(POSTER_SELECTION, start=1):
            source = image_dir / item["file"]
            if not source.exists():
                self.stdout.write(self.style.WARNING(f"Missing image: {item['file']}"))
                continue

            project, _created = Project.objects.update_or_create(
                slug=slugify(item["title"]),
                defaults={
                    "category": category,
                    "title": item["title"],
                    "year": 2026,
                    "short_description": item["description"],
                    "project_type": item["type"],
                    "role": "Poster Design, Layout Design, Visual Direction",
                    "software_used": "Photoshop, Illustrator",
                    "introduction": item["description"],
                    "objective": "Create a clear poster visual that helps the subject, product, or event become recognizable at a glance.",
                    "creative_approach": "Focused on strong hierarchy, readable typography, product or subject emphasis, color mood, and social-media-friendly composition.",
                    "status": Project.PUBLISHED,
                    "is_featured": item["title"] in FEATURED_POSTERS,
                    "order": order,
                },
            )

            media_name = f"{slugify(item['title'])}{source.suffix.lower()}"
            if not project.cover_image:
                with source.open("rb") as image_file:
                    project.cover_image.save(media_name, File(image_file), save=True)
            imported += 1

        self.stdout.write(self.style.SUCCESS(f"Imported or updated {imported} poster portfolio projects."))
