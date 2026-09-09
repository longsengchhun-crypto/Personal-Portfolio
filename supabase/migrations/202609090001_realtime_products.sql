-- Enable Supabase Realtime for the public product catalog only. Scoped deliberately: the
-- store listing is the one place a browsing customer benefits from seeing new/changed/removed
-- items without a manual refresh. Existing RLS ("public reads published products") already
-- restricts which rows a subscribing anon client can see, so this doesn't expose draft
-- products or admin-only fields — it only ever surfaces what the same client could already
-- SELECT directly.

alter table public.products replica identity full;
alter publication supabase_realtime add table public.products;
