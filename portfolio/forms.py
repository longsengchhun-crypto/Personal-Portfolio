from django import forms

from .models import ProjectInquiry


class ProjectInquiryForm(forms.ModelForm):
    honeypot = forms.CharField(required=False, widget=forms.HiddenInput)
    consent = forms.BooleanField(required=True, label="I agree to be contacted about this project inquiry.")

    class Meta:
        model = ProjectInquiry
        fields = [
            "full_name",
            "email",
            "phone_or_telegram",
            "company",
            "service_needed",
            "estimated_budget",
            "preferred_timeline",
            "project_description",
            "attachment",
            "consent",
        ]
        widgets = {
            "project_description": forms.Textarea(attrs={"rows": 6, "placeholder": "Tell me what you want to create."}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["phone_or_telegram"].label = "Phone or Telegram"
        self.fields["phone_or_telegram"].widget.attrs.update({"placeholder": "Phone number or Telegram username"})
        self.fields["preferred_timeline"].widget.attrs.update({"placeholder": "Example: this week, next month, flexible"})
        for name, field in self.fields.items():
            if name == "consent":
                field.widget.attrs.update({"class": "form-check-input"})
            elif name != "honeypot":
                field.widget.attrs.update({"class": "form-control"})
        self.fields["service_needed"].widget.attrs.update({"class": "form-select"})
        self.fields["estimated_budget"].widget.attrs.update({"class": "form-select"})
        self.fields["estimated_budget"].required = False

    def clean_honeypot(self):
        value = self.cleaned_data.get("honeypot")
        if value:
            raise forms.ValidationError("Spam protection triggered.")
        return value

    def clean_attachment(self):
        attachment = self.cleaned_data.get("attachment")
        if not attachment:
            return attachment
        if attachment.size > 8 * 1024 * 1024:
            raise forms.ValidationError("Attachment must be smaller than 8 MB.")
        allowed_types = {"application/pdf", "image/jpeg", "image/png", "image/webp", "application/zip"}
        content_type = getattr(attachment, "content_type", "")
        if content_type and content_type not in allowed_types:
            raise forms.ValidationError("Upload a PDF, image, WebP, or ZIP file.")
        return attachment
