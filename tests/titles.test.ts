import assert from "node:assert/strict";
import test from "node:test";
import { tidyTitle } from "../lib/titles";

test("emoji, trailing punctuation and shouting are cleaned", () => {
  assert.equal(tidyTitle("🎬 12-SECOND MOTION GRAPHIC | COMMERCIAL VEHICLE AD POSTER."), "12-Second Motion Graphic | Commercial Vehicle Ad Poster");
});

test("hashtags and design-file leftovers are removed", () => {
  assert.equal(tidyTitle("PB New Copy"), "PB New");
  assert.equal(tidyTitle("Khmer New Year #fyp #animation"), "Khmer New Year");
  assert.equal(tidyTitle("បិណ្ឌ ១ Copy"), "បិណ្ឌ ១");
});

test("normal titles are left alone and long ones are trimmed", () => {
  assert.equal(tidyTitle("Video Editing and 3D Modeling Showcase"), "Video Editing and 3D Modeling Showcase");
  assert.equal(tidyTitle("x".repeat(200)).length, 80);
});
