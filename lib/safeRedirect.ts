/** Returns `value` only if it is a same-site path under `prefix`; otherwise the fallback. Blocks `//host`, `/\host` and absolute URLs. */
export function safeInternalPath(value: unknown, prefix: string, fallback: string) {
  const path = typeof value === "string" ? value : "";
  if (!path.startsWith(prefix) || path.startsWith("//") || path.includes("\\") || /[\u0000-\u001f]/.test(path)) return fallback;
  return path;
}
