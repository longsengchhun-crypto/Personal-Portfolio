"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Dialog from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { Copy, ExternalLink, Film, Images, Search, Trash2 } from "@/components/ui/Icon";
import Picture from "@/components/ui/Picture";
import { useToast } from "@/components/ui/Toast";
import { adminJson, formatBytes } from "@/lib/adminApi";
import type { MediaFile } from "@/lib/media";
import { mediaUrl } from "@/lib/supabase";
import MediaUploader from "./MediaUploader";

type Filter = "all" | "image" | "video" | "unused";
const date = (value: string) => (value ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)) : "");

export default function MediaLibrary({ files }: { files: MediaFile[] }) {
  const router = useRouter();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<MediaFile | null>(null);
  const [confirm, setConfirm] = useState<MediaFile | null>(null);
  const [busy, setBusy] = useState(false);

  const counts = useMemo(() => ({ all: files.length, image: files.filter((f) => f.kind === "image").length, video: files.filter((f) => f.kind === "video").length, unused: files.filter((f) => f.uses.length === 0).length }), [files]);
  const visible = useMemo(() => files.filter((file) => (filter === "all" || (filter === "unused" ? file.uses.length === 0 : file.kind === filter)) && (!query.trim() || file.name.toLowerCase().includes(query.trim().toLowerCase()) || file.uses.some((use) => use.label.toLowerCase().includes(query.trim().toLowerCase())))), [files, filter, query]);
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

  async function copyLink(file: MediaFile) {
    const url = mediaUrl(file.path);
    try { await navigator.clipboard.writeText(url); toast({ title: "Link copied" }); } catch { toast({ tone: "error", title: "Could not copy", message: url }); }
  }

  async function remove(file: MediaFile) {
    setBusy(true);
    const res = await adminJson("/api/dashboard/media/", { action: "delete", path: file.path });
    setBusy(false);
    setConfirm(null);
    if (!res.ok) { toast({ tone: "error", title: "Could not delete the file", message: res.error }); return; }
    setOpen(null);
    toast({ title: "File deleted" });
    router.refresh();
  }

  return <>
    <section className="adm-card" aria-labelledby="upload-heading">
      <h2 id="upload-heading" className="sr-only">Upload media</h2>
      <MediaUploader kind="image" multiple accept="image/jpeg,image/png,image/webp,video/mp4" label="Drop images or videos to upload" uploadUrl="/api/dashboard/portfolio/media-upload-url/" onUploaded={() => router.refresh()} />
    </section>

    {files.length === 0
      ? <EmptyState icon={<Images />} title="No media yet">Upload images and videos above. Once you attach them to projects, you'll see where each one is used.</EmptyState>
      : <>
        <div className="adm-toolbar glass">
          <div className="adm-toolbar__chips" role="group" aria-label="Filter media">
            {([["all", "All"], ["image", "Images"], ["video", "Videos"], ["unused", "Unused"]] as const).map(([value, label]) => <button key={value} type="button" className="chip" aria-pressed={filter === value} onClick={() => setFilter(value)}>{label} <span className="chip__count">{counts[value]}</span></button>)}
          </div>
          <div className="adm-toolbar__controls"><div className="adm-searchbox"><Search aria-hidden="true" /><input className="input input--sm" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or project" aria-label="Search media" /></div></div>
        </div>
        <p className="caption adm-subbar" role="status">{visible.length} file{visible.length === 1 ? "" : "s"} · {formatBytes(totalBytes)} in library</p>

        {visible.length === 0
          ? <EmptyState icon={<Search />} title="No files match" action={<Button variant="glass" onClick={() => { setFilter("all"); setQuery(""); }}>Clear filters</Button>}>Try a different filter or search.</EmptyState>
          : <ul className="mlib">{visible.map((file) => <li key={file.path}>
            <button type="button" className="mlib__card" onClick={() => setOpen(file)} aria-label={`Open ${file.name}`}>
              <span className="mlib__thumb">{file.kind === "image" ? <Picture src={file.path} alt="" fill sizes="240px" quality={75} /> : <video src={`${mediaUrl(file.path)}#t=0.5`} preload="metadata" muted playsInline tabIndex={-1} aria-hidden="true" />}
                {file.kind === "video" && <span className="pcard__flag"><Film aria-hidden="true" /> Video</span>}
              </span>
              <span className="mlib__meta"><strong>{file.uses[0]?.label ?? (file.kind === "video" ? "Unused video" : "Unused image")}</strong><small>{file.name.split(".").pop()?.toUpperCase()} · {formatBytes(file.size)} · {date(file.createdAt)}</small></span>
              <span className={`badge badge--plain ${file.uses.length ? "badge--live" : "badge--draft"}`}>{file.uses.length ? `Used in ${file.uses.length}` : "Unused"}</span>
            </button>
          </li>)}</ul>}
      </>}

    <Dialog open={open !== null} onClose={() => setOpen(null)} title={open?.name ?? "File"} wide hideTitle
      actions={open && <>
        <Button variant="ghost" onClick={() => copyLink(open)}><Copy /> Copy link</Button>
        <a className="btn btn--glass" href={mediaUrl(open.path)} target="_blank" rel="noreferrer"><ExternalLink /> Open</a>
        <Button variant="danger" disabled={open.uses.length > 0} title={open.uses.length ? "Remove it from the projects using it first" : undefined} onClick={() => setConfirm(open)}><Trash2 /> Delete</Button>
      </>}>
      {open && <div className="mlib__detail">
        <div className="mlib__preview">{open.kind === "image" ? <Picture src={open.path} alt={open.name} fill sizes="720px" quality={80} /> : <video src={mediaUrl(open.path)} controls playsInline preload="metadata" />}</div>
        <dl className="adm-facts">
          <div><dt>File</dt><dd>{open.name}</dd></div>
          <div><dt>Size</dt><dd>{formatBytes(open.size)}</dd></div>
          <div><dt>Uploaded</dt><dd>{date(open.createdAt) || "Unknown"}</dd></div>
          <div><dt>Used in</dt><dd>{open.uses.length ? <ul className="adm-links">{open.uses.map((use) => <li key={use.label}><Link href={use.href}>{use.label}</Link></li>)}</ul> : "Nowhere yet. Safe to delete."}</dd></div>
        </dl>
      </div>}
    </Dialog>

    <Dialog open={confirm !== null} onClose={() => setConfirm(null)} title="Delete this file?" role="alertdialog"
      actions={<><Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button><Button variant="danger" state={busy ? "loading" : undefined} onClick={() => confirm && remove(confirm)}>Delete file</Button></>}>
      <p>“{confirm?.name}” will be permanently removed from storage. This can't be undone.</p>
    </Dialog>
  </>;
}
