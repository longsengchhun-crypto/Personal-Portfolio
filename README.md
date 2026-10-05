# LONG SENGCHHUN — sengchhun.site

Portfolio site and admin for a Cambodian visual creative (VFX, film, photography, motion, 3D). Next.js 16 (App Router) on Vercel, Supabase for data and media storage.

## Run it

```bash
npm install
cp .env.example .env.local   # fill in the Supabase keys and admin credentials
npm run dev                  # http://localhost:3000
npm run typecheck
npm test
npm run build
```

## Structure

| Path | What lives there |
| --- | --- |
| `app/(site)/` | Public pages: home, work, project detail, services, about, contact, showreel, privacy, client accounts |
| `app/dashboard/` | Admin: overview, projects, media, services, messages, settings, client accounts |
| `app/api/` | Route handlers (inquiries, admin actions, uploads, visit tracking) |
| `app/styles/` | `tokens.css` (design tokens), `base.css`, `ui.css` (shared components), `site.css`, `admin.css` |
| `components/ui/` | Shared primitives: Button, Dialog, Toast, StatusBadge, EmptyState, Skeleton, Picture, Icon |
| `components/site/` | Public-site components (nav, hero, work grid, gallery, contact form…) |
| `components/admin/` | Admin components (shell, command menu, project editor, media library, inbox…) |
| `lib/` | Data access (`data.ts`), auth, notifications, validation, media helpers |
| `supabase/migrations/` | Database schema and RPCs |

## Design system

One set of tokens (`app/styles/tokens.css`) drives both the public site and the admin: near-black cinematic neutrals, warm whites, a single champagne accent, and a glass material used only for floating layers (navigation, toolbars, dialogs). Dark is the default; a light theme is available from the toggle. Motion follows `prefers-reduced-motion`.

## Admin

Sign in at `/dashboard/login/`. Press `Ctrl/Cmd + K` anywhere in the admin to jump to a page or start a task. Projects autosave while they are drafts; published projects save only when you press **Save changes**.

Old admin URLs (`/dashboard/portfolio/…`, `/dashboard/content/`, `/dashboard/hero/`, `/dashboard/inquiries/…`) redirect to their new locations.

## Environment

See `.env.example`. Required: Supabase URL and keys, `SUPABASE_DASHBOARD_TOKEN`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`. Optional: Resend or SMTP for client email, Twilio for SMS, Google OAuth for client sign-in.

## Legacy

The `portfolio/`, `config/`, `templates/`, `manage.py` and `staticfiles/` folders are the original Django version of the site. They are not used by the Next.js app or by Vercel.
