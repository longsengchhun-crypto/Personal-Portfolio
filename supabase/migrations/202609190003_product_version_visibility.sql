-- Product "versioning": this store never snapshotted purchasable files at time of purchase —
-- getProductDownloadLinks() always resolves whatever files are currently attached to the
-- product. That means an existing buyer already gets any future update to a model they own,
-- automatically, for free — that policy already exists, it just wasn't visible anywhere. This
-- surfaces the product's current version/last-updated date on the order views so a customer
-- can actually see when something they own has changed.

create or replace function public.get_order_by_token(p_access_token uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  select jsonb_build_object(
    'id', o.id, 'order_number', o.order_number, 'status', o.status, 'batch_id', o.batch_id,
    'customer_name', o.customer_name, 'customer_email', o.customer_email,
    'price_usd', o.price_usd, 'price_khr', o.price_khr, 'created_at', o.created_at,
    'reviewed_at', o.reviewed_at, 'admin_notes', case when o.status = 'rejected' then o.admin_notes else '' end,
    'product', jsonb_build_object('id', p.id, 'title', p.title, 'slug', p.slug, 'cover_image', p.cover_image, 'version', p.version, 'updated_at', p.updated_at),
    'batch_items', case when o.batch_id is null then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', sib.id, 'status', sib.status, 'price_usd', sib.price_usd, 'price_khr', sib.price_khr,
        'product', jsonb_build_object('id', sp.id, 'title', sp.title, 'slug', sp.slug, 'cover_image', sp.cover_image, 'version', sp.version, 'updated_at', sp.updated_at)
      ) order by sib.id)
      from public.orders sib join public.products sp on sp.id = sib.product_id
      where sib.batch_id = o.batch_id and sib.id != o.id
    ), '[]'::jsonb) end
  ) into result
  from public.orders o join public.products p on p.id = o.product_id
  where o.access_token = p_access_token;
  return result;
end $$;

create or replace function public.get_customer_orders(p_customer_id bigint)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', o.id, 'order_number', o.order_number, 'access_token', o.access_token,
      'status', o.status, 'price_usd', o.price_usd, 'price_khr', o.price_khr,
      'created_at', o.created_at, 'admin_notes', case when o.status = 'rejected' then o.admin_notes else '' end,
      'product', jsonb_build_object('id', p.id, 'title', p.title, 'slug', p.slug, 'cover_image', p.cover_image, 'version', p.version, 'updated_at', p.updated_at)
    ) order by o.created_at desc)
    from public.orders o join public.products p on p.id = o.product_id
    where o.customer_id = p_customer_id
  ), '[]'::jsonb);
end $$;
