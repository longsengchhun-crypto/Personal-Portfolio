// Centralized file-format policy for the 3D Store, so "what's an accepted product file"
// lives in one place instead of scattered accept="" strings. Mirrors the server-side
// allowlist in app/api/dashboard/store/file-upload-url/route.ts — that route is the real
// security boundary (client-side checks are only ever a UX convenience), so if this list
// changes, that one must change with it.

export const PRODUCT_FILE_EXTENSIONS = [
  "blend", "c4d", "fbx", "obj", "mtl", "glb", "gltf", "max", "ma", "mb", "abc", "3ds", "dae",
  "stl", "ztl", "zpr", "zbp", "zip", "rar", "bin",
  "jpg", "jpeg", "png", "webp", "tif", "tiff", "exr", "hdr", "bmp", "svg", "pdf", "txt",
] as const;

export const PREVIEW_FILE_EXTENSIONS = ["glb", "gltf"] as const;

export const PRODUCT_FILE_ACCEPT = PRODUCT_FILE_EXTENSIONS.map((ext) => `.${ext}`).join(",");
export const PREVIEW_FILE_ACCEPT = PREVIEW_FILE_EXTENSIONS.map((ext) => `.${ext}`).join(",");

export function extensionOf(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

export function isSupportedProductFile(fileName: string) {
  return (PRODUCT_FILE_EXTENSIONS as readonly string[]).includes(extensionOf(fileName));
}
