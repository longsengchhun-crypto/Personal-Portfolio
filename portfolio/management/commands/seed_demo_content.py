from django.core.management.base import BaseCommand

from portfolio.content import PORTFOLIO_CATEGORIES
from portfolio.models import Category, Project, SiteSetting


class Command(BaseCommand):
    help = "Create clearly labeled demo categories and placeholder projects."

    def handle(self, *args, **options):
        for order, name in enumerate(PORTFOLIO_CATEGORIES):
            Category.objects.get_or_create(name=name, defaults={"order": order})

        SiteSetting.objects.get_or_create(
            defaults={
                "site_name": "LONG SENGCHHUN",
                "professional_title": "Multidisciplinary Creative Designer",
            }
        )

        demos = [
            ("Sample Graphic Design Project", "Graphic Design", "Demo placeholder for layout testing. Replace or delete before launch."),
            ("Sample 3D Environment", "3D Modeling", "Demo placeholder for a 3D visualization case study. Replace or delete before launch."),
            ("Sample Video Project", "Video Editing", "Demo placeholder for video editing work. Replace or delete before launch."),
        ]
        for order, (title, category_name, description) in enumerate(demos):
            category = Category.objects.get(name=category_name)
            Project.objects.get_or_create(
                title=title,
                defaults={
                    "category": category,
                    "year": 2026,
                    "short_description": description,
                    "project_type": "Demo content",
                    "status": Project.PUBLISHED,
                    "is_featured": True,
                    "order": order,
                },
            )

        self.stdout.write(self.style.SUCCESS("Demo content created. Delete sample projects in Django Admin before publishing real work."))
