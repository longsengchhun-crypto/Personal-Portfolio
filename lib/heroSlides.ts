// Placeholder hero slides. Swap these images for your own (or manage them from the dashboard once
// slide management is added) — everything else about the slider is driven by this list.
export type HeroSlide = { image: string; label: string; alt: string };

export const HERO_SLIDES: HeroSlide[] = [
  { image: "/static/site-assets/hero/hero-vfx.jpg", label: "Visual Effects", alt: "Abstract VFX energy burst with light streaks" },
  { image: "/static/site-assets/hero/hero-3d.jpg", label: "3D Design & Modeling", alt: "Glowing 3D wireframe torus on a perspective grid" },
  { image: "/static/site-assets/hero/hero-production.jpg", label: "Film & Media Production", alt: "Cinematic anamorphic lens flare with bokeh and film strip" },
];
