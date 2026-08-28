create or replace function public.dashboard_update_payment_settings(p_token text, p_aba_qr_image text, p_aba_account_info text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if not private.dashboard_token_ok(p_token) then raise exception 'unauthorized'; end if;
  update public.site_settings set
    aba_qr_image = coalesce(p_aba_qr_image, ''),
    aba_account_info = coalesce(p_aba_account_info, ''),
    updated_at = now()
  where id = (select id from public.site_settings order by id limit 1);
  return found;
end $$;

revoke execute on function public.dashboard_update_payment_settings(text, text, text) from public, authenticated, service_role;
grant execute on function public.dashboard_update_payment_settings(text, text, text) to anon;
