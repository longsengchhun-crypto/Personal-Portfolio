import Footer from "./Footer";
import Nav from "./Nav";
import ScrollEffects from "./ScrollEffects";
import VisitTracker from "./VisitTracker";

// The public-site frame. Used by the (site) route group and by the root 404 page.
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  return <div className="site">
    <Nav />
    <main id="main">{children}</main>
    <Footer />
    <ScrollEffects />
    <VisitTracker />
  </div>;
}
