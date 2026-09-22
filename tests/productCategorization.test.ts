import assert from "node:assert/strict";
import test from "node:test";
import { suggestCategory } from "../lib/productCategorization";

test("reuses an existing category whose name is already implied by the product text", () => {
  const existing = [{ id: 1, name: "3D Character", slug: "3d-character" }, { id: 2, name: "Pchum Ben 3D Models", slug: "pchum-ben-3d-models" }];
  const result = suggestCategory({ title: "Rigged Warrior Character", short_description: "A game-ready character model." }, existing);
  assert.deepEqual(result, { categoryId: 1 });
});

test("proposes a Khmer cultural theme name for a locally-themed product with no matching category yet", () => {
  const result = suggestCategory({ title: "Pchum Ben Offering Basket Set", short_description: "Traditional Pchum Ben offering props." }, []);
  assert.deepEqual(result, { newCategoryName: "Pchum Ben 3D Models" });
});

test("proposes a generic English asset-type name when nothing cultural matches", () => {
  const result = suggestCategory({ title: "Modern Office Chair", short_description: "A low poly furniture chair for interior scenes." }, []);
  assert.deepEqual(result, { newCategoryName: "3D Furniture" });
});

test("returns null when there isn't enough signal to guess anything", () => {
  const result = suggestCategory({ title: "Untitled" }, []);
  assert.equal(result, null);
});

test("reuses an already-created matching theme category instead of proposing a duplicate", () => {
  const existing = [{ id: 5, name: "Pchum Ben 3D Models", slug: "pchum-ben-3d-models" }];
  const result = suggestCategory({ title: "Pchum Ben Ancestor Offering Table" }, existing);
  assert.deepEqual(result, { categoryId: 5 });
});
