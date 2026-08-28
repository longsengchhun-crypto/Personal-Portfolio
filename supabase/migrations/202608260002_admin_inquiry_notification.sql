-- Allow logging the new admin-notification email alongside the existing
-- receipt/accepted/declined/reply/status client email log.
alter table public.inquiry_messages
  drop constraint if exists inquiry_messages_message_type_check;

alter table public.inquiry_messages
  add constraint inquiry_messages_message_type_check
  check (message_type in ('receipt', 'accepted', 'declined', 'reply', 'status', 'admin_notify'));

create or replace function public.dashboard_record_notification(
  p_token text,
  p_id bigint,
  p_message_type text,
  p_subject text,
  p_body text,
  p_delivery_status text
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
  if p_message_type not in ('receipt', 'accepted', 'declined', 'reply', 'status', 'admin_notify') then
    raise exception 'invalid_message_type';
  end if;
  if p_delivery_status not in ('sent', 'not-configured', 'not-applicable', 'failed') then
    raise exception 'invalid_delivery_status';
  end if;
  if char_length(coalesce(p_body, '')) > 10000 then
    raise exception 'message_too_long';
  end if;

  insert into public.inquiry_messages (inquiry_id, message_type, subject, body, delivery_status)
  values (p_id, p_message_type, left(coalesce(p_subject, ''), 220), coalesce(p_body, ''), p_delivery_status);

  -- Admin-notify entries are an internal alert, not a client-facing message,
  -- so they must never overwrite client_response/last_notification_status.
  if p_message_type <> 'admin_notify' then
    update public.project_inquiries
    set client_response = case when p_message_type = 'reply' then coalesce(p_body, '') else client_response end,
        last_notification_status = p_delivery_status,
        last_notified_at = case when p_delivery_status = 'sent' then now() else last_notified_at end,
        updated_at = now()
    where id = p_id;
  end if;

  return found;
end
$$;
