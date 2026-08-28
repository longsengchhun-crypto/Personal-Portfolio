import { pageMetadata } from "@/lib/content";
import { getSkillGroups, getSoftwareTools } from "@/lib/data";

export const metadata = pageMetadata("/about/", "About", "Multidisciplinary creative practice — graphic design, photography, filmmaking, video editing, and 3D visualization by LONG SENGCHHUN.");

export default async function AboutPage() {
  const [skillGroups, software] = await Promise.all([getSkillGroups(), getSoftwareTools()]);
  return <><section className="page-hero"><div className="container"><p className="eyebrow">About</p><h1>Multidisciplinary creative practice with practical production depth.</h1><p>I create across graphic design, photography, filmmaking, video editing, and 3D visualization, bringing a connected visual direction to every project.</p></div></section><section className="section pt-0"><div className="container skill-groups">{skillGroups.map((group) => <section className="skill-group reveal" key={group.id}><h2>{group.name}</h2><div className="tag-cloud">{group.skills.map((skill) => <span key={skill.id}>{skill.name}</span>)}</div></section>)}</div></section><section className="software-strip"><div className="container software-list">{software.map((item) => <span key={item.id}>{item.name}</span>)}</div></section></>;
}
