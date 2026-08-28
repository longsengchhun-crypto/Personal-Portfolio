import Link from "next/link";
import PaymentSettingsForm from "@/components/PaymentSettingsForm";
import ShowreelUploader from "@/components/ShowreelUploader";
import { requireAdmin } from "@/lib/auth";
import { getDashboardContent } from "@/lib/data";

export const metadata = { title: "Content" };

const SAVED_LABELS: Record<string, string> = {
  "site-settings": "Site settings saved.",
  services: "Services updated.",
  skills: "Skills updated.",
  software: "Software list updated.",
  "payment-settings": "Payment settings saved.",
};

export default async function DashboardContentPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin("/dashboard/content/");
  const { saved } = await searchParams;
  const content = await getDashboardContent();
  const site = content.site_settings;
  const skillsByGroup = new Map(content.skill_groups.map((group) => [group.id, content.skills.filter((skill) => skill.group_id === group.id)]));

  return <section className="dashboard-console"><div className="container">
    <header className="console-head compact-console-head">
      <div><p className="eyebrow">Content</p><h1>Edit hero, services, skills, and software without touching code.</h1></div>
      <div className="console-actions"><Link className="btn btn-outline-light" href="/dashboard/"><i className="bi bi-arrow-left" />Dashboard</Link></div>
    </header>

    {saved && <div className={`alert ${saved === "error" ? "alert-danger" : "alert-success"}`} role="alert">{saved === "error" ? "That change could not be saved. Please try again." : SAVED_LABELS[saved] || "Saved."}</div>}

    <section className="console-panel content-editor-panel">
      <div className="console-panel-head"><div><span className="status-dot" /><h2>Hero &amp; Site Info</h2></div></div>
      <div className="inquiry-form">
        <form method="post" action="/api/dashboard/content/site-settings/" className="form-grid">
          <div className="form-field"><label htmlFor="professional_title">Professional title</label><input className="form-control" id="professional_title" name="professional_title" defaultValue={site?.professional_title} /></div>
          <div className="form-field"><label htmlFor="showreel_title">Showreel title</label><input className="form-control" id="showreel_title" name="showreel_title" defaultValue={site?.showreel_title} /></div>
          <div className="form-field wide"><label htmlFor="hero_intro">Hero intro</label><textarea className="form-control" id="hero_intro" name="hero_intro" rows={3} defaultValue={site?.hero_intro} /></div>
          <div className="form-field wide"><label htmlFor="khmer_intro">Khmer intro line</label><input className="form-control" id="khmer_intro" name="khmer_intro" defaultValue={site?.khmer_intro} /></div>
          <div className="form-field wide"><label htmlFor="professional_intro">About / professional intro</label><textarea className="form-control" id="professional_intro" name="professional_intro" rows={4} defaultValue={site?.professional_intro} /></div>
          <div className="form-field"><label htmlFor="email">Contact email</label><input className="form-control" id="email" name="email" type="email" defaultValue={site?.email} /></div>
          <div className="form-field"><label htmlFor="phone">Contact phone</label><input className="form-control" id="phone" name="phone" defaultValue={site?.phone} /></div>
          <div className="form-field"><label htmlFor="location">Location</label><input className="form-control" id="location" name="location" defaultValue={site?.location} /></div>
          <div className="form-field"><label htmlFor="youtube_url">Showreel YouTube URL</label><input className="form-control" id="youtube_url" name="youtube_url" defaultValue={site?.youtube_url} /></div>
          <div className="form-field"><label htmlFor="vimeo_url">Showreel Vimeo URL</label><input className="form-control" id="vimeo_url" name="vimeo_url" defaultValue={site?.vimeo_url} /></div>
          <div className="form-field"><label htmlFor="local_video_url">Showreel local video URL</label><input className="form-control" id="local_video_url" name="local_video_url" defaultValue={site?.local_video_url} /></div>
          <div className="form-field wide"><button className="btn btn-accent" type="submit">Save Site Info</button></div>
        </form>
      </div>
    </section>

    <section className="console-panel content-editor-panel">
      <div className="console-panel-head"><div><span className="status-dot" /><h2>Showreel Video</h2></div><small>Drag and drop, or select a file</small></div>
      <ShowreelUploader currentVideoLabel={site?.local_video_url ? "a local video is set" : site?.youtube_url ? "YouTube link is set" : site?.vimeo_url ? "Vimeo link is set" : "none set — falls back to the featured video project"} />
    </section>

    <section className="console-panel content-editor-panel">
      <div className="console-panel-head"><div><span className="status-dot" /><h2>Payment Settings</h2></div><small>ABA QR shown to 3D Store customers at checkout</small></div>
      <PaymentSettingsForm currentQrImage={site?.aba_qr_image || ""} currentAccountInfo={site?.aba_account_info || ""} />
    </section>

    <section className="console-panel content-editor-panel">
      <div className="console-panel-head"><div><span className="status-dot" /><h2>Services</h2></div><small>Shown on the homepage and /services/</small></div>
      <div className="content-item-list">
        {content.services.map((service) => <form key={service.id} method="post" action="/api/dashboard/content/services/" className="content-item-form">
          <input type="hidden" name="id" value={service.id} />
          <div className="form-field"><label>Title</label><input className="form-control" name="title" defaultValue={service.title} required /></div>
          <div className="form-field wide"><label>Description</label><textarea className="form-control" name="description" rows={2} defaultValue={service.description} /></div>
          <div className="form-field"><label>Order</label><input className="form-control" type="number" name="order" min={0} defaultValue={service.order} /></div>
          <label className="review-toggle"><input type="checkbox" name="is_active" defaultChecked={service.is_active} /> Published</label>
          <div className="content-item-actions"><button className="btn btn-outline-light" type="submit" name="action" value="save">Save</button><button className="btn btn-outline-danger" type="submit" name="action" value="delete">Delete</button></div>
        </form>)}
        <form method="post" action="/api/dashboard/content/services/" className="content-item-form is-new">
          <div className="form-field"><label>New service title</label><input className="form-control" name="title" required /></div>
          <div className="form-field wide"><label>Description</label><textarea className="form-control" name="description" rows={2} /></div>
          <div className="form-field"><label>Order</label><input className="form-control" type="number" name="order" min={0} defaultValue={content.services.length} /></div>
          <label className="review-toggle"><input type="checkbox" name="is_active" defaultChecked /> Published</label>
          <div className="content-item-actions"><button className="btn btn-accent" type="submit" name="action" value="save">Add Service</button></div>
        </form>
      </div>
    </section>

    <section className="console-panel content-editor-panel">
      <div className="console-panel-head"><div><span className="status-dot" /><h2>Skill Groups</h2></div><small>Shown on /about/</small></div>
      <div className="content-item-list">
        {content.skill_groups.map((group) => <form key={group.id} method="post" action="/api/dashboard/content/skill-groups/" className="content-item-form">
          <input type="hidden" name="id" value={group.id} />
          <div className="form-field"><label>Group name</label><input className="form-control" name="name" defaultValue={group.name} required /></div>
          <div className="form-field"><label>Order</label><input className="form-control" type="number" name="order" min={0} defaultValue={group.order} /></div>
          <div className="content-item-actions"><button className="btn btn-outline-light" type="submit" name="action" value="save">Save</button><button className="btn btn-outline-danger" type="submit" name="action" value="delete">Delete</button></div>
        </form>)}
        <form method="post" action="/api/dashboard/content/skill-groups/" className="content-item-form is-new">
          <div className="form-field"><label>New group name</label><input className="form-control" name="name" required /></div>
          <div className="form-field"><label>Order</label><input className="form-control" type="number" name="order" min={0} defaultValue={content.skill_groups.length} /></div>
          <div className="content-item-actions"><button className="btn btn-accent" type="submit" name="action" value="save">Add Group</button></div>
        </form>
      </div>
    </section>

    <section className="console-panel content-editor-panel">
      <div className="console-panel-head"><div><span className="status-dot" /><h2>Skills</h2></div></div>
      <div className="content-item-list">
        {content.skill_groups.length === 0 && <p className="empty-state">Add a skill group above before adding skills.</p>}
        {content.skill_groups.map((group) => (skillsByGroup.get(group.id) || []).map((skill) => <form key={skill.id} method="post" action="/api/dashboard/content/skills/" className="content-item-form">
          <input type="hidden" name="id" value={skill.id} />
          <div className="form-field"><label>Group</label><select className="form-select" name="group_id" defaultValue={skill.group_id}>{content.skill_groups.map((g) => <option value={g.id} key={g.id}>{g.name}</option>)}</select></div>
          <div className="form-field"><label>Skill name</label><input className="form-control" name="name" defaultValue={skill.name} required /></div>
          <div className="form-field"><label>Order</label><input className="form-control" type="number" name="order" min={0} defaultValue={skill.order} /></div>
          <div className="content-item-actions"><button className="btn btn-outline-light" type="submit" name="action" value="save">Save</button><button className="btn btn-outline-danger" type="submit" name="action" value="delete">Delete</button></div>
        </form>))}
        {content.skill_groups.length > 0 && <form method="post" action="/api/dashboard/content/skills/" className="content-item-form is-new">
          <div className="form-field"><label>Group</label><select className="form-select" name="group_id" defaultValue={content.skill_groups[0]?.id}>{content.skill_groups.map((g) => <option value={g.id} key={g.id}>{g.name}</option>)}</select></div>
          <div className="form-field"><label>New skill name</label><input className="form-control" name="name" required /></div>
          <div className="form-field"><label>Order</label><input className="form-control" type="number" name="order" min={0} defaultValue={0} /></div>
          <div className="content-item-actions"><button className="btn btn-accent" type="submit" name="action" value="save">Add Skill</button></div>
        </form>}
      </div>
    </section>

    <section className="console-panel content-editor-panel">
      <div className="console-panel-head"><div><span className="status-dot" /><h2>Software</h2></div><small>Shown on the homepage and /about/</small></div>
      <div className="content-item-list">
        {content.software_tools.map((tool) => <form key={tool.id} method="post" action="/api/dashboard/content/software/" className="content-item-form">
          <input type="hidden" name="id" value={tool.id} />
          <div className="form-field"><label>Name</label><input className="form-control" name="name" defaultValue={tool.name} required /></div>
          <div className="form-field"><label>Order</label><input className="form-control" type="number" name="order" min={0} defaultValue={tool.order} /></div>
          <div className="content-item-actions"><button className="btn btn-outline-light" type="submit" name="action" value="save">Save</button><button className="btn btn-outline-danger" type="submit" name="action" value="delete">Delete</button></div>
        </form>)}
        <form method="post" action="/api/dashboard/content/software/" className="content-item-form is-new">
          <div className="form-field"><label>New software name</label><input className="form-control" name="name" required /></div>
          <div className="form-field"><label>Order</label><input className="form-control" type="number" name="order" min={0} defaultValue={content.software_tools.length} /></div>
          <div className="content-item-actions"><button className="btn btn-accent" type="submit" name="action" value="save">Add Software</button></div>
        </form>
      </div>
    </section>
  </div></section>;
}
