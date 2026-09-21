-- The portfolio-media bucket's allowed_mime_types never included any GLB/GLTF content type
-- (image/jpeg, image/png, image/webp, video/mp4, application/pdf, application/zip only) —
-- meaning every "Interactive 3D preview — GLB" upload has been rejected by Supabase Storage
-- itself at the infrastructure level, before any application code ever ran. Browsers are also
-- inconsistent about what Content-Type they report for .glb (many report the generic
-- application/octet-stream since it's not a universally-registered OS file association), so
-- that fallback type needs to be allowed too, not just the "correct" model/* types.

update storage.buckets
set allowed_mime_types = array[
  'image/jpeg', 'image/png', 'image/webp', 'video/mp4',
  'application/pdf', 'application/zip', 'application/x-zip-compressed',
  'model/gltf-binary', 'model/gltf+json', 'application/octet-stream'
]
where id = 'portfolio-media';
