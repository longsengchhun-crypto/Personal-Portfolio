"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Dialog from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Check, ChevronDown, Circle, ExternalLink, Film, ImagePlus, Trash2, X } from "@/components/ui/Icon";
import Picture from "@/components/ui/Picture";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { adminJson } from "@/lib/adminApi";
import { mediaUrl } from "@/lib/supabase";
import type { Category, DashboardPortfolioProject, GalleryItem } from "@/lib/types";
import GalleryManager from "./GalleryManager";
import MediaUploader from "./MediaUploader";

type FormState = {
  title: string; slug: string; category_id: number | null; year: string; short_description: string; project_type: string;
  cover_image: string; cover_video_url: string; video_file: string; client: string; role: string; project_duration: string; software_used: string;
  introduction: string; objective: string; creative_approach: string; process: string; final_result: string;
  embedded_video_url: string; before_image: string; after_image: string; credits: string;
  is_featured: boolean; status: "draft" | "published"; order: number;
};

function initialState(project: DashboardPortfolioProject | null, categories: Category[]): FormState {
  return {
    title: project?.title || "", slug: project?.slug || "", category_id: project?.category_id ?? categories[0]?.id ?? null,
    year: project ? String(project.year) : String(new Date().getFullYear()), short_description: project?.short_description || "", project_type: project?.project_type || "",
    cover_image: project?.cover_image || "", cover_video_url: project?.cover_video_url || "", video_file: project?.video_file || "",
    client: project?.client || "", role: project?.role || "", project_duration: project?.project_duration || "", software_used: project?.software_used || "",
    introduction: project?.introduction || "", objective: project?.objective || "", creative_approach: project?.creative_approach || "",
    process: project?.process || "", final_result: project?.final_result || "", embedded_video_url: project?.embedded_video_url || "",
    before_image: project?.before_image || "", after_image: project?.after_image || "", credits: project?.credits || "",
    is_featured: project?.is_featured || false, status: project?.status || "draft", order: project?.order || 0,
  };
}

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const UPLOAD_URL = "/api/dashboard/portfolio/media-upload-url/";
const SECTIONS = [["basics", "Basics"], ["media", "Media"], ["story", "Story"], ["details", "Details"], ["advanced", "Advanced"]] as const;
const AUTOSAVE_MS = 1600;

type SaveState = "idle" | "saving" | "saved" | "error";

