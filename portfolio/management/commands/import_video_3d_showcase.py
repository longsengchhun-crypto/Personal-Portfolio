from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand

from portfolio.models import Category, Project, ProjectGalleryItem


class Command(BaseCommand):
    help = "Import the video editing and 3D modeling showcase assets."

    def handle(self, *args, **options):
        source_dir = settings.BASE_DIR / "static" / "Video editing and 3D Modeling"
        video_path = source_dir / "V2.mp4"
        screenshots = [
            source_dir / "Screenshot 2026-07-11 160632.png",
            source_dir / "Screenshot 2026-07-11 160652.png",
        ]

        category, _ = Category.objects.get_or_create(
            name="Video and 3D Modeling",
            defaults={"slug": "video-and-3d-modeling", "order": 2},
        )
        Category.objects.get_or_create(name="Video Editing", defaults={"slug": "video-editing", "order": 3})
        Category.objects.get_or_create(name="3D Modeling", defaults={"slug": "3d-modeling", "order": 4})
        Category.objects.get_or_create(name="3D Animation", defaults={"slug": "3d-animation", "order": 5})

        if not video_path.exists():
            self.stdout.write(self.style.ERROR(f"Missing video file: {video_path}"))
            return

        project, _ = Project.objects.update_or_create(
            slug="video-editing-and-3d-modeling-showcase",
            defaults={
                "category": category,
                "title": "Video Editing and 3D Modeling Showcase",
                "year": 2026,
                "short_description": "A creative motion and 3D modeling preview combining edited video, cinematic presentation, and visual showcase frames.",
                "project_type": "Video / 3D Modeling Preview",
                "role": "Video Editing, 3D Modeling, Motion Preview",
                "software_used": "Blender, Premiere Pro, After Effects, DaVinci Resolve",
                "introduction": "This showcase presents video editing and 3D modeling work as a motion-led portfolio piece.",
                "objective": "Show clients a direct preview of moving visuals, edited pacing, 3D presentation, and final showcase imagery.",
                "creative_approach": "The presentation uses a cinematic video player, full-width preview, and supporting still frames so visitors can understand the motion work quickly.",
                "process": "Selected preview frames were used as supporting visuals, while the MP4 is presented as the main motion artifact.",
                "final_result": "A portfolio-ready video and 3D modeling showcase with a local 1080p-friendly MP4 player and two supporting image frames.",
                "status": Project.PUBLISHED,
                "is_featured": True,
                "order": 0,
            },
        )

        if not project.video_file:
            with video_path.open("rb") as video_file:
                project.video_file.save("video-editing-and-3d-modeling-showcase.mp4", File(video_file), save=True)

        for index, screenshot in enumerate(screenshots, start=1):
            if not screenshot.exists():
                self.stdout.write(self.style.WARNING(f"Missing screenshot: {screenshot.name}"))
                continue

            if index == 1 and not project.cover_image:
                with screenshot.open("rb") as cover_file:
                    project.cover_image.save("video-3d-showcase-cover.png", File(cover_file), save=True)

            item, _ = ProjectGalleryItem.objects.update_or_create(
                project=project,
                order=index,
                defaults={
                    "item_type": ProjectGalleryItem.IMAGE,
                    "caption": f"Showcase frame {index}",
                    "alt_text": f"Video editing and 3D modeling showcase frame {index}",
                    "layout": "full" if index == 1 else "landscape",
                },
            )
            if not item.image:
                with screenshot.open("rb") as screenshot_file:
                    item.image.save(f"video-3d-showcase-frame-{index}.png", File(screenshot_file), save=True)

        self.stdout.write(self.style.SUCCESS("Imported video and 3D modeling showcase project."))
