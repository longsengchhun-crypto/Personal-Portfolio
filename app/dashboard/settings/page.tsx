import Link from "next/link";
import FlagsForm from "@/components/admin/FlagsForm";
import HeroSlides from "@/components/admin/HeroSlides";
import PageHeader from "@/components/admin/PageHeader";
import RowsEditor, { type Row } from "@/components/admin/RowsEditor";
import ShowreelUploader from "@/components/admin/ShowreelUploader";
import SiteSettingsForm from "@/components/admin/SiteSettingsForm";
import { requireAdmin } from "@/lib/auth";
import { getDashboardContent, getSocialLinksAdmin } from "@/lib/data";
import { getHeroSlides } from "@/lib/heroSlides";
import { getSiteFlags } from "@/lib/siteFlags";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

const TABS = [["general", "General"], ["homepage", "Homepage"], ["about", "About page"], ["social", "Social links"], ["seo", "Search & status"]] as const;
type Tab = (typeof TABS)[number][0];

const SOCIAL_ICONS = ["instagram", "facebook", "youtube", "tiktok", "telegram", "linkedin", "behance", "vimeo", "github", "twitter"].map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }));

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin("/dashboard/settings/");
  const requested = (await searchParams).tab;
  const tab: Tab = TABS.some(([id]) => id === requested) ? (requested as Tab) : "general";
  const content = await getDashboardContent();
  const site = content.site_settings;

  return <>
    <PageHeader title="Settings" description="Site-wide content and configuration, in one place." />
    <nav className="adm-tabs" aria-label="Settings sections">
      {TABS.map(([id, label]) => <Link key={id} href={`/dashboard/settings/?tab=${id}`} aria-current={tab === id ? "page" : undefined} scroll={false}>{label}</Link>)}
    </nav>

    {tab === "general" && <SiteSettingsForm key={JSON.stringify(site)} site={site} section="general" />}

    {tab === "homepage" && await (async () => {
      const { slides, isDefault } = await getHeroSlides();
      const label = site?.local_video_url ? "an uploaded video" : site?.youtube_url ? "a YouTube link" : site?.vimeo_url ? "a Vimeo link" : "none set, so the featured video project is used";
      return <div className="adm-stack">
        <section className="adm-card" aria-labelledby="hero-heading"><h2 id="hero-heading">Hero slides</h2><p className="adm-hint">The full-screen images at the top of the homepage.</p><HeroSlides initial={slides} isDefault={isDefault} /></section>
        <section className="adm-card" id="showreel" aria-labelledby="reel-heading"><h2 id="reel-heading">Showreel</h2><p className="adm-hint">Currently using {label}.</p><ShowreelUploader />
          <h3 className="adm-subhead">Or use an embedded link</h3><SiteSettingsForm key={JSON.stringify(site)} site={site} section="showreel" /></section>
        <p className="caption">Featured projects on the homepage are chosen with the star on each project in <Link className="link-arrow" href="/dashboard/projects/?status=featured">Projects</Link>.</p>
      </div>;
    })()}

    {tab === "about" && <div className="adm-stack">
      <section className="adm-card"><h2>Skill groups</h2><p className="adm-hint">Headings for the capabilities shown on the About page.</p>
        <RowsEditor endpoint="/api/dashboard/content/skill-groups/" noun="group" rows={content.skill_groups as unknown as Row[]} fields={[{ key: "name", label: "Group name", type: "text", required: true, placeholder: "e.g. Post-production" }]} blank={{ name: "" }} emptyTitle="No skill groups" emptyText="Add a group first, then add skills to it." /></section>
      <section className="adm-card"><h2>Skills</h2><p className="adm-hint">Each skill belongs to a group.</p>
        {content.skill_groups.length === 0 ? <p className="adm-empty-line">Add a skill group above first.</p> :
          <RowsEditor endpoint="/api/dashboard/content/skills/" noun="skill" rows={content.skills as unknown as Row[]} fields={[{ key: "name", label: "Skill", type: "text", required: true }, { key: "group_id", label: "Group", type: "select", options: content.skill_groups.map((group) => ({ value: group.id, label: group.name })) }]} blank={{ name: "", group_id: content.skill_groups[0].id }} emptyTitle="No skills yet" emptyText="Add your first skill below." />}</section>
      <section className="adm-card"><h2>Software</h2><p className="adm-hint">The tools listed on the homepage and About page.</p>
        <RowsEditor endpoint="/api/dashboard/content/software/" noun="tool" rows={content.software_tools as unknown as Row[]} fields={[{ key: "name", label: "Tool", type: "text", required: true, placeholder: "e.g. DaVinci Resolve" }]} blank={{ name: "" }} emptyTitle="No software listed" emptyText="Add the tools you work with." /></section>
    </div>}

    {tab === "seo" && await (async () => {
      const flags = await getSiteFlags();
      return <FlagsForm initial={flags} />;
    })()}

    {tab === "social" && await (async () => {
      const links = await getSocialLinksAdmin().catch(() => []);
      return <section className="adm-card"><h2>Social links</h2><p className="adm-hint">Shown in the site footer and in search-engine data about you.</p>
        <RowsEditor endpoint="/api/dashboard/social-links/" noun="link" rows={links as unknown as Row[]} fields={[{ key: "label", label: "Name", type: "text", required: true, placeholder: "Instagram" }, { key: "icon_name", label: "Network", type: "select", options: SOCIAL_ICONS }, { key: "url", label: "Link", type: "url", wide: true, placeholder: "https://…" }, { key: "is_active", label: "Visibility", type: "switch", text: "Show on the site" }]}
          blank={{ label: "", icon_name: "instagram", url: "", is_active: true }} emptyTitle="No social links yet" emptyText="Add your profiles so visitors can follow your work." /></section>;
    })()}
  </>;
}
