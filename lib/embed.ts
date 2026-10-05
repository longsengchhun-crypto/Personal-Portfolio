// Turns a pasted video page link into the player that can be embedded. Only https links are ever
// embedded. Vertical formats (TikTok, YouTube Shorts) are flagged so the page can give them a
// portrait player instead of a letterboxed one.
export type VideoLink = { provider: "youtube" | "vimeo" | "tiktok" | "other"; embedUrl: string; vertical: boolean };

export function parseVideoLink(url: string): VideoLink | null {
  const value = url.trim();
  if (!/^https:\/\//i.test(value)) return null;
  const tiktok = value.match(/tiktok\.com\/(?:@[\w.-]+\/video|embed(?:\/v2)?)\/(\d{8,})/i);
  if (tiktok) return { provider: "tiktok", embedUrl: `https://www.tiktok.com/player/v1/${tiktok[1]}?controls=1&progress_bar=1&play_button=1&volume_control=1&fullscreen_button=1&timestamp=0&loop=1&music_info=0&description=0&rel=0&native_context_menu=0&closed_caption=0`, vertical: true };
  const short = value.match(/youtube\.com\/shorts\/([\w-]{6,})/i);
  if (short) return { provider: "youtube", embedUrl: `https://www.youtube-nocookie.com/embed/${short[1]}`, vertical: true };
  const youtube = value.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/)|youtube-nocookie\.com\/embed\/)([\w-]{6,})/i);
  if (youtube) return { provider: "youtube", embedUrl: `https://www.youtube-nocookie.com/embed/${youtube[1]}`, vertical: false };
  const vimeo = value.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo) return { provider: "vimeo", embedUrl: `https://player.vimeo.com/video/${vimeo[1]}`, vertical: false };
  return { provider: "other", embedUrl: value, vertical: false };
}

export function toEmbedUrl(url: string) {
  return parseVideoLink(url)?.embedUrl ?? "";
}
