create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create or replace function private.dashboard_token_ok(p_token text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex') =
    '67bc4385eb7bb6a52bcc29723d775a0d1343a13ba312a05b88b656ba2959d074'
$$;

revoke execute on function private.dashboard_token_ok(text) from public, anon, authenticated, service_role;

create or replace function public.submit_inquiry(
  p_full_name text,
  p_email text,
  p_phone_or_telegram text,
  p_company text,
  p_service_needed text,
  p_estimated_budget text,
  p_preferred_timeline text,
  p_project_description text,
  p_attachment text,
  p_ip_address inet
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id bigint;
begin
  if p_ip_address is not null and exists (
    select 1
    from public.project_inquiries
    where ip_address = p_ip_address
      and created_at > now() - interval '5 minutes'
  ) then
    raise exception 'rate_limited';
  end if;

  insert into public.project_inquiries (
    full_name,
    email,
    phone_or_telegram,
    company,
    service_needed,
    estimated_budget,
    preferred_timeline,
    project_description,
    attachment,
    consent,
    ip_address
  )
  values (
    left(trim(p_full_name), 120),
    left(trim(p_email), 254),
    left(trim(coalesce(p_phone_or_telegram, '')), 80),
    left(trim(coalesce(p_company, '')), 140),
    left(trim(p_service_needed), 80),
    left(trim(coalesce(p_estimated_budget, '')), 80),
    left(trim(coalesce(p_preferred_timeline, '')), 120),
    p_project_description,
    coalesce(p_attachment, ''),
    true,
    p_ip_address
  )
  returning id into new_id;

  return new_id;
end
$$;

create or replace function public.dashboard_snapshot(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.dashboard_token_ok(p_token) then
    raise exception 'unauthorized';
  end if;

  return jsonb_build_object(
    'total_visits', (select count(*) from public.visitor_events),
    'today_visits', (
      select count(*)
      from public.visitor_events
      where created_at::date = (now() at time zone 'Asia/Phnom_Penh')::date
    ),
    'unique_visitors', (select count(distinct session_key) from public.visitor_events),
    'new_inquiries', (select count(*) from public.project_inquiries where status = 'new'),
    'accepted_projects', (select count(*) from public.project_inquiries where status = 'accepted'),
    'latest_visits', coalesce((
      select jsonb_agg(to_jsonb(v))
      from (
        select id, path, device_type, device_model, browser, os, screen_width, screen_height, created_at
        from public.visitor_events
        order by created_at desc
        limit 40
      ) v
    ), '[]'::jsonb),
    'latest_inquiries', coalesce((
      select jsonb_agg(to_jsonb(i))
      from (
        select id, full_name, email, phone_or_telegram, company, service_needed,
          estimated_budget, preferred_timeline, project_description, attachment,
          consent, status, admin_notes, is_reviewed, created_at, updated_at
        from public.project_inquiries
        order by created_at desc
        limit 20
      ) i
    ), '[]'::jsonb),
    'device_breakdown', coalesce((
      select jsonb_agg(to_jsonb(d))
      from (
        select device_type, count(*)::integer as total
        from public.visitor_events
        group by device_type
        order by total desc
      ) d
    ), '[]'::jsonb),
    'top_pages', coalesce((
      select jsonb_agg(to_jsonb(p))
      from (
        select path, count(*)::integer as total
        from public.visitor_events
        group by path
        order by total desc
        limit 8
      ) p
    ), '[]'::jsonb)
  );
end
$$;

create or replace function public.dashboard_inquiry(p_token text, p_id bigint)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not private.dashboard_token_ok(p_token) then
    raise exception 'unauthorized';
  end if;

  select to_jsonb(i)
  into result
  from public.project_inquiries i
  where i.id = p_id;

  return result;
end
$$;

create or replace function public.dashboard_update_inquiry(
  p_token text,
  p_id bigint,
  p_status text,
  p_admin_notes text,
  p_is_reviewed boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.dashboard_token_ok(p_token) then
    raise exception 'unauthorized';
  end if;

  if p_status not in ('new', 'reviewing', 'replied', 'accepted', 'declined', 'archived') then
    raise exception 'invalid_status';
  end if;

  update public.project_inquiries
  set status = p_status,
      admin_notes = coalesce(p_admin_notes, ''),
      is_reviewed = p_is_reviewed,
      updated_at = now()
  where id = p_id;

  return found;
end
$$;

revoke execute on function public.submit_inquiry(text, text, text, text, text, text, text, text, text, inet) from public, authenticated, service_role;
revoke execute on function public.dashboard_snapshot(text) from public, authenticated, service_role;
revoke execute on function public.dashboard_inquiry(text, bigint) from public, authenticated, service_role;
revoke execute on function public.dashboard_update_inquiry(text, bigint, text, text, boolean) from public, authenticated, service_role;

grant execute on function public.submit_inquiry(text, text, text, text, text, text, text, text, text, inet) to anon;
grant execute on function public.dashboard_snapshot(text) to anon;
grant execute on function public.dashboard_inquiry(text, bigint) to anon;
grant execute on function public.dashboard_update_inquiry(text, bigint, text, text, boolean) to anon;

drop function if exists public.dashboard_token_ok(text);

revoke execute on function public.rls_auto_enable() from public, anon, authenticated, service_role;

drop policy if exists "public records visits" on public.visitor_events;
create policy "public records valid visits"
on public.visitor_events
for insert
to anon
with check (
  char_length(session_key) between 1 and 80
  and char_length(path) between 1 and 255
  and path like '/%'
  and char_length(referrer) <= 1000
  and char_length(user_agent) <= 2000
  and char_length(device_type) <= 40
  and char_length(device_model) <= 120
  and char_length(browser) <= 80
  and char_length(os) <= 80
);

drop policy if exists "public reads portfolio media" on storage.objects;
drop policy if exists "public uploads inquiry attachments" on storage.objects;
create policy "public uploads inquiry attachments"
on storage.objects
for insert
to anon
with check (
  bucket_id = 'portfolio-media'
  and (storage.foldername(name))[1] = 'inquiries'
);

create index if not exists project_gallery_items_project_order_idx
on public.project_gallery_items(project_id, "order");
