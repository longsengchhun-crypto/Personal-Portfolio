"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { adminJson } from "@/lib/adminApi";
import type { SiteFlags } from "@/lib/siteFlags";

export default function FlagsForm({ initial }: { initial: SiteFlags }) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);

  async function save() {
    setBusy(true);
    const res = await adminJson("/api/dashboard/site-flags/", values);
    setBusy(false);
    if (!res.ok) { toast({ tone: "error", title: "Not saved", message: res.error }); return; }
    setSaved(values);
    toast({ title: "Saved", message: "Updated across the site." });
    router.refresh();
  }

  return <form className="adm-card adm-settings" onSubmit={(event) => { event.preventDefault(); void save(); }}>
    <div className="adm-form">
      <div className="field adm-form__wide"><span className="field__label">Booking status</span><label className="switch"><input type="checkbox" checked={values.available} onChange={(event) => setValues((current) => ({ ...current, available: event.target.checked }))} /> Open for new projects</label><span className="field__hint">Shown in the footer and on the contact page.</span></div>
      <div className="field adm-form__wide"><label htmlFor="availability-note">Custom status message <span className="caption">(optional)</span></label><input id="availability-note" className="input" maxLength={120} value={values.availabilityNote} onChange={(event) => setValues((current) => ({ ...current, availabilityNote: event.target.value }))} placeholder="e.g. Booking from November" /></div>
      <div className="field adm-form__wide"><label htmlFor="seo-description">Default search description</label><textarea id="seo-description" className="textarea" rows={3} maxLength={300} value={values.seoDescription} onChange={(event) => setValues((current) => ({ ...current, seoDescription: event.target.value }))} placeholder="One or two sentences describing the site for search results and link previews." /><span className="field__hint tabular">{values.seoDescription.length} / 300. Used when a page has no description of its own. Leave empty for the built-in one.</span></div>
    </div>
    <div className="adm-form__actions"><Button type="submit" variant="primary" disabled={!dirty || busy} state={busy ? "loading" : undefined}>Save changes</Button>{dirty && <span className="caption">Unsaved changes</span>}</div>
  </form>;
}
