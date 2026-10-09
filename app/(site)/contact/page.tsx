import ContactForm from "@/components/site/ContactForm";
import { CheckCircle2 } from "@/components/ui/Icon";
import { OWNER, pageMetadata, SERVICE_CHOICES } from "@/lib/content";
import { getCustomer } from "@/lib/customerAuth";
import { availabilityLabel, getSiteFlags } from "@/lib/siteFlags";

export const metadata = pageMetadata("/contact/", "Contact", "Start a video, VFX, motion or photography project with LONG SENGCHHUN in Phnom Penh, Cambodia.");

const NEXT_STEPS = [
  ["You send the brief", "A few lines are enough. Add budget, timeline and references if you have them."],
  ["You hear back", "A confirmation arrives straight away, and a personal reply within one to two working days."],
  ["We shape the plan", "Scope, schedule, revisions and delivery formats are agreed before production starts."],
] as const;

export default async function ContactPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const [customer, flags] = await Promise.all([getCustomer(), getSiteFlags()]);
  const requested = typeof params.service === "string" && SERVICE_CHOICES.includes(params.service as never) ? params.service : "";
  const error = typeof params.error === "string" ? params.error : "";
  const sentWithoutScript = params.sent === "1";

  return <>
    <header className="page-head wrap">
      <p className="meta">Contact</p>
      <h1 className="page-head__title">Have a project in mind?</h1>
      <p className="lede">Tell me what you are making. I will reply with clear next steps.</p>
    </header>

    <section className="wrap contact" aria-label="Contact">
      <aside className="contact__side">
        <ul className="contact__direct">
          <li><span className="meta">Email</span><a href={`mailto:${OWNER.email}`}>{OWNER.email}</a></li>
          <li><span className="meta">Telegram</span><a href={OWNER.telegramUrl} target="_blank" rel="noreferrer">{OWNER.telegram}</a></li>
          <li><span className="meta">Phone</span><a href={`tel:${OWNER.phone.replace(/\s/g, "")}`}>{OWNER.phone}</a></li>
          <li><span className="meta">Based in</span><span>{OWNER.location}</span></li>
          <li><span className="meta">Status</span><span className="status-line"><i className={flags.available ? "is-open" : ""} aria-hidden="true" />{availabilityLabel(flags)}</span></li>
        </ul>
        <div className="contact__next">
          <h2 className="meta">What happens next</h2>
          <ol>{NEXT_STEPS.map(([title, text], index) => <li key={title}><span className="steps__num tabular">{index + 1}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol>
        </div>
      </aside>
      <div className="contact__form">
        {sentWithoutScript && <div className="notice notice--success" role="status"><CheckCircle2 aria-hidden="true" /><span><strong>Message received.</strong> Thank you, I will reply by email or Telegram soon.</span></div>}
        <ContactForm defaultName={customer?.fullName ?? ""} defaultEmail={customer?.email ?? ""} defaultService={requested} serverError={error} />
      </div>
    </section>
  </>;
}
