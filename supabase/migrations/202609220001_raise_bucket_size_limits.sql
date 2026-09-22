-- Uploads of 30-40MB+ product files and showreel videos were failing: both buckets were still
-- capped at the 500MB set in earlier migrations, and standard (non-resumable) uploads were
-- additionally constrained by needing to complete in a single PUT. The upload path has been
-- switched to Supabase's resumable (TUS) protocol client-side; this raises the bucket-level
-- ceiling to match the new 2GB target.
--
-- Note: Supabase also enforces a project-wide "Upload file size limit" in
-- Dashboard -> Settings -> Storage, separate from this per-bucket column. That project-wide
-- cap cannot be changed via SQL/migration and must be raised manually in the dashboard (Pro
-- plan required for limits above 50MB) for uploads above it to succeed, no matter what this
-- bucket setting allows.

update storage.buckets set file_size_limit = 2147483648 where id in ('portfolio-media', 'product-downloads');
