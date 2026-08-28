-- Raise the media bucket's size limit so a real showreel video fits (was 100MB).
update storage.buckets set file_size_limit = 524288000 where id = 'portfolio-media';

-- Sets the showreel to a freshly uploaded local video and clears any
-- previously configured embed URL so the new upload is what actually plays.
create or replace function public.dashboard_set_showreel_video(p_token text, p_local_video_url text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if not private.dashboard_token_ok(p_token) then raise exception 'unauthorized'; end if;
  update public.site_settings set
    local_video_url = coalesce(p_local_video_url, ''),
    youtube_url = '',
    vimeo_url = '',
    updated_at = now()
  where id = (select id from public.site_settings order by id limit 1);
  return found;
end $$;

revoke execute on function public.dashboard_set_showreel_video(text, text) from public, authenticated, service_role;
grant execute on function public.dashboard_set_showreel_video(text, text) to anon;
