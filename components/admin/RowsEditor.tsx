"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Dialog from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "@/components/ui/Icon";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { adminJson } from "@/lib/adminApi";

type FieldDef =
  | { key: string; label: string; type: "text" | "textarea" | "url"; required?: boolean; placeholder?: string; wide?: boolean }
  | { key: string; label: string; type: "switch"; text: string }
  | { key: string; label: string; type: "select"; options: { value: string | number; label: string }[] };

export type Row = { id: number; order: number } & Record<string, string | number | boolean>;

type Props = {
  endpoint: string;
  rows: Row[];
  fields: FieldDef[];
  /** Singular noun for messages, e.g. "service". */
  noun: string;
  /** Values for a new row's fields. */
  blank: Record<string, string | number | boolean>;
  emptyTitle: string;
  emptyText: string;
  /** Extra values sent with every save, e.g. a parent id. */
  extra?: Record<string, string | number>;
};

const sortRows = (rows: Row[]) => [...rows].sort((a, b) => a.order - b.order || a.id - b.id);

function Fields({ fields, values, onChange, idPrefix }: { fields: FieldDef[]; values: Record<string, string | number | boolean>; onChange: (key: string, value: string | number | boolean) => void; idPrefix: string }) {
  return <>{fields.map((field) => {
    const id = `${idPrefix}-${field.key}`;
    if (field.type === "switch") return <div className="field" key={field.key}><span className="field__label">{field.label}</span><label className="switch"><input type="checkbox" checked={Boolean(values[field.key])} onChange={(event) => onChange(field.key, event.target.checked)} /> {field.text}</label></div>;
    if (field.type === "select") return <div className="field" key={field.key}><label htmlFor={id}>{field.label}</label><select id={id} className="select select--sm" value={String(values[field.key])} onChange={(event) => onChange(field.key, event.target.value)}>{field.options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></div>;
    if (field.type === "textarea") return <div className="field adm-form__wide" key={field.key}><label htmlFor={id}>{field.label}</label><textarea id={id} className="textarea" rows={2} value={String(values[field.key] ?? "")} onChange={(event) => onChange(field.key, event.target.value)} placeholder={field.placeholder} /></div>;
    return <div className={`field${field.wide ? " adm-form__wide" : ""}`} key={field.key}><label htmlFor={id}>{field.label}</label><input id={id} className="input input--sm" type={field.type === "url" ? "url" : "text"} value={String(values[field.key] ?? "")} onChange={(event) => onChange(field.key, event.target.value)} placeholder={field.placeholder} required={field.required} /></div>;
  })}</>;
}

function RowCard({ row, props, index, total, onMove }: { row: Row; props: Props; index: number; total: number; onMove: (index: number, delta: number) => void }) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState<Record<string, string | number | boolean>>(() => Object.fromEntries(props.fields.map((field) => [field.key, row[field.key]])));
  const [saved, setSaved] = useState(values);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);

  async function save() {
    setBusy(true);
    const res = await adminJson(props.endpoint, { ...values, ...props.extra, id: row.id, order: row.order });
    setBusy(false);
    if (!res.ok) { toast({ tone: "error", title: `Could not save the ${props.noun}`, message: res.error }); return; }
    setSaved(values);
    toast({ title: `${props.noun[0].toUpperCase()}${props.noun.slice(1)} saved` });
    router.refresh();
  }
  async function remove() {
    setBusy(true);
    const res = await adminJson(props.endpoint, { action: "delete", id: row.id });
    setBusy(false);
    setConfirm(false);
    if (!res.ok) { toast({ tone: "error", title: `Could not delete the ${props.noun}`, message: res.error }); return; }
    toast({ title: `${props.noun[0].toUpperCase()}${props.noun.slice(1)} deleted` });
    router.refresh();
  }

  return <li className="adm-edit-card">
    <div className="adm-edit-card__order">
      <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label={`Move ${props.noun} up`} disabled={index === 0 || busy} onClick={() => onMove(index, -1)}><ArrowUp /></button>
      <span className="caption tabular">{index + 1}</span>
      <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label={`Move ${props.noun} down`} disabled={index === total - 1 || busy} onClick={() => onMove(index, 1)}><ArrowDown /></button>
    </div>
    <div className="adm-form adm-edit-card__fields"><Fields fields={props.fields} values={values} onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))} idPrefix={`row-${row.id}`} /></div>
    <div className="adm-edit-card__actions">
      <Button size="sm" variant={dirty ? "primary" : "glass"} disabled={!dirty || busy} state={busy ? "loading" : undefined} onClick={save}>Save</Button>
      <Button size="sm" variant="ghost" icon aria-label={`Delete ${props.noun}`} disabled={busy} onClick={() => setConfirm(true)}><Trash2 /></Button>
    </div>
    <Dialog open={confirm} onClose={() => setConfirm(false)} title={`Delete this ${props.noun}?`} role="alertdialog" actions={<><Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button><Button variant="danger" state={busy ? "loading" : undefined} onClick={remove}>Delete</Button></>}>
      <p>It will be removed from the site straight away.</p>
    </Dialog>
  </li>;
}

export default function RowsEditor(props: Props) {
  const router = useRouter();
  const toast = useToast();
  const ordered = sortRows(props.rows);
  const [values, setValues] = useState(props.blank);
  const [busy, setBusy] = useState(false);
  const requiredKey = props.fields.find((field) => "required" in field && field.required)?.key;

  async function add() {
    setBusy(true);
    const res = await adminJson(props.endpoint, { ...values, ...props.extra, order: ordered.length });
    setBusy(false);
    if (!res.ok) { toast({ tone: "error", title: `Could not add the ${props.noun}`, message: res.error }); return; }
    setValues(props.blank);
    toast({ title: `${props.noun[0].toUpperCase()}${props.noun.slice(1)} added` });
    router.refresh();
  }

  async function move(index: number, delta: number) {
    const next = [...ordered];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    const results = await Promise.all(next.map((row, position) => (row.order === position ? null : adminJson(props.endpoint, { ...Object.fromEntries(props.fields.map((field) => [field.key, row[field.key]])), ...props.extra, id: row.id, order: position }))));
    const failed = results.find((result) => result && !result.ok);
    if (failed && !failed.ok) toast({ tone: "error", title: "Could not reorder", message: failed.error });
    router.refresh();
  }

  return <div className="adm-rows-editor">
    {ordered.length === 0
      ? <EmptyState title={props.emptyTitle}>{props.emptyText}</EmptyState>
      : <ul className="adm-edit-cards">{ordered.map((row, index) => <RowCard key={`${row.id}-${JSON.stringify(props.fields.map((field) => row[field.key]))}`} row={row} props={props} index={index} total={ordered.length} onMove={move} />)}</ul>}
    <form className="adm-edit-card adm-edit-card--new" onSubmit={(event) => { event.preventDefault(); void add(); }}>
      <div className="adm-edit-card__order" aria-hidden="true"><Plus /></div>
      <div className="adm-form adm-edit-card__fields"><Fields fields={props.fields} values={values} onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))} idPrefix="new" /></div>
      <div className="adm-edit-card__actions"><Button type="submit" variant="primary" size="sm" state={busy ? "loading" : undefined} disabled={busy || Boolean(requiredKey && !String(values[requiredKey] ?? "").trim())}>Add {props.noun}</Button></div>
    </form>
  </div>;
}
