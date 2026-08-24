import assert from "node:assert/strict";
import test from "node:test";
import { parseUserAgent } from "../lib/validation";

test("Android phone models and major versions are parsed when the browser exposes them", () => {
  const result = parseUserAgent("Mozilla/5.0 (Linux; Android 14; SM-S918B Build/UP1A.231005.007) AppleWebKit/537.36 Chrome/124.0.0.0 Mobile Safari/537.36");
  assert.equal(result.device_type, "Phone");
  assert.equal(result.device_model, "SM-S918B");
  assert.equal(result.device_vendor, "Samsung");
  assert.equal(result.os, "Android");
  assert.equal(result.os_version, "14");
  assert.equal(result.browser, "Chrome");
});

test("privacy-reduced iPhone agents stay accurate without inventing an exact model", () => {
  const result = parseUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Version/18.5 Mobile/15E148 Safari/604.1");
  assert.equal(result.device_type, "Phone");
  assert.equal(result.device_model, "iPhone");
  assert.equal(result.device_vendor, "Apple");
  assert.equal(result.os_version, "18.5");
});
