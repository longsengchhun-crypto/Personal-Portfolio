import { OWNER, pageMetadata } from "@/lib/content";

export const metadata = pageMetadata("/privacy/", "Privacy", "How LONG SENGCHHUN handles your information when you visit the site, create an account or send a project inquiry.");

export default function PrivacyPage() {
  return <>
    <header className="page-head wrap wrap--narrow">
      <p className="meta meta--accent">Privacy</p>
      <h1 className="title page-head__title">Your information is used only to work with you.</h1>
    </header>
    <section className="wrap wrap--narrow prose section--tight">
      <h2 className="heading">Project inquiries and accounts</h2>
      <p className="copy">Details you share through the project form or when creating an account are used only to review and reply to your request and to keep in touch about your project. They are never sold or shared for advertising.</p>
      <h2 className="heading">Site usage</h2>
      <p className="copy">The site collects basic, general usage information to keep it fast and working well on every device. It is not used to identify you personally or to build advertising profiles.</p>
      <h2 className="heading">Your choices</h2>
      <p className="copy">You can ask to see or remove your information at any time by emailing <a className="link-arrow" href={`mailto:${OWNER.email}`}>{OWNER.email}</a>.</p>
    </section>
  </>;
}
