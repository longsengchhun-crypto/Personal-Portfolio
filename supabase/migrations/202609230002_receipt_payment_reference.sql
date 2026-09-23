-- The new customer-facing receipt (evidence of payment, generated once an order is approved)
-- needs the payment reference the customer submitted — get_order_by_token didn't expose it.
-- Same shape as before, with payment_reference added at both the top level and per batch item
-- (each sibling row carries its own copy, set together by submit_order_payment).

create or replace function public.get_order_by_token(p_access_token uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  select jsonb_build_object(
    'id', o.id, 'order_number', o.order_number, 'status', o.status, 'batch_id', o.batch_id,
    'customer_name', o.customer_name, 'customer_email', o.customer_email,
    'price_usd', o.price_usd, 'price_khr', o.price_khr, 'created_at', o.created_at,
    'reviewed_at', o.reviewed_at, 'admin_notes', case when o.status = 'rejected' then o.admin_notes else '' end,
    'payment_reference', o.payment_reference,
    'product', jsonb_build_object('id', p.id, 'title', p.title, 'slug', p.slug, 'cover_image', p.cover_image),
    'batch_items', case when o.batch_id is null then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', sib.id, 'status', sib.status, 'price_usd', sib.price_usd, 'price_khr', sib.price_khr,
        'payment_reference', sib.payment_reference,
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
