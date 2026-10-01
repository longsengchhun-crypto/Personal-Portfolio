import { pageMetadata } from "@/lib/content";

export const metadata = pageMetadata("/privacy/", "Privacy", "How LONG SENGCHHUN handles your information when you visit the site, create an account or send a project inquiry.");

export default function PrivacyPage() {
  return <section className="page-hero"><div className="container narrow"><p className="eyebrow">Privacy</p><h1>Your information is used only to work with you.</h1><div className="prose privacy-copy">
    <h2>Project inquiries and accounts</h2>
    <p>Details you share through the project form or when creating an account are used only to review and reply to your request and to keep in touch about your project. They are never sold or shared for advertising.</p>
    <h2>Site usage</h2>
    <p>The site collects basic, general usage information to keep it fast and working well on every device. It is not used to identify you personally or to build advertising profiles.</p>
    <h2>Your choices</h2>
    <p>You can ask to see or remove your information at any time by emailing <a href="mailto:longsengchhun@gmail.com">longsengchhun@gmail.com</a>.</p>
  </div></div></section>;
}
