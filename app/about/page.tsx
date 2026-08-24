import { SKILLS, SOFTWARE } from "@/lib/content";

export const metadata = { title: "About" };

export default function AboutPage() { return <><section className="page-hero"><div className="container"><p className="eyebrow">About</p><h1>Multidisciplinary creative practice with practical production depth.</h1><p>I create across graphic design, photography, filmmaking, video editing, and 3D visualization, bringing a connected visual direction to every project.</p></div></section><section className="section pt-0"><div className="container skill-groups">{Object.entries(SKILLS).map(([group, skills]) => <section className="skill-group reveal" key={group}><h2>{group}</h2><div className="tag-cloud">{skills.map((skill) => <span key={skill}>{skill}</span>)}</div></section>)}</div></section><section className="software-strip"><div className="container software-list">{SOFTWARE.map((item) => <span key={item}>{item}</span>)}</div></section></>; }
