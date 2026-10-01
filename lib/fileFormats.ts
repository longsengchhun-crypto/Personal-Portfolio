export function extensionOf(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() || "";
}
