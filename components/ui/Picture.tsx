"use client";

import Image, { type ImageLoaderProps } from "next/image";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Storage paths are served through Supabase's image renderer so each viewport gets a right-sized
// file; absolute URLs are passed through untouched.
function storageLoader({ src, width, quality }: ImageLoaderProps) {
  if (/^https?:\/\//i.test(src)) return src;
  const path = src.replace(/^\//, "");
  if (!SUPABASE_URL) return `/media/${path}`;
  const params = new URLSearchParams({ width: String(width), quality: String(quality ?? 78), resize: "contain" });
  return `${SUPABASE_URL}/storage/v1/render/image/public/portfolio-media/${path}?${params}`;
}

type Props = {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  quality?: number;
  /** Fill the (positioned) parent. Otherwise width/height must be given. */
  fill?: boolean;
  width?: number;
  height?: number;
  onLoad?: () => void;
};

export default function Picture({ src, alt, sizes = "100vw", priority, className, quality, fill, width, height, onLoad }: Props) {
  if (!src) return null;
  const local = src.startsWith("/");
  const common = { alt, sizes, priority, className, quality, onLoad, ...(local ? {} : { loader: storageLoader }) };
  if (fill || !width || !height) return <Image src={src} fill {...common} />;
  return <Image src={src} width={width} height={height} {...common} />;
}