export default function ProjectEditor({ project, categories }: { project: DashboardPortfolioProject | null; categories: Category[] }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(() => initialState(project, categories));
  const [projectId, setProjectId] = useState<number | null>(project?.id ?? null);
  const [gallery, setGallery] = useState<GalleryItem[]>(project?.gallery_items || []);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [fetchingLink, setFetchingLink] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("basics");
  const snapshot = useRef(JSON.stringify(form));
  const [version, setVersion] = useState(0);
  const saving = useRef(false);
  const failedSnapshot = useRef<string | null>(null);
  const formRef = useRef(form);
  formRef.current = form;

  const dirty = useMemo(() => JSON.stringify(form) !== snapshot.current, [form, version]);
  const isNew = projectId === null;
  const published = form.status === "published";

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const bind = (key: keyof FormState) => ({
    value: form[key] as string,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(key, event.target.value as never),
  });

  const save = useCallback(async (options: { status?: "draft" | "published"; silent?: boolean } = {}) => {
    const current = formRef.current;
    if (saving.current) return false;
    if (!current.title.trim()) { setError("Give the project a title before saving."); setSaveState("error"); return false; }
    if (!current.category_id) { setError("Choose a category. If the list is empty, add one from the Projects page first."); setSaveState("error"); return false; }
    saving.current = true;
    setSaveState("saving");
    setError("");
    const payload = { ...current, status: options.status || current.status, id: projectId, year: Number(current.year) || new Date().getFullYear() };
    const sent = JSON.stringify({ ...current, status: payload.status });
    const res = await adminJson<{ id: number }>("/api/dashboard/portfolio/", payload);
    saving.current = false;
    if (!res.ok) { failedSnapshot.current = JSON.stringify(current); setSaveState("error"); setError(res.error); return false; }
    failedSnapshot.current = null;
    // The snapshot is what was sent, so edits made while saving stay marked as unsaved.
    snapshot.current = sent;
    setVersion((value) => value + 1);
    if (options.status) setForm((prev) => ({ ...prev, status: options.status! }));
    setSaveState("saved");
    setSavedAt(new Date());
    if (!projectId) { setProjectId(res.data.id); router.replace(`/dashboard/projects/${res.data.id}/`); }
    if (!options.silent) toast({ title: options.status === "published" ? "Published" : options.status === "draft" && published ? "Moved back to drafts" : "Saved" });
    return true;
  }, [projectId, router, toast, published]);

  // Drafts autosave. A published project never changes on the live site until it is saved on purpose.
  useEffect(() => {
    if (!projectId || published || !dirty || saveState === "saving" || failedSnapshot.current === JSON.stringify(form)) return;
    const timer = window.setTimeout(() => { void save({ silent: true }); }, AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [form, projectId, published, dirty, saveState, save]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (JSON.stringify(formRef.current) !== snapshot.current) { event.preventDefault(); event.returnValue = ""; } };
    const onKey = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") { event.preventDefault(); void save(); } };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("beforeunload", warn); document.removeEventListener("keydown", onKey); };
  }, [save]);

  useEffect(() => {
    const targets = SECTIONS.map(([id]) => document.getElementById(`sec-${id}`)).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setActiveSection(visible.target.id.replace("sec-", ""));
    }, { rootMargin: "-20% 0px -65% 0px" });
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  async function fetchLink() {
    setFetchingLink(true);
    const res = await adminJson<{ canonicalUrl: string; title: string; thumbnailPath: string }>("/api/dashboard/video-link/", { url: form.embedded_video_url });
    setFetchingLink(false);
    if (!res.ok) { toast({ tone: "error", title: "That link can't be used", message: res.error }); return; }
    setForm((prev) => ({ ...prev, embedded_video_url: res.data.canonicalUrl, cover_image: prev.cover_image || res.data.thumbnailPath, title: prev.title.trim() ? prev.title : res.data.title }));
    toast({ title: "Video link ready", message: res.data.thumbnailPath ? "Thumbnail and title were filled in where empty." : "Add a cover image, since no thumbnail could be fetched." });
  }

  async function remove() {
    if (!projectId) return;
    const res = await adminJson("/api/dashboard/portfolio/", { action: "delete", id: projectId });
    if (!res.ok) { toast({ tone: "error", title: "Could not delete the project", message: res.error }); return; }
    snapshot.current = JSON.stringify(form);
    toast({ title: "Project deleted" });
    router.push("/dashboard/projects/");
    router.refresh();
  }

  const checklist = [
    { ok: Boolean(form.title.trim()), label: "Title" },
    { ok: Boolean(form.category_id), label: "Category" },
    { ok: Boolean(form.cover_image || form.video_file), label: "Cover image or video" },
    { ok: form.short_description.trim().length >= 20, label: "Short description" },
  ];
  const ready = checklist.every((item) => item.ok);
  const stateLabel = saveState === "saving" ? "Saving…" : dirty ? (published || isNew ? "Unsaved changes" : "Unsaved, autosaving…") : saveState === "saved" && savedAt ? `Saved ${savedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : isNew ? "Not saved yet" : "All changes saved";
  const stateTone = saveState === "error" ? "error" : saveState === "saving" ? "saving" : dirty ? "dirty" : "saved";

  return <div className="ed">
    <header className="ed-bar glass">
      <Link href="/dashboard/projects/" className="btn btn--ghost btn--icon btn--sm" aria-label="Back to projects"><ArrowLeft /></Link>
      <div className="ed-bar__title"><h1>{form.title.trim() || "Untitled project"}</h1><StatusBadge kind="project" status={form.status} /></div>
      <span className={`ed-state ed-state--${stateTone}`} role="status" aria-live="polite"><i aria-hidden="true" />{stateLabel}</span>
      <div className="ed-bar__actions">
        {isNew
          ? <Button variant="primary" size="sm" state={saveState === "saving" ? "loading" : undefined} onClick={() => save()}>Create draft</Button>
          : <>
            <Button variant="glass" size="sm" disabled={!dirty || saveState === "saving"} onClick={() => save()}>{published ? "Save changes" : "Save"}</Button>
            {published
              ? <Button variant="ghost" size="sm" onClick={() => save({ status: "draft" })}>Unpublish</Button>
              : <Button variant="primary" size="sm" disabled={saveState === "saving"} onClick={() => save({ status: "published" })}>Publish</Button>}
          </>}
      </div>
    </header>

    {error && <div className="notice notice--error" role="alert"><span>{error}</span></div>}

    <div className="ed-grid">
      <nav className="ed-nav" aria-label="Sections">
        {SECTIONS.map(([id, label]) => <a key={id} href={`#sec-${id}`} aria-current={activeSection === id ? "true" : undefined}>{label}</a>)}
      </nav>

      <div className="ed-main">
        <section id="sec-basics" className="adm-card ed-section" aria-labelledby="h-basics">
          <h2 id="h-basics">Basics</h2>
          <div className="adm-form">
            <div className="field adm-form__wide"><label htmlFor="title">Title</label><input id="title" className="input" {...bind("title")} onBlur={() => { if (!form.slug) set("slug", slugify(form.title)); }} placeholder="Project name" required /></div>
            <div className="field"><label htmlFor="category">Category</label>
              <select id="category" className="select" value={form.category_id ?? ""} onChange={(event) => set("category_id", event.target.value ? Number(event.target.value) : null)}>
                {categories.length === 0 && <option value="">Add a category first</option>}
                {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="featured-toggle">Homepage</label><label className="switch" id="featured-toggle"><input type="checkbox" checked={form.is_featured} onChange={(event) => set("is_featured", event.target.checked)} /> Feature on the homepage</label></div>
            <div className="field adm-form__wide"><label htmlFor="short">Short description</label><textarea id="short" className="textarea" rows={3} maxLength={420} {...bind("short_description")} placeholder="One or two sentences. This appears under the title and in search results." /><span className="field__hint tabular">{form.short_description.length} / 420</span></div>
          </div>
        </section>

        <section id="sec-media" className="adm-card ed-section" aria-labelledby="h-media">
          <h2 id="h-media">Media</h2>
          <div className="ed-media">
            <div className="field"><span className="field__label">Cover image</span>
              <div className="ed-cover">
                {form.cover_image
                  ? <div className="ed-cover__preview"><Picture src={form.cover_image} alt="Cover preview" fill sizes="360px" quality={75} /><button type="button" className="btn btn--glass btn--icon btn--sm ed-cover__remove" aria-label="Remove cover image" onClick={() => set("cover_image", "")}><X /></button></div>
                  : <div className="ed-cover__preview ed-cover__preview--empty"><ImagePlus aria-hidden="true" /><span>No cover image</span></div>}
                <MediaUploader kind="image" compact accept="image/jpeg,image/png,image/webp" label={form.cover_image ? "Replace cover" : "Upload cover"} uploadUrl={UPLOAD_URL} onUploaded={(result) => set("cover_image", result.path)} />
              </div>
              <span className="field__hint">Shown on the Work grid and at the top of the project page.</span>
            </div>
            <div className="field"><span className="field__label">Cover video <span className="caption">(optional)</span></span>
              <div className="ed-cover">
                {form.video_file
                  ? <div className="ed-cover__preview"><video src={mediaUrl(form.video_file)} poster={form.cover_image ? mediaUrl(form.cover_image, { width: 480 }) : undefined} controls preload="none" /><button type="button" className="btn btn--glass btn--icon btn--sm ed-cover__remove" aria-label="Remove cover video" onClick={() => set("video_file", "")}><X /></button></div>
                  : <div className="ed-cover__preview ed-cover__preview--empty"><Film aria-hidden="true" /><span>No video</span></div>}
                <MediaUploader kind="video" compact accept="video/mp4" label={form.video_file ? "Replace video" : "Upload video"} uploadUrl={UPLOAD_URL} onUploaded={(result) => set("video_file", result.path)} />
              </div>
              <span className="field__hint">Plays on the project page, and as a hover preview on the Work grid.</span>
            </div>
          </div>
          <div className="ed-videolink">
            <div className="field"><label htmlFor="videolink">Video link</label>
              <div className="ed-videolink__row"><input id="videolink" className="input" value={form.embedded_video_url} onChange={(event) => set("embedded_video_url", event.target.value)} placeholder="Paste a TikTok, YouTube or Vimeo link" /><Button variant="glass" disabled={!form.embedded_video_url.trim() || fetchingLink} state={fetchingLink ? "loading" : undefined} onClick={fetchLink}>Fetch</Button></div>
              <span className="field__hint">Plays on the project page in full quality, straight from the source. Fetch fills in the thumbnail and title if they are empty.</span></div>
          </div>
          <div className="ed-gallery">
            <h3>Gallery</h3>
            <p className="field__hint">Stills and supporting frames on the project page. Drag to reorder.</p>
            <GalleryManager projectId={projectId} items={gallery} onChange={setGallery} disabledMessage="Create the draft first (top right), then add gallery images." />
          </div>
        </section>

        <section id="sec-story" className="adm-card ed-section" aria-labelledby="h-story">
          <h2 id="h-story">Story</h2>
          <p className="adm-hint">Each filled-in part becomes a section on the project page. Leave any blank to skip it.</p>
          <div className="adm-form">
            {([["introduction", "Introduction"], ["objective", "Objective"], ["creative_approach", "Creative approach"], ["process", "Process"], ["final_result", "Final result"], ["credits", "Credits"]] as const).map(([key, label]) => <div className="field adm-form__wide" key={key}><label htmlFor={key}>{label}</label><textarea id={key} className="textarea" rows={key === "credits" ? 3 : 4} {...bind(key)} /></div>)}
          </div>
        </section>

        <section id="sec-details" className="adm-card ed-section" aria-labelledby="h-details">
          <h2 id="h-details">Details</h2>
          <div className="adm-form">
            <div className="field"><label htmlFor="client">Client</label><input id="client" className="input" {...bind("client")} /></div>
            <div className="field"><label htmlFor="role">Role</label><input id="role" className="input" {...bind("role")} placeholder="Director, Editor, VFX" /></div>
            <div className="field"><label htmlFor="duration">Duration</label><input id="duration" className="input" value={form.project_duration} onChange={(event) => set("project_duration", event.target.value)} placeholder="e.g. 2 weeks" /></div>
            <div className="field"><label htmlFor="software">Software</label><input id="software" className="input" value={form.software_used} onChange={(event) => set("software_used", event.target.value)} placeholder="After Effects, Blender" /></div>
            <div className="field"><label htmlFor="type">Project type</label><input id="type" className="input" value={form.project_type} onChange={(event) => set("project_type", event.target.value)} placeholder="Poster design, Showreel…" /></div>
            <div className="field"><label htmlFor="year">Year</label><input id="year" className="input" type="number" {...bind("year")} /></div>
          </div>
        </section>

        <section id="sec-advanced" className="adm-card ed-section" aria-labelledby="h-advanced">
          <details className="disclosure disclosure--bare">
            <summary><span id="h-advanced" className="ed-section__summary">Advanced <span className="caption">URL, order, embedded video, before and after</span></span><ChevronDown aria-hidden="true" /></summary>
            <div className="disclosure__body">
              <div className="adm-form">
                <div className="field"><label htmlFor="slug">Web address</label><div className="ed-slug"><span className="caption">/portfolio/</span><input id="slug" className="input" {...bind("slug")} placeholder="made-from-the-title" /></div><span className="field__hint">Changing this breaks links people already have to a published project.</span></div>
                <div className="field"><label htmlFor="order">Position on the site</label><input id="order" className="input" type="number" min={0} value={form.order} onChange={(event) => set("order", Number(event.target.value) || 0)} /><span className="field__hint">Lower numbers come first.</span></div>
                <div className="field"><span className="field__label">Before image</span>{form.before_image && <div className="ed-thumb"><Picture src={form.before_image} alt="Before" fill sizes="240px" /><button type="button" className="btn btn--glass btn--icon btn--sm ed-cover__remove" aria-label="Remove before image" onClick={() => set("before_image", "")}><X /></button></div>}<MediaUploader kind="image" compact accept="image/jpeg,image/png,image/webp" label={form.before_image ? "Replace" : "Upload before image"} uploadUrl={UPLOAD_URL} onUploaded={(result) => set("before_image", result.path)} /></div>
                <div className="field"><span className="field__label">After image</span>{form.after_image && <div className="ed-thumb"><Picture src={form.after_image} alt="After" fill sizes="240px" /><button type="button" className="btn btn--glass btn--icon btn--sm ed-cover__remove" aria-label="Remove after image" onClick={() => set("after_image", "")}><X /></button></div>}<MediaUploader kind="image" compact accept="image/jpeg,image/png,image/webp" label={form.after_image ? "Replace" : "Upload after image"} uploadUrl={UPLOAD_URL} onUploaded={(result) => set("after_image", result.path)} /></div>
              </div>
            </div>
          </details>
        </section>
      </div>

      <aside className="ed-side" aria-label="Project status">
        <div className="adm-card">
          <h2 className="meta">{published ? "Page checklist" : "Ready to publish?"}</h2>
          <ul className="ed-check">{checklist.map((item) => <li key={item.label} className={item.ok ? "is-ok" : ""}>{item.ok ? <Check aria-hidden="true" /> : <Circle aria-hidden="true" />}{item.label}</li>)}</ul>
          {!isNew && !published && !ready && <p className="caption">You can still publish, but the page will look thin until these are filled in.</p>}
          {published && form.slug && <a className="btn btn--glass btn--sm btn--block" href={`/portfolio/${form.slug}/`} target="_blank" rel="noreferrer"><ExternalLink /> View live page</a>}
        </div>
        {!isNew && <div className="adm-card">
          <h2 className="meta">Visibility</h2>
          <p className="caption">{published ? "This project is live. Edits go live when you press Save changes." : "This project is a draft, hidden from visitors. Edits autosave."}</p>
        </div>}
        {!isNew && <div className="adm-card ed-danger">
          <h2 className="meta">Danger zone</h2>
          <Button variant="danger" size="sm" block onClick={() => setConfirmDelete(true)}><Trash2 /> Delete project</Button>
        </div>}
      </aside>
    </div>

    <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} title={`Delete “${form.title || "this project"}”?`} role="alertdialog"
      actions={<><Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button><Button variant="danger" onClick={remove}>Delete project</Button></>}>
      <p>This permanently removes the project and its gallery entries. Uploaded files stay in the media library. To hide it without deleting, unpublish it instead.</p>
    </Dialog>
  </div>;
}
