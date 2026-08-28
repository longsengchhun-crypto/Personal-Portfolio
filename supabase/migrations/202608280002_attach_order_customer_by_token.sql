-- Security fix: the original attach_order_customer(p_order_id bigint, p_customer_id bigint)
-- took a guessable sequential order id. Since get_customer_orders() returns access_token,
-- a caller could enumerate small integer order ids, attach someone else's order to their own
-- account, then read that order's access_token and download a model they never paid for.
-- Fix: require the actual unguessable access_token (the same capability already used by the
-- guest order-status page) instead of the sequential id.

drop function if exists public.attach_order_customer(bigint, bigint);

create or replace function public.attach_order_customer(p_access_token uuid, p_customer_id bigint)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.orders
  set customer_id = p_customer_id
  where access_token = p_access_token and customer_id is null;
  return found;
end
$$;

revoke execute on function public.attach_order_customer(uuid, bigint) from public, authenticated, service_role;
grant execute on function public.attach_order_customer(uuid, bigint) to anon;
