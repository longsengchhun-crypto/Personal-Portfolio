import assert from "node:assert/strict";
import test from "node:test";
import { toEmbedUrl } from "../lib/embed";

test("YouTube and Vimeo links become player URLs", () => {
  assert.equal(toEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  assert.equal(toEmbedUrl("https://youtu.be/dQw4w9WgXcQ"), "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  assert.equal(toEmbedUrl("https://vimeo.com/76979871"), "https://player.vimeo.com/video/76979871");
});

test("only https URLs are embedded", () => {
  assert.equal(toEmbedUrl("javascript:alert(1)"), "");
  assert.equal(toEmbedUrl("http://example.com/x"), "");
  assert.equal(toEmbedUrl("https://example.com/player"), "https://example.com/player");
});
