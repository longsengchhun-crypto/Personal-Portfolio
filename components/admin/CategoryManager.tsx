"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Dialog from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Trash2 } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { adminJson } from "@/lib/adminApi";
import type { Category } from "@/lib/types";

const ENDPOINT = "/api/dashboard/portfolio/categories/";

function Row({ category, onChanged, projectCount }: { category: Category; onChanged: () => void; projectCount: number }) {
  const toast = useToast();
  const [name, setName] = useState(category.name);
  const [order, setOrder] = useState(String(category.order));
  const [busy, setBusy] = useState(false);
  const dirty = name.trim() !== category.name || Number(order) !== category.order;

  async function save() {
    setBusy(true);
    const res = await adminJson(ENDPOINT, { id: category.id, name, order: Number(order) || 0 });
    setBusy(false);
    if (!res.ok) return toast({ tone: "error", title: "Could not save the category", message: res.error });
    toast({ title: "Category saved" });
    onChanged();
  }
  async function remove() {
    setBusy(true);
    const res = await adminJson(ENDPOINT, { action: "delete", id: category.id });
    setBusy(false);
    if (!res.ok) return toast({ tone: "error", title: "Could not delete the category", message: projectCount ? `${projectCount} project${projectCount === 1 ? " is" : "s are"} still in it. Move them first.` : res.error });
    toast({ title: "Category deleted" });
    onChanged();
  }

  return <li className="adm-edit-row">
    <div className="field"><label className="sr-only" htmlFor={`cat-${category.id}`}>Category name</label><input id={`cat-${category.id}`} className="input input--sm" value={name} onChange={(event) => setName(event.target.value)} /></div>
    <div className="field adm-edit-row__order"><label className="sr-only" htmlFor={`cat-o-${category.id}`}>Order</label><input id={`cat-o-${category.id}`} className="input input--sm" type="number" min={0} value={order} onChange={(event) => setOrder(event.target.value)} /></div>
    <span className="caption adm-edit-row__count">{projectCount} project{projectCount === 1 ? "" : "s"}</span>
    <div className="adm-edit-row__actions">
      <Button size="sm" variant="glass" disabled={!dirty || busy || !name.trim()} onClick={save}>Save</Button>
      <Button size="sm" variant="ghost" icon aria-label={`Delete ${category.name}`} disabled={busy} onClick={remove}><Trash2 /></Button>
    </div>
  </li>;
}

export default function CategoryManager({ open, onClose, categories, counts }: { open: boolean; onClose: () => void; categories: Category[]; counts: Record<number, number> }) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = () => router.refresh();

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    const res = await adminJson(ENDPOINT, { name, order: categories.length });
    setBusy(false);
    if (!res.ok) return toast({ tone: "error", title: "Could not add the category", message: res.error });
    setName("");
    toast({ title: "Category added" });
    refresh();
  }

  return <Dialog open={open} onClose={onClose} title="Categories" wide actions={<Button variant="primary" onClick={onClose}>Done</Button>}>
    <p className="adm-hint">Categories become the filters on the public Work page. Lower numbers appear first.</p>
    <ul className="adm-edit-list">{categories.map((category) => <Row key={`${category.id}-${category.name}-${category.order}`} category={category} projectCount={counts[category.id] || 0} onChanged={refresh} />)}</ul>
    <form className="adm-add-row" onSubmit={(event) => { event.preventDefault(); void add(); }}>
      <div className="field"><label htmlFor="new-category">New category</label><input id="new-category" className="input input--sm" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Photography" /></div>
      <Button type="submit" variant="primary" size="sm" disabled={busy || !name.trim()}>Add category</Button>
    </form>
  </Dialog>;
}
