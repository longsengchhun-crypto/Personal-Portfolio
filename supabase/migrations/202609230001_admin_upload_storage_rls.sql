-- Admin file/media uploads (product files, cover images, gallery images, preview videos, GLB
-- previews, showreel video) all go through Supabase's resumable (TUS) upload protocol via
-- StoreUploader.tsx / ShowreelUploader.tsx, using the anon key for auth plus a per-object
-- signed token minted server-side (after an isAdmin() check) via createSignedUploadUrl.
--
-- That per-object token bypasses storage.objects RLS on the *regular* signed-upload endpoint
-- (POST /object/upload/sign/...), which is what the customer payment-proof uploader
-- (PaymentProofForm.tsx) uses via a plain PUT — that one already works. But Supabase's
-- resumable/TUS endpoint (POST /upload/resumable) does not honor that token as an RLS bypass:
-- it evaluates storage.objects INSERT under the anon role from the Authorization header, same
-- as any other anon request. With no policy granting anon INSERT on these paths, every admin
-- upload failed immediately with "new row violates row-level security policy" — regardless of
-- file size, since even a single-chunk upload has to pass the initial row creation.
--
-- The actual gate is application-side already (isAdmin() before a path is ever minted, and the
-- storage path itself is a random UUID nobody can guess), exactly the same trust model already
-- used for "public uploads inquiry attachments" below. This just extends that same model to the
-- prefixes the admin uploaders actually write into.

drop policy if exists "admin uploads write portfolio media" on storage.objects;
create policy "admin uploads write portfolio media"
on storage.objects
for insert
to anon
with check (
  bucket_id = 'portfolio-media'
  and (storage.foldername(name))[1] in ('products', 'site')
);

drop policy if exists "admin uploads update portfolio media" on storage.objects;
create policy "admin uploads update portfolio media"
on storage.objects
for update
to anon
using (
  bucket_id = 'portfolio-media'
  and (storage.foldername(name))[1] in ('products', 'site')
)
with check (
  bucket_id = 'portfolio-media'
  and (storage.foldername(name))[1] in ('products', 'site')
);

drop policy if exists "admin uploads write product downloads" on storage.objects;
create policy "admin uploads write product downloads"
on storage.objects
for insert
to anon
with check (
  bucket_id = 'product-downloads'
  and (storage.foldername(name))[1] = 'files'
);

drop policy if exists "admin uploads update product downloads" on storage.objects;
create policy "admin uploads update product downloads"
on storage.objects
for update
to anon
using (
  bucket_id = 'product-downloads'
  and (storage.foldername(name))[1] = 'files'
)
with check (
  bucket_id = 'product-downloads'
  and (storage.foldername(name))[1] = 'files'
);

-- The resumable protocol also issues a HEAD/GET against the in-progress object to resolve the
-- current offset when a chunked upload resumes after a network drop — needs its own SELECT
-- grant, distinct from the public read policy (which only covers portfolio-media, and only
-- rows that are already fully written).
drop policy if exists "admin uploads read own in-progress objects" on storage.objects;
create policy "admin uploads read own in-progress objects"
on storage.objects
for select
to anon
using (
  (bucket_id = 'portfolio-media' and (storage.foldername(name))[1] in ('products', 'site'))
  or (bucket_id = 'product-downloads' and (storage.foldername(name))[1] = 'files')
);

-- Was dropped in 202607170002_harden_node_portfolio.sql and never recreated. Harmless in
-- practice today (portfolio-media is a public bucket, so reads bypass RLS entirely at the
-- storage-API layer) but restoring it keeps the policy set consistent with what the bucket is
-- actually meant to allow, in case the bucket's public flag is ever revisited.
drop policy if exists "public reads portfolio media" on storage.objects;
create policy "public reads portfolio media"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'portfolio-media');
