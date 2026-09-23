import { pageMetadata } from "@/lib/content";
import { getSkillGroups, getSoftwareTools } from "@/lib/data";

export const revalidate = 60;
export const metadata = pageMetadata("/about/", "About", "Visual creative specializing in VFX, photography, videography, filmmaking, motion, and digital design in Cambodia.");

export default async function AboutPage() {
  const [skillGroups, software] = await Promise.all([getSkillGroups(), getSoftwareTools()]);
  return <><section className="page-hero"><div className="container"><p className="eyebrow">About</p><h1>Visual creative & media, with practical production depth.</h1><p>I work across VFX, photography, videography, filmmaking, motion graphics, and 3D — bringing a connected visual direction to every project, from production through post.</p></div></section><section className="section pt-0"><div className="container skill-groups">{skillGroups.map((group) => <section className="skill-group reveal" key={group.id}><h2>{group.name}</h2><div className="tag-cloud">{group.skills.map((skill) => <span key={skill.id}>{skill.name}</span>)}</div></section>)}</div></section><section className="software-strip"><div className="container software-list">{software.map((item) => <span key={item.id}>{item.name}</span>)}</div></section></>;
}
