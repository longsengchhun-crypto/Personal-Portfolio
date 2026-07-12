from .content import KHMER, OWNER
from .models import SiteSetting, SocialLink


def site_context(request):
    return {
        "site_settings": SiteSetting.objects.first(),
        "owner": OWNER,
        "khmer": KHMER,
        "social_links": SocialLink.objects.filter(is_active=True),
    }
