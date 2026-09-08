-- Client Studio, phase 1: let a signed-in customer see their own service inquiries
-- (not just 3D store orders) in one place, using the real existing inquiry data —
-- no new "projects" concept invented, no fake data.

alter table public.project_inquiries add column if not exists customer_id bigint references public.customers(id) on delete set null;
create index if not exists project_inquiries_customer_idx on public.project_inquiries(customer_id);

-- Linking only ever happens at submission time, using a customer_id the caller already
-- trusts (the Next.js route reads it from a verified session cookie). There is no
-- "attach after the fact by guessable id" path — unlike orders, inquiries have no
-- unguessable access_token, so retroactively linking by id would let anyone harvest
-- other people's project descriptions and budgets by brute-forcing small integers.
drop function if exists public.submit_inquiry(text, text, text, text, text, text, text, text, text, inet);

create or replace function public.submit_inquiry(
  p_full_name text, p_email text, p_phone_or_telegram text, p_company text,
  p_service_needed text, p_estimated_budget text, p_preferred_timeline text,
  p_project_description text, p_attachment text, p_ip_address inet,
  p_customer_id bigint default null
) returns bigint language plpgsql security definer set search_path = public
as $$
declare new_id bigint;
begin
  if p_ip_address is not null and exists (select 1 from project_inquiries where ip_address = p_ip_address and created_at > now() - interval '5 minutes') then
    raise exception 'rate_limited';
  end if;
  insert into project_inquiries (full_name, email, phone_or_telegram, company, service_needed, estimated_budget, preferred_timeline, project_description, attachment, consent, ip_address, customer_id)
  values (left(trim(p_full_name),120), left(trim(p_email),254), left(trim(coalesce(p_phone_or_telegram,'')),80), left(trim(coalesce(p_company,'')),140), left(trim(p_service_needed),80), left(trim(coalesce(p_estimated_budget,'')),80), left(trim(coalesce(p_preferred_timeline,'')),120), p_project_description, coalesce(p_attachment,''), true, p_ip_address, p_customer_id)
  returning id into new_id;
  return new_id;
end $$;

grant execute on function public.submit_inquiry(text,text,text,text,text,text,text,text,text,inet,bigint) to anon, authenticated;

create or replace function public.get_customer_inquiries(p_customer_id bigint)
returns jsonb language plpgsql stable security definer set search_path = public
as $$
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', i.id, 'service_needed', i.service_needed, 'project_description', i.project_description,
      'estimated_budget', i.estimated_budget, 'preferred_timeline', i.preferred_timeline,
      'status', i.status, 'created_at', i.created_at, 'updated_at', i.updated_at,
      'messages', coalesce((
        select jsonb_agg(jsonb_build_object('message_type', m.message_type, 'subject', m.subject, 'body', m.body, 'created_at', m.created_at) order by m.created_at)
        from public.inquiry_messages m where m.inquiry_id = i.id and m.message_type in ('reply', 'accepted', 'declined')
      ), '[]'::jsonb)
    ) order by i.created_at desc)
    from public.project_inquiries i
    where i.customer_id = p_customer_id
  ), '[]'::jsonb);
end $$;

revoke execute on function public.get_customer_inquiries(bigint) from public, service_role;
grant execute on function public.get_customer_inquiries(bigint) to anon, authenticated;
