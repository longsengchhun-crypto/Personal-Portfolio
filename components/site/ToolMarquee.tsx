import Picture from "@/components/ui/Picture";

// Our signature: the software we work in, drifting past in a slow loop. It pauses on hover and
// stands still for visitors who prefer reduced motion.
const TOOLS = [
  ["After Effects", "after-effects"], ["Premiere Pro", "creative-tool-2"], ["DaVinci Resolve", "davinci-resolve"], ["Photoshop", "photoshop"],
  ["Illustrator", "illustrator"], ["Lightroom", "lightroom"], ["InDesign", "indesign"], ["Audition", "audition"], ["Dimension", "creative-tool-1"],
  ["Blender", "blender"], ["CapCut", "capcut"], ["CorelDRAW", "coreldraw"],
] as const;

export default function ToolMarquee() {
  return <section className="marquee" aria-label="Software we work in">
    <p className="meta marquee__label">Tools of the trade</p>
    <div className="marquee__viewport">
      <ul className="marquee__track">
        {[0, 1].map((copy) => TOOLS.map(([name, file]) => <li key={`${copy}-${file}`} className="marquee__item" title={name} aria-hidden={copy === 1 || undefined}>
          <Picture src={`/static/site-assets/tools/${file}.png`} alt={copy === 0 ? `${name} logo` : ""} width={56} height={56} sizes="56px" />
          <span>{name}</span>
        </li>))}
      </ul>
    </div>
  </section>;
}
