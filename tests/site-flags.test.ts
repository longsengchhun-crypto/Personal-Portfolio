import assert from "node:assert/strict";
import test from "node:test";
import { availabilityLabel, normalizeFlags, seoDescription } from "../lib/siteFlags";

test("empty or malformed flags fall back to open for work", () => {
  assert.deepEqual(normalizeFlags(null), { available: true, availabilityNote: "", seoDescription: "" });
  assert.equal(normalizeFlags("junk").available, true);
});

test("only an explicit false marks the studio as booked", () => {
  assert.equal(normalizeFlags({ available: false }).available, false);
  assert.equal(normalizeFlags({ available: 0 }).available, true);
});

test("labels and descriptions prefer the custom text", () => {
  assert.equal(availabilityLabel(normalizeFlags({ availabilityNote: "Booking from November" })), "Booking from November");
  assert.match(availabilityLabel(normalizeFlags({ available: false })), /booked/i);
  assert.equal(seoDescription(normalizeFlags({ seoDescription: "Hello" })), "Hello");
  assert.match(seoDescription(normalizeFlags({})), /Filmmaker and visual creative/);
});

test("overlong text is trimmed", () => {
  assert.equal(normalizeFlags({ availabilityNote: "x".repeat(500) }).availabilityNote.length, 120);
  assert.equal(normalizeFlags({ seoDescription: "y".repeat(500) }).seoDescription.length, 300);
});
