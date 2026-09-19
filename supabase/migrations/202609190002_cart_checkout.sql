-- Multi-item cart checkout, layered on top of the existing single-product order model
-- rather than replacing it. Each cart checkout still creates ordinary rows in `orders` —
-- one per product, exactly like today's single "Buy Now" flow — so every existing page
-- that reads an order (admin list/detail, the guest order-status page, Client Studio,
-- download resolution, order emails) keeps working completely unchanged. The only new
-- concept is `batch_id`: a shared marker linking the orders created in one checkout, used
-- purely to render them together and to let one payment-proof submission cover the whole
-- batch. Existing orders get batch_id = null, meaning "standalone", which is exactly their
-- current (and still fully supported) behavior.

alter table public.orders add column if not exists batch_id uuid;
create index if not exists orders_batch_idx on public.orders(batch_id);

create or replace function public.submit_order_batch(
  p_product_ids bigint[], p_customer_name text, p_customer_email text, p_customer_phone text,
  p_ip_address inet, p_customer_id bigint default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  new_batch uuid;
  primary_token uuid;
  product_row public.products%rowtype;
  pid bigint;
  new_id bigint;
  new_token uuid;
  new_number text;
  created_count int := 0;
begin
  if p_product_ids is null or array_length(p_product_ids, 1) is null then raise exception 'empty_cart'; end if;
  if array_length(p_product_ids, 1) > 20 then raise exception 'too_many_items'; end if;

  if p_ip_address is not null and exists (
    select 1 from public.orders where ip_address = p_ip_address and created_at > now() - interval '5 minutes'
  ) then
    raise exception 'rate_limited';
  end if;

  new_batch := gen_random_uuid();

  foreach pid in array p_product_ids loop
    select * into product_row from public.products where id = pid and status = 'published';
    if not found then continue; end if; -- silently skip a product that vanished/unpublished between cart and checkout

    insert into public.orders (order_number, product_id, customer_name, customer_email, customer_phone, price_usd, price_khr, ip_address, customer_id, batch_id)
    values ('PENDING', pid, left(trim(p_customer_name), 120), left(trim(p_customer_email), 254), left(trim(coalesce(p_customer_phone, '')), 80), product_row.price_usd, product_row.price_khr, p_ip_address, p_customer_id, new_batch)
    returning id, access_token into new_id, new_token;

    new_number := 'ORD-' || to_char(now(), 'YYYY') || '-' || lpad(new_id::text, 6, '0');
    update public.orders set order_number = new_number where id = new_id;

    if primary_token is null then primary_token := new_token; end if;
    created_count := created_count + 1;
  end loop;

  if created_count = 0 then raise exception 'no_valid_products'; end if;

  return jsonb_build_object('batch_id', new_batch, 'primary_token', primary_token, 'item_count', created_count);
end $$;

-- Extended (not replaced): now also reports batch siblings so the guest order-status page
-- can render "your order includes N items" instead of just the one it was opened with.
create or replace function public.get_order_by_token(p_access_token uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  select jsonb_build_object(
    'id', o.id, 'order_number', o.order_number, 'status', o.status, 'batch_id', o.batch_id,
    'customer_name', o.customer_name, 'customer_email', o.customer_email,
    'price_usd', o.price_usd, 'price_khr', o.price_khr, 'created_at', o.created_at,
    'reviewed_at', o.reviewed_at, 'admin_notes', case when o.status = 'rejected' then o.admin_notes else '' end,
    'product', jsonb_build_object('id', p.id, 'title', p.title, 'slug', p.slug, 'cover_image', p.cover_image),
    'batch_items', case when o.batch_id is null then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', sib.id, 'status', sib.status, 'price_usd', sib.price_usd, 'price_khr', sib.price_khr,
        'product', jsonb_build_object('id', sp.id, 'title', sp.title, 'slug', sp.slug, 'cover_image', sp.cover_image)
      ) order by sib.id)
      from public.orders sib join public.products sp on sp.id = sib.product_id
      where sib.batch_id = o.batch_id and sib.id != o.id
    ), '[]'::jsonb) end
  ) into result
  from public.orders o join public.products p on p.id = o.product_id
  where o.access_token = p_access_token;
  return result;
end $$;

-- Extended: a batch's payment proof is submitted once, on the primary token, and now
-- applies to every sibling order in the same batch that's still awaiting payment.
create or replace function public.submit_order_payment(p_access_token uuid, p_payment_reference text, p_payment_screenshot text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare target_batch uuid;
begin
  select batch_id into target_batch from public.orders where access_token = p_access_token and status = 'pending_payment';

  update public.orders
  set payment_reference = left(trim(coalesce(p_payment_reference, '')), 160),
      payment_screenshot = coalesce(p_payment_screenshot, ''),
      status = 'payment_submitted',
      updated_at = now()
  where status = 'pending_payment' and (
    access_token = p_access_token or (target_batch is not null and batch_id = target_batch)
  );
  return found;
end $$;

revoke execute on function public.submit_order_batch(bigint[], text, text, text, inet, bigint) from public, authenticated, service_role;
grant execute on function public.submit_order_batch(bigint[], text, text, text, inet, bigint) to anon;
