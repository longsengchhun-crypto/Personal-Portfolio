from django.db import migrations, models


NEW_KHMER_INTRO = "បង្កើតស្នាដៃដែលភ្ជាប់ជាមួយគំនិត​និង ការរចនា របស់លោកអ្នកជាមួយយើងឥឡូវនេះ"


def update_khmer_intro(apps, schema_editor):
    SiteSetting = apps.get_model("portfolio", "SiteSetting")
    SiteSetting.objects.update(khmer_intro=NEW_KHMER_INTRO)


class Migration(migrations.Migration):

    dependencies = [
        ("portfolio", "0005_visitorevent_projectinquiry_admin_notes_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="sitesetting",
            name="khmer_intro",
            field=models.CharField(blank=True, default=NEW_KHMER_INTRO, max_length=255),
        ),
        migrations.RunPython(update_khmer_intro, migrations.RunPython.noop),
    ]
