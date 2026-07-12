# LONG SENGCHHUN Portfolio

A monolithic Django portfolio website for a Cambodian multidisciplinary creative designer. It uses Django templates, Django Admin, ModelForms, Bootstrap 5, Bootstrap Icons, Swiper, light GSAP scroll reveals, Pillow image handling, and MySQL-ready environment configuration.

## Quick Start

1. Create and activate a virtual environment.
2. Install dependencies with `pip install -r requirements.txt`.
3. Copy `.env.example` to `.env` and fill in production values.
4. Run `python manage.py migrate`.
5. Run `python manage.py createsuperuser`.
6. Optional development placeholders: `python manage.py seed_demo_content`.
7. Import the real poster showcase: `python manage.py import_poster_artwork`.

The seed command creates clearly labeled sample projects only. Delete them in Django Admin before publishing real work.

## Admin Editing

- Site Settings: portrait, professional copy, showreel links, and contact details.
- Social Links: public social profiles and optional Bootstrap Icon names.
- Categories: portfolio organization and URL filtering.
- Projects: publish, feature, and edit project case studies.
- Gallery Items: ordered images or video links for each project.
- Project Inquiries: review contact form submissions.
- Dashboard: accept or reject inquiries and send the client notification email when SMTP is configured.

## Database

When `DATABASE_NAME` is set, Django uses MySQL with `mysqlclient`. Without database environment variables, it falls back to SQLite for beginner-friendly local setup and checks.

## Email Notifications

Set `EMAIL_HOST`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, and `DEFAULT_FROM_EMAIL` in production. Without SMTP settings, Django uses the console email backend so dashboard decisions do not crash during local development.
