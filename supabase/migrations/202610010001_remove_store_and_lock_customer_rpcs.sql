-- The 3D Store has been removed from the site. Existing tables and rows are kept untouched
-- (no data is dropped); only the public entry points are closed.
--
-- get_customer_inquiries / get_customer_orders / wishlist helpers took a bare customer id and were
-- executable with the public anon key, so anyone could enumerate other customers' data.
-- The app now reads customer data server-side with the service role, keyed by the signed
-- session, so these functions no longer need to be callable from the browser.

do $$
declare fn text;
begin
  for fn in
    select format('%I.%I(%s)', n.nspname, p.proname, pg_get_function_identity_arguments(p.oid))
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in (
      'get_customer_inquiries', 'get_customer_orders', 'get_customer_wishlist', 'get_customer_wishlist_ids',
      'toggle_wishlist', 'get_order_by_token', 'submit_order_payment', 'create_order', 'create_cart_orders'
    )
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', fn);
  end loop;
end $$;
