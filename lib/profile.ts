// Public-facing copy for the personal site. Facts here come from the previous site and the
// repository only; nothing is added that has not been published before.

export const LASTFX = {
  name: "LASTFX Studio",
  url: "https://lastfxstudio.com",
  summary: "A separate software brand building focused tools for creative post-production.",
  products: [
    ["FILMCHECK", "Video quality-control analysis"],
    ["LUMERIX", "Reference-based shot matching"],
    ["GRAINOVA", "Film texture and optical finishing"],
  ],
} as const;

export const BIO = [
  "I am a visual creative based in Phnom Penh, Cambodia. My work spans videography, video editing, visual effects, motion graphics, photography and 3D.",
  "I treat production and post-production as one continuous process. Knowing how a shot will be edited, graded and finished shapes how I plan and capture it, and working in post keeps me deliberate on set.",
  "I work carefully and in detail, from the first conversation to final delivery, and I prefer a clear plan to a surprise. I also build software for post-production under LASTFX Studio.",
  "I am open to suitable collaborations with directors, production teams, agencies and businesses.",
] as const;

export type Service = { title: string; text: string; points: readonly string[] };

export const CORE_SERVICES: readonly Service[] = [
  { title: "Videography & Video Production", text: "Video production and camera work, from planning to the final frame.", points: ["Interviews and company videos", "Events and promotional content", "Creative planning and visual storytelling"] },
  { title: "Video Editing & Post-Production", text: "Editing that serves the story, finished and delivered for the platform.", points: ["Editing, pacing and transitions", "Sound cleanup and subtitles", "Color correction and finishing", "Motion graphics where needed"] },
  { title: "Visual Effects & Motion Graphics", text: "Visual effects, motion design and compositing that support the picture.", points: ["Compositing and VFX", "Motion design", "Supporting elements for film and commercial content"] },
];

export const SUPPORTING_SERVICES: readonly Service[] = [
  { title: "Photography", text: "Product, portrait, event, lifestyle and commercial photography.", points: [] },
  { title: "3D Modeling & Visualization", text: "Modeling, materials, lighting and rendering, including product visualization.", points: [] },
  { title: "Creative Visual Design", text: "Brand and campaign visuals, and supporting graphics for digital communication.", points: [] },
];

export const TOOLS = [
  ["Editing & finishing", "DaVinci Resolve, Adobe Premiere Pro, Adobe Audition"],
  ["Motion & VFX", "Adobe After Effects"],
  ["Stills & design", "Adobe Photoshop, Lightroom, Illustrator, InDesign"],
  ["3D", "Blender"],
] as const;

export const PRACTICE = "Videography · Editing · Visual effects · Motion graphics · Photography · 3D";

export const PROFILE_SUMMARY = "Long Sengchhun is a visual creative in Phnom Penh, Cambodia, working across videography, editing, visual effects, motion graphics, photography and 3D, and building post-production software under LASTFX Studio.";
