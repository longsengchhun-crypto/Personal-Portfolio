"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Dialog from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, CheckCircle2, Film, Loader2 } from "@/components/ui/Icon";
import { adminJson } from "@/lib/adminApi";
import type { Category } from "@/lib/types";

type Row = { url: string; state: "waiting" | "working" | "done" | "error"; message: string };

const YEARS = Array.from({ length: new Date().getFullYear() - 2017 }, (_, i) => new Date().getFullYear() - i);

// Paste video links (TikTok, YouTube, Vimeo), one per line. Each becomes its own project in the chosen
// category, with the title and thumbnail fetched automatically and the video played by the official player.
export default function VideoImport({ open, onClose, categories }: { open: boolean; onClose: () => void; categories: Category[] }) {
  const router = useRouter();
  const preferred = categories.find((c) => c.slug === "2d-animation") ?? categories[0];
  const [text, setText] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">(preferred?.id ?? "");
  const [year, setYear] = useState(2023);
  const [publish, setPublish] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);

  const links = [...new Set(text.split(/\s+/).map((part) => part.trim()).filter((part) => /^https?:\/\//i.test(part)))];

  async function run() {
    if (!links.length || !categoryId) return;
    setRunning(true);
    setRows(links.map((url) => ({ url, state: "waiting", message: "" })));
    const patch = (index: number, changes: Partial<Row>) => setRows((current) => current.map((row, i) => (i === index ? { ...row, ...changes } : row)));
    for (let i = 0; i < links.length; i++) {
      patch(i, { state: "working" });
      const res = await adminJson<{ title: string; thumbnail: boolean }>("/api/dashboard/video-link/", { url: links[i], create: { category_id: categoryId, year, publish } });
      if (res.ok) patch(i, { state: "done", message: `${res.data.title}${res.data.thumbnail ? "" : " (no thumbnail found, add a cover later)"}` });
      else patch(i, { state: "error", message: res.error });
    }
    setRunning(false);
    router.refresh();
  }

  const finished = rows.length > 0 && !running;
  const done = rows.filter((row) => row.state === "done").length;
  const close = () => { if (running) return; setText(""); setRows([]); onClose(); };

  return <Dialog open={open} onClose={close} title="Import videos from links" wide dismissible={!running}
    actions={<>
      <Button variant="ghost" onClick={close} disabled={running}>{finished ? "Close" : "Cancel"}</Button>
      {!finished && <Button variant="primary" disabled={!links.length || !categoryId || running} state={running ? "loading" : undefined} onClick={run}>Import {links.length || ""} video{links.length === 1 ? "" : "s"}</Button>}
    </>}>
    {rows.length === 0 ? <>
      <p className="adm-hint">Paste links to your videos, one per line. TikTok, YouTube and Vimeo links work. Each plays on your site through the official player, so it stays at full quality without re-uploading. For the smoothest full-HD playback, open the project afterwards and upload your original MP4 as its Cover video; the file then replaces the link.</p>
      <div className="field adm-gap"><label htmlFor="vi-links">Video links</label><textarea id="vi-links" className="textarea" rows={7} value={text} onChange={(event) => setText(event.target.value)} placeholder={"https://www.tiktok.com/@sengchhun230122/video/…\nhttps://www.tiktok.com/@sengchhun230122/video/…"} data-autofocus /><span className="field__hint">{links.length ? `${links.length} link${links.length === 1 ? "" : "s"} ready` : "On TikTok: open a video, press Share, then Copy link."}</span></div>
      <div className="adm-form-row">
        <div className="field"><label htmlFor="vi-category">Category</label><select id="vi-category" className="select" value={categoryId} onChange={(event) => setCategoryId(event.target.value ? Number(event.target.value) : "")}>{categories.map((c) => <option value={c.id} key={c.id}>{c.name}</option>)}</select></div>
        <div className="field"><label htmlFor="vi-year">Year</label><select id="vi-year" className="select" value={year} onChange={(event) => setYear(Number(event.target.value))}>{YEARS.map((y) => <option key={y}>{y}</option>)}</select></div>
        <label className="switch"><input type="checkbox" checked={publish} onChange={(event) => setPublish(event.target.checked)} /> Publish immediately</label>
      </div>
    </> : <>
      <p className="caption" role="status">{running ? "Importing, please keep this window open…" : `${done} of ${rows.length} imported.`}</p>
      <ul className="vi-list">{rows.map((row) => <li key={row.url} className={`vi-item vi-item--${row.state}`}>
        <span className="vi-item__icon" aria-hidden="true">{row.state === "working" ? <Loader2 className="spin" /> : row.state === "done" ? <CheckCircle2 /> : row.state === "error" ? <AlertTriangle /> : <Film />}</span>
        <span className="vi-item__text"><strong>{row.message && row.state === "done" ? row.message : row.url.replace(/^https?:\/\/(www\.)?/, "")}</strong>{row.state === "error" && <small>{row.message}</small>}</span>
      </li>)}</ul>
    </>}
  </Dialog>;
}
