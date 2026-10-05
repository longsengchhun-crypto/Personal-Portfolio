import assert from "node:assert/strict";
import test from "node:test";
import { groupByTheme, sortThemes } from "../lib/posterThemes";
import type { Project } from "../lib/types";

const project = (id: number, type: string) => ({ id, project_type: type }) as unknown as Project;

test("known themes keep their set order, custom ones follow alphabetically", () => {
  assert.deepEqual(sortThemes(["Travel & Campaigns", "Zebra", "Food & Beverage", "Apple", "Food & Beverage"]), ["Food & Beverage", "Travel & Campaigns", "Apple", "Zebra"]);
});

test("projects are grouped by theme and untyped ones go last", () => {
  const groups = groupByTheme([project(1, "Travel & Campaigns"), project(2, ""), project(3, "Food & Beverage"), project(4, "Food & Beverage")]);
  assert.deepEqual(groups.map((group) => [group.theme, group.projects.length]), [["Food & Beverage", 2], ["Travel & Campaigns", 1], ["Other", 1]]);
});
