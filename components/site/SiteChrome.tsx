import Footer from "./Footer";
import Nav from "./Nav";
import RealtimeSync from "./RealtimeSync";
import ScrollEffects from "./ScrollEffects";
import VisitTracker from "./VisitTracker";

// The public-site frame. Used by the (site) route group and by the root 404 page.
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  return <>
    <Nav />
    <main id="main">{children}</main>
    <Footer />
    <RealtimeSync />
    <ScrollEffects />
    <VisitTracker />
  </>;
}
