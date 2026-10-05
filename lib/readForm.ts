import type { NextRequest } from "next/server";

/** Reads a submitted form, or an empty one if the body is missing or not a form, so a bad request gets a normal error instead of a 500. */
export async function readForm(request: NextRequest): Promise<FormData> {
  try {
    return await request.formData();
  } catch {
    return new FormData();
  }
}
