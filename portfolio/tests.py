from django.contrib.auth import get_user_model
from django.core import cache, mail
from django.test import TestCase, override_settings
from django.urls import reverse

from .models import ProjectInquiry


class ProjectInquiryFlowTests(TestCase):
    def setUp(self):
        cache.cache.clear()

    def test_contact_submission_redirects_to_success_state(self):
        response = self.client.post(
            reverse("portfolio:contact"),
            {
                "full_name": "Seng Chhun",
                "email": "client@example.com",
                "phone_or_telegram": "012345678",
                "company": "Creative Studio",
                "service_needed": "Poster Design",
                "estimated_budget": "Under $100",
                "preferred_timeline": "This week",
                "project_description": "I need a campaign poster.",
                "consent": "on",
            },
        )

        self.assertRedirects(response, f"{reverse('portfolio:contact')}?sent=1")
        self.assertEqual(ProjectInquiry.objects.count(), 1)

        success_response = self.client.get(f"{reverse('portfolio:contact')}?sent=1")
        self.assertContains(success_response, "contact-success-khmer.m4a")
        self.assertContains(success_response, "សំណើរបស់លោកអ្នកត្រូវបានផ្ញើដោយជោគជ័យ")

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_dashboard_accepts_inquiry_and_sends_client_email(self):
        user = get_user_model().objects.create_user(
            username="studio-admin",
            password="secret-password",
            is_staff=True,
        )
        inquiry = ProjectInquiry.objects.create(
            full_name="Client Name",
            email="client@example.com",
            phone_or_telegram="012345678",
            service_needed="Graphic Design",
            estimated_budget="Under $100",
            project_description="Please design a brand poster.",
            consent=True,
        )

        self.client.force_login(user)
        response = self.client.post(
            reverse("portfolio:dashboard_inquiry_detail", args=[inquiry.id]),
            {"action": "accept", "next": "dashboard"},
        )

        self.assertRedirects(response, reverse("portfolio:dashboard"))
        inquiry.refresh_from_db()
        self.assertEqual(inquiry.status, "accepted")
        self.assertTrue(inquiry.is_reviewed)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("We received your project inquiry", mail.outbox[0].subject)
        self.assertIn("We will contact you back as soon as possible.", mail.outbox[0].body)
