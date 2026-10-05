// Turns a pasted YouTube / Vimeo page link into its embeddable player URL; anything else is
// returned unchanged. Only https URLs are ever embedded.
export function toEmbedUrl(url: string) {
  const value = url.trim();
  const youtube = value.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
  if (youtube) return `https://www.youtube-nocookie.com/embed/${youtube[1]}`;
  const vimeo = value.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return /^https:\/\//i.test(value) ? value : "";
}
