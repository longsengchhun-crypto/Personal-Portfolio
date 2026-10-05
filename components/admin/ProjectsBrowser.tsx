"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Dialog from "@/components/ui/Dialog";
import { Button, LinkButton } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { Copy, ExternalLink, Film, FolderKanban, ImagePlus, MoreHorizontal, Pencil, Plus, Search, Star, Trash2, Eye, EyeOff } from "@/components/ui/Icon";
import Picture from "@/components/ui/Picture";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { adminJson } from "@/lib/adminApi";
import type { Category, Project } from "@/lib/types";
import CategoryManager from "./CategoryManager";
import QuickUpload from "./QuickUpload";

type StatusFilter = "all" | "published" | "draft" | "featured";
type Sort = "manual" | "updated" | "year" | "title";

const API = "/api/dashboard/portfolio/";

export default function ProjectsBrowser({ projects, categories }: { projects: Project[]; categories: Category[] }) {
  const router = useRouter();
  const toast = useToast();
  const params = useSearchParams();
  const initial = params.get("status");
  const [status, setStatus] = useState<StatusFilter>(initial === "published" || initial === "draft" || initial === "featured" ? initial : "all");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<Sort>("manual");
  const [menu, setMenu] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [quick, setQuick] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (menu === null) return;
    const close = (event: Event) => { if (!menuRef.current?.contains(event.target as Node)) setMenu(null); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setMenu(null); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", onKey); };
  }, [menu]);

  const counts = useMemo(() => ({
    all: projects.length,
    published: projects.filter((p) => p.status === "published").length,
    draft: projects.filter((p) => p.status === "draft").length,
    featured: projects.filter((p) => p.is_featured).length,
  }), [projects]);
  const perCategory = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, projects.filter((p) => p.category_id === c.id).length])), [projects, categories]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = projects.filter((p) =>
      (status === "all" || (status === "featured" ? p.is_featured : p.status === status)) &&
      (!category || String(p.category_id) === category) &&
      (!q || `${p.title} ${p.project_type} ${p.client}`.toLowerCase().includes(q)));
    const sorted = [...list];
    if (sort === "updated") sorted.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    else if (sort === "year") sorted.sort((a, b) => b.year - a.year || a.order - b.order);
    else if (sort === "title") sorted.sort((a, b) => a.title.localeCompare(b.title));
    return sorted;
  }, [projects, status, category, query, sort]);

  const categoryName = (id: number) => categories.find((c) => c.id === id)?.name || "Uncategorised";

  async function update(project: Project, patch: Partial<Project>, success?: { title: string; undo?: Partial<Project> }) {
    setBusy(project.id);
    const res = await adminJson(API, { ...project, ...patch });
    setBusy(null);
    if (!res.ok) { toast({ tone: "error", title: "Could not update the project", message: res.error }); return; }
    router.refresh();
    if (success) toast({ title: success.title, action: success.undo ? { label: "Undo", run: () => { void update({ ...project, ...patch }, success.undo!); } } : undefined });
  }

  async function duplicate(project: Project) {
    setBusy(project.id);
    const res = await adminJson<{ id: number }>(API, { action: "duplicate", id: project.id });
    setBusy(null);
    if (!res.ok) { toast({ tone: "error", title: "Could not duplicate the project", message: res.error }); return; }
    router.refresh();
    toast({ title: "Duplicated as a draft", action: { label: "Open", run: () => router.push(`/dashboard/projects/${res.data.id}/`) } });
  }

  async function remove(project: Project) {
    setBusy(project.id);
    const res = await adminJson(API, { action: "delete", id: project.id });
    setBusy(null);
    setPendingDelete(null);
    if (!res.ok) { toast({ tone: "error", title: "Could not delete the project", message: res.error }); return; }
    router.refresh();
    toast({ title: `Deleted “${project.title}”` });
  }

  if (projects.length === 0) {
    return <>
      <EmptyState icon={<FolderKanban />} title="No projects yet" action={<div className="adm-inline"><LinkButton href="/dashboard/projects/new/" variant="primary"><Plus /> Create project</LinkButton><Button variant="glass" onClick={() => setQuick(true)}><ImagePlus /> Quick add from files</Button></div>}>
        Create your first project to begin building your portfolio, or drop a batch of posters and reels to start fast.
      </EmptyState>
      <QuickUpload open={quick} onClose={() => setQuick(false)} categories={categories} />
    </>;
  }

  return <>
    <div className="adm-toolbar glass">
      <div className="adm-toolbar__chips" role="group" aria-label="Filter by status">
        {([["all", "All"], ["published", "Published"], ["draft", "Drafts"], ["featured", "Featured"]] as const).map(([value, label]) => <button key={value} type="button" className="chip" aria-pressed={status === value} onClick={() => setStatus(value)}>{label} <span className="chip__count">{counts[value]}</span></button>)}
      </div>
      <div className="adm-toolbar__controls">
        <div className="adm-searchbox"><Search aria-hidden="true" /><input className="input input--sm" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects" aria-label="Search projects" /></div>
        <select className="select select--sm" value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category"><option value="">All categories</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select className="select select--sm" value={sort} onChange={(event) => setSort(event.target.value as Sort)} aria-label="Sort projects"><option value="manual">Site order</option><option value="updated">Recently updated</option><option value="year">Newest year</option><option value="title">Title A–Z</option></select>
      </div>
    </div>

    <div className="adm-subbar">
      <p className="caption" role="status">{visible.length} of {projects.length} project{projects.length === 1 ? "" : "s"}</p>
      <div className="adm-inline"><Button size="sm" variant="ghost" onClick={() => setCategoriesOpen(true)}>Categories</Button><Button size="sm" variant="ghost" onClick={() => setQuick(true)}><ImagePlus /> Quick add</Button></div>
    </div>

    {visible.length === 0
      ? <EmptyState icon={<Search />} title="No projects match" action={<Button variant="glass" onClick={() => { setQuery(""); setStatus("all"); setCategory(""); }}>Clear filters</Button>}>Try a different search or filter.</EmptyState>
      : <ul className="adm-pgrid">{visible.map((project) => <li key={project.id} className={`pcard${busy === project.id ? " is-busy" : ""}`}>
        <Link href={`/dashboard/projects/${project.id}/`} className="pcard__media" aria-label={`Edit ${project.title}`}>
          {project.cover_image ? <Picture src={project.cover_image} alt="" fill sizes="(min-width: 1280px) 22vw, (min-width: 760px) 30vw, 90vw" quality={75} /> : <span className="pcard__blank">{project.video_file ? <Film aria-hidden="true" /> : <ImagePlus aria-hidden="true" />}<small>{project.video_file ? "Video project" : "No cover yet"}</small></span>}
          {project.video_file && <span className="pcard__flag"><Film aria-hidden="true" /> Video</span>}
        </Link>
        <div className="pcard__body">
          <div className="pcard__text">
            <Link href={`/dashboard/projects/${project.id}/`} className="pcard__title">{project.title}</Link>
            <span className="caption">{categoryName(project.category_id)} · {project.year}</span>
          </div>
          <div className="pcard__row">
            <StatusBadge kind="project" status={project.status} />
            <div className="pcard__actions">
              <button type="button" className={`btn btn--ghost btn--icon btn--sm${project.is_featured ? " is-featured" : ""}`} aria-pressed={project.is_featured} aria-label={project.is_featured ? `Remove ${project.title} from featured` : `Feature ${project.title}`} title={project.is_featured ? "Featured on the homepage" : "Feature on the homepage"} disabled={busy === project.id} onClick={() => update(project, { is_featured: !project.is_featured }, { title: project.is_featured ? "Removed from featured" : "Featured on the homepage", undo: { is_featured: project.is_featured } })}><Star /></button>
              <div className="pcard__menu" ref={menu === project.id ? menuRef : undefined}>
                <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-haspopup="menu" aria-expanded={menu === project.id} aria-label={`More actions for ${project.title}`} onClick={() => setMenu(menu === project.id ? null : project.id)}><MoreHorizontal /></button>
                {menu === project.id && <div className="menu glass glass--strong" role="menu">
                  <Link role="menuitem" href={`/dashboard/projects/${project.id}/`}><Pencil /> Edit</Link>
                  {project.status === "published" && <a role="menuitem" href={`/portfolio/${project.slug}/`} target="_blank" rel="noreferrer"><ExternalLink /> View on site</a>}
                  <button role="menuitem" type="button" onClick={() => { setMenu(null); void duplicate(project); }}><Copy /> Duplicate</button>
                  <button role="menuitem" type="button" onClick={() => { setMenu(null); const next = project.status === "published" ? "draft" : "published"; void update(project, { status: next }, { title: next === "published" ? "Published" : "Moved back to drafts", undo: { status: project.status } }); }}>{project.status === "published" ? <><EyeOff /> Unpublish</> : <><Eye /> Publish</>}</button>
                  <button role="menuitem" type="button" className="is-danger" onClick={() => { setMenu(null); setPendingDelete(project); }}><Trash2 /> Delete…</button>
                </div>}
              </div>
            </div>
          </div>
        </div>
      </li>)}</ul>}

    <Dialog open={pendingDelete !== null} onClose={() => setPendingDelete(null)} title={`Delete “${pendingDelete?.title ?? ""}”?`} role="alertdialog"
      actions={<><Button variant="ghost" onClick={() => setPendingDelete(null)}>Cancel</Button><Button variant="danger" state={busy === pendingDelete?.id ? "loading" : undefined} onClick={() => pendingDelete && remove(pendingDelete)}>Delete project</Button></>}>
      <p>This permanently removes the project and its gallery entries from the site. The uploaded files stay in the media library. To hide it without deleting, unpublish it instead.</p>
    </Dialog>
    <CategoryManager open={categoriesOpen} onClose={() => setCategoriesOpen(false)} categories={categories} counts={perCategory} />
    <QuickUpload open={quick} onClose={() => setQuick(false)} categories={categories} />
  </>;
}
