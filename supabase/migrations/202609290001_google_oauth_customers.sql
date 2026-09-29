-- Google sign-in for the 3D Store, layered onto the existing password-based customers
-- table rather than replacing it. A Google-created account still gets a password_hash
-- (a random, unguessable bcrypt hash the customer could never type) so the column stays
-- not-null and verify_customer_login can never accidentally authenticate it by password.
-- auth_provider is informational only (for support/debugging); login still resolves by
-- email either way, so a customer who registered with a password and later uses "Continue
-- with Google" on the same email signs into the same account instead of getting a
-- duplicate one.

alter table public.customers add column if not exists auth_provider varchar(20) not null default 'password';

create or replace function public.upsert_google_customer(p_email text, p_full_name text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare existing_id bigint; existing_name text; result jsonb;
begin
  if p_email is null or trim(p_email) = '' then raise exception 'invalid_email'; end if;

  select id, full_name into existing_id, existing_name
  from public.customers where lower(email) = lower(trim(p_email));

  if existing_id is not null then
    return jsonb_build_object('id', existing_id, 'email', lower(trim(p_email)), 'full_name', existing_name);
  end if;

  insert into public.customers (email, password_hash, full_name, auth_provider)
  values (
    lower(trim(p_email)),
    extensions.crypt(encode(extensions.gen_random_bytes(24), 'hex'), extensions.gen_salt('bf')),
    left(trim(coalesce(p_full_name, split_part(p_email, '@', 1))), 120),
    'google'
  )
  returning id, full_name into existing_id, existing_name;

  return jsonb_build_object('id', existing_id, 'email', lower(trim(p_email)), 'full_name', existing_name);
end $$;

revoke execute on function public.upsert_google_customer(text, text) from public, authenticated, service_role;
grant execute on function public.upsert_google_customer(text, text) to anon;
