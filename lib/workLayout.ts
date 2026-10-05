// Editorial rhythm for the work grid: large / small / full-width, repeated, with no holes at the
// end. Roles map to grid spans in site.css (.tile--feature, --stack, --third, --half, --full).
export type TileRole = "feature" | "stack" | "third" | "half" | "full" | "reel" | "wide";

type Block = { roles: TileRole[]; mirrored?: boolean };

const FEATURE: Block = { roles: ["feature", "stack", "stack"] };
const FEATURE_MIRRORED: Block = { roles: ["stack", "feature", "stack"], mirrored: true };
const THIRDS: Block = { roles: ["third", "third", "third"] };
const FULL: Block = { roles: ["full"] };
const HALVES: Block = { roles: ["half", "half"] };

export function layoutRoles(count: number, { compact = false }: { compact?: boolean } = {}): TileRole[] {
  const roles: TileRole[] = [];
  const cycle = compact ? [FEATURE, THIRDS] : [FEATURE, THIRDS, FULL, FEATURE_MIRRORED, THIRDS];
  let block = 0;
  while (roles.length < count) {
    const left = count - roles.length;
    const next = cycle[block % cycle.length];
    if (left >= next.roles.length) roles.push(...next.roles);
    else if (left === 2) roles.push(...HALVES.roles);
    else roles.push(...FULL.roles);
    block += 1;
  }
  return roles.slice(0, count);
}
