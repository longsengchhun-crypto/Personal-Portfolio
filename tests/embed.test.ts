import assert from "node:assert/strict";
import test from "node:test";
import { parseVideoLink, toEmbedUrl } from "../lib/embed";

test("YouTube and Vimeo links become player URLs", () => {
  assert.equal(toEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  assert.equal(toEmbedUrl("https://youtu.be/dQw4w9WgXcQ"), "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  assert.equal(toEmbedUrl("https://vimeo.com/76979871"), "https://player.vimeo.com/video/76979871");
});

test("TikTok video links become the official embed player and are vertical", () => {
  const link = parseVideoLink("https://www.tiktok.com/@sengchhun230122/video/7123456789012345678");
  assert.deepEqual(link, { provider: "tiktok", embedUrl: "https://www.tiktok.com/embed/v2/7123456789012345678", vertical: true });
  assert.equal(parseVideoLink("https://www.tiktok.com/embed/v2/7123456789012345678?lang=en")?.provider, "tiktok");
});

test("YouTube Shorts are vertical, normal videos are not", () => {
  assert.equal(parseVideoLink("https://www.youtube.com/shorts/abcdEFGhijk")?.vertical, true);
  assert.equal(parseVideoLink("https://youtu.be/dQw4w9WgXcQ")?.vertical, false);
});

test("only https URLs are embedded", () => {
  assert.equal(parseVideoLink("javascript:alert(1)"), null);
  assert.equal(toEmbedUrl("http://example.com/x"), "");
  assert.equal(toEmbedUrl("https://example.com/player"), "https://example.com/player");
});
