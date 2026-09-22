-- Extends the same pattern used for `products` (202609090001) to the rest of the publicly
-- readable content tables, so a change made in the admin dashboard (new product category, new
-- portfolio project, edited service/skill/software list, updated site settings or social
-- links) reaches an already-open browser tab without the visitor refreshing.
--
-- Scoped the same deliberate way as before: every table added here already has a public "read
-- published/active rows" RLS policy that the anon client can already SELECT directly (it's
-- exactly what every page's server-side data fetch already reads) — this does not expose any
-- row a subscribing client couldn't already query.

alter table public.product_categories replica identity full;
alter table public.categories replica identity full;
alter table public.projects replica identity full;
alter table public.services replica identity full;
alter table public.skill_groups replica identity full;
alter table public.skills replica identity full;
alter table public.software_tools replica identity full;
alter table public.site_settings replica identity full;
alter table public.social_links replica identity full;

alter publication supabase_realtime add table public.product_categories;
alter publication supabase_realtime add table public.categories;
alter publication supabase_realtime add table public.projects;
alter publication supabase_realtime add table public.services;
alter publication supabase_realtime add table public.skill_groups;
alter publication supabase_realtime add table public.skills;
alter publication supabase_realtime add table public.software_tools;
alter publication supabase_realtime add table public.site_settings;
alter publication supabase_realtime add table public.social_links;
