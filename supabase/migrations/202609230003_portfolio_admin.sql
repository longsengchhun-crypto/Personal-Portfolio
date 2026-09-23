-- The admin dashboard has full CRUD for 3D Store products but none at all for portfolio
-- projects (the actual "Work" gallery — posters, video/3D showcases, etc.) despite the public
-- site fully supporting them; they were only ever seeded via migration, never manageable from
-- the dashboard. This adds the same RPC + storage-RLS pattern already used for products.

create or replace function public.dashboard_portfolio_content(p_token text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.dashboard_token_ok(p_token) then raise exception 'unauthorized'; end if;
  return jsonb_build_object(
    'categories', coalesce((select jsonb_agg(to_jsonb(x) order by x."order") from (select * from public.categories) x), '[]'::jsonb),
    'projects', coalesce((select jsonb_agg(to_jsonb(x) order by x."order", x.year desc) from (select * from public.projects) x), '[]'::jsonb)
  );
end $$;

create or replace function public.dashboard_portfolio_project(p_token text, p_id bigint)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if not private.dashboard_token_ok(p_token) then raise exception 'unauthorized'; end if;
  select to_jsonb(p) || jsonb_build_object(
    'gallery_items', coalesce((select jsonb_agg(to_jsonb(g) order by g."order") from public.project_gallery_items g where g.project_id = p.id), '[]'::jsonb)
  )
  into result from public.projects p where p.id = p_id;
  return result;
end $$;

create or replace function public.dashboard_upsert_category(p_token text, p_id bigint, p_name text, p_order integer)
returns bigint language plpgsql security definer set search_path = '' as $$
declare result_id bigint;
begin
  if not private.dashboard_token_ok(p_token) then raise exception 'unauthorized'; end if;
  if p_id is null then
    insert into public.categories (name, slug, "order")
    values (left(trim(p_name), 80), left(regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g'), 90), coalesce(p_order, 0))
    returning id into result_id;
  else
    update public.categories set name = left(trim(p_name), 80), "order" = coalesce(p_order, 0) where id = p_id;
    result_id := p_id;
  end if;
  return result_id;
end $$;

create or replace function public.dashboard_delete_category(p_token text, p_id bigint)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if not private.dashboard_token_ok(p_token) then raise exception 'unauthorized'; end if;
  delete from public.categories where id = p_id;
  return found;
end $$;

create or replace function public.dashboard_upsert_project(
  p_token text, p_id bigint, p_category_id bigint, p_title text, p_slug text, p_year integer,
  p_short_description text, p_project_type text, p_cover_image text, p_cover_video_url text,
  p_video_file text, p_client text, p_role text, p_project_duration text, p_software_used text,
  p_introduction text, p_objective text, p_creative_approach text, p_process text,
  p_final_result text, p_embedded_video_url text, p_before_image text, p_after_image text,
  p_credits text, p_is_featured boolean, p_status text, p_order integer
) returns bigint language plpgsql security definer set search_path = '' as $$
declare result_id bigint;
begin
  if not private.dashboard_token_ok(p_token) then raise exception 'unauthorized'; end if;
  if p_status not in ('draft', 'published') then raise exception 'invalid_status'; end if;
  if p_id is null then
    insert into public.projects (
      category_id, title, slug, year, short_description, project_type, cover_image, cover_video_url,
      video_file, client, role, project_duration, software_used, introduction, objective,
      creative_approach, process, final_result, embedded_video_url, before_image, after_image,
      credits, is_featured, status, "order"
    ) values (
      p_category_id, left(trim(p_title), 180), left(trim(p_slug), 200), coalesce(p_year, extract(year from now())::int),
      left(coalesce(p_short_description, ''), 420), left(coalesce(p_project_type, ''), 120),
      coalesce(p_cover_image, ''), coalesce(p_cover_video_url, ''), coalesce(p_video_file, ''),
      left(coalesce(p_client, ''), 160), left(coalesce(p_role, ''), 180), left(coalesce(p_project_duration, ''), 80),
      left(coalesce(p_software_used, ''), 255), coalesce(p_introduction, ''), coalesce(p_objective, ''),
      coalesce(p_creative_approach, ''), coalesce(p_process, ''), coalesce(p_final_result, ''),
      coalesce(p_embedded_video_url, ''), coalesce(p_before_image, ''), coalesce(p_after_image, ''),
      coalesce(p_credits, ''), coalesce(p_is_featured, false), p_status, coalesce(p_order, 0)
    ) returning id into result_id;
  else
    update public.projects set
      category_id = p_category_id, title = left(trim(p_title), 180), slug = left(trim(p_slug), 200),
      year = coalesce(p_year, year), short_description = left(coalesce(p_short_description, ''), 420),
      project_type = left(coalesce(p_project_type, ''), 120), cover_image = coalesce(p_cover_image, ''),
      cover_video_url = coalesce(p_cover_video_url, ''), video_file = coalesce(p_video_file, ''),
      client = left(coalesce(p_client, ''), 160), role = left(coalesce(p_role, ''), 180),
      project_duration = left(coalesce(p_project_duration, ''), 80), software_used = left(coalesce(p_software_used, ''), 255),
      introduction = coalesce(p_introduction, ''), objective = coalesce(p_objective, ''),
      creative_approach = coalesce(p_creative_approach, ''), process = coalesce(p_process, ''),
      final_result = coalesce(p_final_result, ''), embedded_video_url = coalesce(p_embedded_video_url, ''),
      before_image = coalesce(p_before_image, ''), after_image = coalesce(p_after_image, ''),
      credits = coalesce(p_credits, ''), is_featured = coalesce(p_is_featured, false), status = p_status,
      "order" = coalesce(p_order, 0), updated_at = now()
    where id = p_id;
    result_id := p_id;
  end if;
  return result_id;
end $$;

create or replace function public.dashboard_delete_project(p_token text, p_id bigint)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if not private.dashboard_token_ok(p_token) then raise exception 'unauthorized'; end if;
  delete from public.projects where id = p_id;
  return found;
end $$;

create or replace function public.dashboard_add_project_gallery_item(
  p_token text, p_project_id bigint, p_item_type text, p_image text, p_video_url text,
  p_video_file text, p_caption text, p_alt_text text, p_layout text, p_order integer
) returns bigint language plpgsql security definer set search_path = '' as $$
declare result_id bigint;
begin
  if not private.dashboard_token_ok(p_token) then raise exception 'unauthorized'; end if;
  if p_item_type not in ('image', 'video') then raise exception 'invalid_item_type'; end if;
  if p_layout not in ('landscape', 'portrait', 'full') then raise exception 'invalid_layout'; end if;
  insert into public.project_gallery_items (project_id, item_type, image, video_url, video_file, caption, alt_text, layout, "order")
  values (p_project_id, p_item_type, coalesce(p_image, ''), coalesce(p_video_url, ''), coalesce(p_video_file, ''), left(coalesce(p_caption, ''), 220), left(coalesce(p_alt_text, ''), 180), p_layout, coalesce(p_order, 0))
  returning id into result_id;
  return result_id;
end $$;

create or replace function public.dashboard_delete_project_gallery_item(p_token text, p_id bigint)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if not private.dashboard_token_ok(p_token) then raise exception 'unauthorized'; end if;
  delete from public.project_gallery_items where id = p_id;
  return found;
end $$;

do $$
declare fn text;
begin
  foreach fn in array array[
    'dashboard_portfolio_content(text)',
    'dashboard_portfolio_project(text,bigint)',
    'dashboard_upsert_category(text,bigint,text,integer)',
    'dashboard_delete_category(text,bigint)',
    'dashboard_upsert_project(text,bigint,bigint,text,text,integer,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,boolean,text,integer)',
    'dashboard_delete_project(text,bigint)',
    'dashboard_add_project_gallery_item(text,bigint,text,text,text,text,text,text,text,integer)',
    'dashboard_delete_project_gallery_item(text,bigint)'
  ] loop
    execute format('revoke execute on function public.%s from public, authenticated, service_role', fn);
    execute format('grant execute on function public.%s to anon', fn);
  end loop;
end $$;

-- Admin uploads for project cover/gallery images reuse the same TUS resumable path as product
-- media (StoreUploader), which needs the same RLS carve-out this migration already applies to
-- 'products' and 'site' — just extending the folder allowlist to include 'projects'.
drop policy if exists "admin uploads write portfolio media" on storage.objects;
create policy "admin uploads write portfolio media"
on storage.objects
for insert
to anon
with check (
  bucket_id = 'portfolio-media'
  and (storage.foldername(name))[1] in ('products', 'site', 'projects')
);

drop policy if exists "admin uploads update portfolio media" on storage.objects;
create policy "admin uploads update portfolio media"
on storage.objects
for update
to anon
using (
  bucket_id = 'portfolio-media'
  and (storage.foldername(name))[1] in ('products', 'site', 'projects')
)
with check (
  bucket_id = 'portfolio-media'
  and (storage.foldername(name))[1] in ('products', 'site', 'projects')
);

drop policy if exists "admin uploads read own in-progress objects" on storage.objects;
create policy "admin uploads read own in-progress objects"
on storage.objects
for select
to anon
using (
  (bucket_id = 'portfolio-media' and (storage.foldername(name))[1] in ('products', 'site', 'projects'))
  or (bucket_id = 'product-downloads' and (storage.foldername(name))[1] = 'files')
);
