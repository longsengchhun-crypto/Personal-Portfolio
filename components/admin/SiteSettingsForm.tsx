"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { adminJson } from "@/lib/adminApi";
import type { SiteSetting } from "@/lib/types";

type Section = "general" | "showreel";

type Values = Pick<SiteSetting, "professional_title" | "hero_intro" | "khmer_intro" | "professional_intro" | "email" | "phone" | "location" | "showreel_title" | "youtube_url" | "vimeo_url" | "local_video_url">;

const KEYS: (keyof Values)[] = ["professional_title", "hero_intro", "khmer_intro", "professional_intro", "email", "phone", "location", "showreel_title", "youtube_url", "vimeo_url", "local_video_url"];

// The settings RPC overwrites every field, so the whole record is always sent; each tab only
// shows the fields that belong to it and carries the rest through untouched.
export default function SiteSettingsForm({ site, section }: { site: SiteSetting | null; section: Section }) {
  const router = useRouter();
  const toast = useToast();
  const initial = Object.fromEntries(KEYS.map((key) => [key, site?.[key] ?? ""])) as Values;
  const [values, setValues] = useState<Values>(initial);
  const [saved, setSaved] = useState<Values>(initial);
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  const bind = (key: keyof Values) => ({ value: values[key], onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((current) => ({ ...current, [key]: event.target.value })) });

  async function save() {
    setBusy(true);
    const res = await adminJson("/api/dashboard/content/site-settings/", values);
    setBusy(false);
    if (!res.ok) { toast({ tone: "error", title: "Settings were not saved", message: res.error }); return; }
    setSaved(values);
    toast({ title: "Settings saved", message: "Live on the site within a minute." });
    router.refresh();
  }

  return <form className="adm-card adm-settings" onSubmit={(event) => { event.preventDefault(); void save(); }}>
    {section === "general" ? <div className="adm-form">
      <div className="field adm-form__wide"><label htmlFor="professional_intro">About text</label><textarea id="professional_intro" className="textarea" rows={7} {...bind("professional_intro")} /><span className="field__hint">Shown on the About page. Separate paragraphs with a blank line; the first paragraph becomes the headline statement.</span></div>
      <div className="field"><label htmlFor="professional_title">Professional title</label><input id="professional_title" className="input" {...bind("professional_title")} placeholder="Visual Creative & Media" /><span className="field__hint">Used by search engines to describe what you do.</span></div>
      <div className="field"><label htmlFor="location">Location</label><input id="location" className="input" {...bind("location")} placeholder="Phnom Penh, Cambodia" /></div>
      <div className="field"><label htmlFor="email">Contact email</label><input id="email" className="input" type="email" {...bind("email")} /></div>
      <div className="field"><label htmlFor="phone">Contact phone</label><input id="phone" className="input" {...bind("phone")} /></div>
    </div> : <div className="adm-form">
      <div className="field adm-form__wide"><label htmlFor="showreel_title">Showreel page title</label><input id="showreel_title" className="input" {...bind("showreel_title")} placeholder="Showreel" /></div>
      <div className="field adm-form__wide"><label htmlFor="youtube_url">YouTube link</label><input id="youtube_url" className="input" type="url" {...bind("youtube_url")} placeholder="https://www.youtube.com/watch?v=…" /></div>
      <div className="field adm-form__wide"><label htmlFor="vimeo_url">Vimeo link</label><input id="vimeo_url" className="input" type="url" {...bind("vimeo_url")} placeholder="https://vimeo.com/…" /><span className="field__hint">An embedded link wins over an uploaded video. Leave both empty to use the uploaded reel below.</span></div>
    </div>}
    <div className="adm-form__actions"><Button type="submit" variant="primary" disabled={!dirty || busy} state={busy ? "loading" : undefined}>Save changes</Button>{dirty && <span className="caption">Unsaved changes</span>}</div>
  </form>;
}
