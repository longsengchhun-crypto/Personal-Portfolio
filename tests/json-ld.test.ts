import assert from "node:assert/strict";
import test from "node:test";
import { toJsonLd } from "../lib/jsonLd";

test("structured data cannot close the script tag", () => {
  const out = toJsonLd({ name: "</script><img src=x onerror=alert(1)>" });
  assert.ok(!out.includes("<"));
  assert.equal(JSON.parse(out).name, "</script><img src=x onerror=alert(1)>");
});
