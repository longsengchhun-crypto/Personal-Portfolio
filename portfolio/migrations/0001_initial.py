import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=80, unique=True)),
                ('slug', models.SlugField(blank=True, max_length=90, unique=True)),
                ('order', models.PositiveIntegerField(default=0)),
            ],
            options={
                'verbose_name_plural': 'Categories',
                'ordering': ['order', 'name'],
            },
        ),
        migrations.CreateModel(
            name='ProjectInquiry',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('full_name', models.CharField(max_length=120)),
                ('email', models.EmailField(max_length=254)),
                ('phone_or_telegram', models.CharField(blank=True, max_length=80)),
                ('company', models.CharField(blank=True, max_length=140)),
                ('service_needed', models.CharField(choices=[('Graphic Design', 'Graphic Design'), ('Video Editing', 'Video Editing'), ('Photography', 'Photography'), ('Videography', 'Videography'), ('Filmmaking', 'Filmmaking'), ('3D Modeling', '3D Modeling'), ('3D Animation', '3D Animation'), ('Motion Graphics', 'Motion Graphics'), ('Social Media Content', 'Social Media Content'), ('Other', 'Other')], max_length=80)),
                ('estimated_budget', models.CharField(blank=True, choices=[('Not decided yet', 'Not decided yet'), ('Under $100', 'Under $100'), ('$100–$300', '$100–$300'), ('$300–$700', '$300–$700'), ('$700–$1,500', '$700–$1,500'), ('Above $1,500', 'Above $1,500'), ('Prefer to discuss privately', 'Prefer to discuss privately')], max_length=80)),
                ('preferred_timeline', models.CharField(blank=True, max_length=120)),
                ('project_description', models.TextField()),
                ('attachment', models.FileField(blank=True, upload_to='inquiries/')),
                ('consent', models.BooleanField(default=False)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('is_reviewed', models.BooleanField(default=False)),
            ],
            options={
                'verbose_name_plural': 'Project inquiries',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='SiteSetting',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('site_name', models.CharField(default='LONG SENGCHHUN', max_length=120)),
                ('professional_title', models.CharField(default='Multidisciplinary Creative Designer', max_length=160)),
                ('hero_intro', models.TextField(default='Creating cinematic visuals, thoughtful designs, and digital experiences that bring ideas to life.')),
                ('khmer_intro', models.CharField(blank=True, default='បង្កើតស្នាដៃដែលភ្ជាប់ជាមួយគំនិត​និង ការរចនា របស់លោកអ្នកជាមួយយើងឥឡូវនេះ', max_length=255)),
                ('professional_intro', models.TextField(default='I am a multidisciplinary creative based in Cambodia, working across graphic design, photography, filmmaking, video editing, and 3D visualization. I create visual content that helps brands, businesses, and organizations communicate ideas clearly and memorably.\n\nMy work includes brand visuals, promotional content, social media design, video production, 3D modeling, animation, product visualization, environment design, and cinematic storytelling. I combine creative direction with practical production skills to develop visuals that are both purposeful and engaging.')),
                ('portrait', models.ImageField(blank=True, upload_to='site/')),
                ('showreel_title', models.CharField(blank=True, max_length=160)),
                ('showreel_thumbnail', models.ImageField(blank=True, upload_to='site/')),
                ('youtube_url', models.URLField(blank=True)),
                ('vimeo_url', models.URLField(blank=True)),
                ('local_video_url', models.URLField(blank=True)),
                ('email', models.EmailField(default='longsengchhun@gmail.com', max_length=254)),
                ('phone', models.CharField(default='016 590 899', max_length=40)),
                ('location', models.CharField(default='Phnom Penh, Cambodia', max_length=120)),
            ],
            options={
                'verbose_name': 'Site setting',
                'verbose_name_plural': 'Site settings',
            },
        ),
        migrations.CreateModel(
            name='SocialLink',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('label', models.CharField(max_length=60)),
                ('url', models.URLField()),
                ('icon_name', models.CharField(blank=True, help_text='Optional Bootstrap Icons name, for example instagram or behance.', max_length=60)),
                ('order', models.PositiveIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
            ],
            options={
                'ordering': ['order', 'label'],
            },
        ),
        migrations.CreateModel(
            name='Project',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('title', models.CharField(max_length=180)),
                ('slug', models.SlugField(blank=True, max_length=200, unique=True)),
                ('year', models.PositiveIntegerField()),
                ('short_description', models.TextField(max_length=420)),
                ('project_type', models.CharField(blank=True, max_length=120)),
                ('cover_image', models.ImageField(blank=True, upload_to='projects/covers/')),
                ('cover_video_url', models.URLField(blank=True)),
                ('client', models.CharField(blank=True, max_length=160)),
                ('role', models.CharField(blank=True, max_length=180)),
                ('project_duration', models.CharField(blank=True, max_length=80)),
                ('software_used', models.CharField(blank=True, help_text='Comma-separated list.', max_length=255)),
                ('introduction', models.TextField(blank=True)),
                ('objective', models.TextField(blank=True)),
                ('creative_approach', models.TextField(blank=True)),
                ('process', models.TextField(blank=True)),
                ('final_result', models.TextField(blank=True)),
                ('embedded_video_url', models.URLField(blank=True)),
                ('before_image', models.ImageField(blank=True, upload_to='projects/before-after/')),
                ('after_image', models.ImageField(blank=True, upload_to='projects/before-after/')),
                ('credits', models.TextField(blank=True)),
                ('is_featured', models.BooleanField(default=False)),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('published', 'Published')], default='draft', max_length=20)),
                ('order', models.PositiveIntegerField(default=0)),
                ('category', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='projects', to='portfolio.category')),
            ],
            options={
                'ordering': ['order', '-year', '-created_at'],
            },
        ),
        migrations.CreateModel(
            name='ProjectGalleryItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('item_type', models.CharField(choices=[('image', 'Image'), ('video', 'Video')], default='image', max_length=20)),
                ('image', models.ImageField(blank=True, upload_to='projects/gallery/')),
                ('video_url', models.URLField(blank=True)),
                ('caption', models.CharField(blank=True, max_length=220)),
                ('alt_text', models.CharField(blank=True, max_length=180)),
                ('layout', models.CharField(choices=[('landscape', 'Landscape'), ('portrait', 'Portrait'), ('full', 'Full width')], default='landscape', max_length=20)),
                ('order', models.PositiveIntegerField(default=0)),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='gallery_items', to='portfolio.project')),
            ],
            options={
                'ordering': ['order', 'id'],
            },
        ),
    ]
