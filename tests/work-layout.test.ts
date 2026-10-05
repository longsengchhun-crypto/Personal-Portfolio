import assert from "node:assert/strict";
import test from "node:test";
import { layoutRoles, type TileRole } from "../lib/workLayout";

// Each role's width in a 12-column grid; a full layout must fill every row exactly.
const WIDTH: Record<TileRole, number> = { feature: 8, stack: 4, third: 4, half: 6, full: 12 };

function rowsFill(roles: TileRole[]) {
  let i = 0;
  while (i < roles.length) {
    const role = roles[i];
    if (role === "feature" || (role === "stack" && roles[i + 1] === "feature")) { i += 3; continue; }
    if (role === "third") { i += 3; continue; }
    if (role === "half") { i += 2; continue; }
    if (role === "full") { i += 1; continue; }
    return false;
  }
  return i === roles.length;
}

test("layout returns exactly one role per project", () => {
  for (const count of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 17, 24, 61]) {
    assert.equal(layoutRoles(count).length, count);
  }
});

test("layout never leaves a hole at the end of the grid", () => {
  for (let count = 1; count <= 40; count++) {
    assert.ok(rowsFill(layoutRoles(count)), `holes for ${count} projects: ${layoutRoles(count).join(",")}`);
  }
});

test("the widths in a block add up to full rows", () => {
  assert.equal(WIDTH.feature + WIDTH.stack, 12);
  assert.equal(WIDTH.third * 3, 12);
  assert.equal(WIDTH.half * 2, 12);
});

test("a single project is shown full width and a pair splits evenly", () => {
  assert.deepEqual(layoutRoles(1), ["full"]);
  assert.deepEqual(layoutRoles(2), ["half", "half"]);
});
