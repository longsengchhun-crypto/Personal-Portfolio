export const OWNER = {
  name: "LONG SENGCHHUN",
  title: "Multidisciplinary Creative Designer",
  roles: "Graphic Design | Film | Photography | Video | 3D",
  location: "Phnom Penh, Cambodia",
  phone: "016 590 899",
  email: "longsengchhun@gmail.com",
  telegram: "@SENGCHHUN11",
  telegramUrl: "https://t.me/SENGCHHUN11",
};

export const KHMER = {
  home: "ទំព័រដើម",
  work: "ស្នាដៃ",
  services: "សេវាកម្ម",
  about: "អំពីខ្ញុំ",
  contact: "ទំនាក់ទំនង",
  hero: "បង្កើតស្នាដៃដែលភ្ជាប់ជាមួយគំនិត និងការរចនារបស់លោកអ្នកជាមួយយើងឥឡូវនេះ",
  projectCta: "មានគម្រោងចង់សហការជាមួយខ្ញុំមែនទេ?",
  footerCta: "តោះបង្កើតស្នាដៃដែលមានអត្ថន័យជាមួយគ្នា។",
};

export const SERVICES = [
  ["Graphic Design", "Visual materials for brands, campaigns, social media, presentations, print, and digital communication."],
  ["Poster Design", "Campaign posters, product posters, food and beverage promotions, event visuals, and social-ready artwork designed for clear recognition."],
  ["Video Editing", "Professional editing, pacing, transitions, color correction, sound cleanup, subtitles, motion graphics, and delivery for different platforms."],
  ["Videography and Filmmaking", "Creative planning, shot lists, camera operation, interviews, company videos, events, promotional videos, and cinematic storytelling."],
  ["Photography", "Product, portrait, event, lifestyle, commercial, and corporate photography with professional post-production."],
  ["3D Modeling and Visualization", "3D products, environments, architectural scenes, visual concepts, lighting, materials, and rendering."],
  ["3D Animation", "Camera animation, product animation, environment animation, motion studies, and visual storytelling."],
  ["Social Media Content", "Short-form videos, reels, TikTok content, promotional visuals, campaign content, and platform-ready exports."],
  ["Creative Consultation", "Support with visual direction, content planning, concepts, storyboards, campaign ideas, and production workflows."],
] as const;

export const DISCIPLINES = [
  ["Graphic Design", "graphic-design"],
  ["Video and Film", "video-editing"],
  ["Photography", "photography"],
  ["3D Design and Modeling", "video-and-3d-modeling"],
] as const;

export const SKILLS: Record<string, string[]> = {
  "Creative Design": ["Graphic Design", "Brand Visuals", "Social Media Design", "Poster Design", "Print Design", "Layout Design", "Marketing Materials"],
  "Video Production": ["Video Editing", "Color Correction", "Color Grading", "Motion Graphics", "Audio Cleanup", "Social Media Video", "Promotional Video", "Cinematic Editing"],
  "3D Production": ["3D Modeling", "3D Environment Design", "Product Visualization", "Architectural Visualization", "Lighting", "Rendering", "3D Animation", "Camera Animation"],
  Photography: ["Commercial Photography", "Product Photography", "Portrait Photography", "Event Photography", "Lifestyle Photography", "Photo Editing", "Photo Retouching"],
  "Filmmaking and Videography": ["Creative Direction", "Storyboarding", "Shot Planning", "Camera Operation", "Cinematography", "Interview Production", "Behind-the-Scenes Coverage", "Short-Form Content Production"],
};

export const SOFTWARE = ["Photoshop", "Illustrator", "After Effects", "Premiere Pro", "DaVinci Resolve", "Blender", "CapCut", "CorelDRAW"];

export const EDITING_TOOLS = ["after-effects", "audition", "illustrator", "indesign", "lightroom", "photoshop", "blender", "capcut", "coreldraw", "davinci-resolve", "creative-tool-1", "creative-tool-2"].map((slug) => ({
  name: slug.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" "),
  image: `/static/site-assets/tools/${slug}.png`,
}));

export const SERVICE_CHOICES = ["Graphic Design", "Poster Design", "Video Editing", "Photo / Video Production", "Photography", "Videography", "Filmmaking", "3D Design and Modeling", "3D Modeling", "3D Animation", "Product Visualization", "Motion Graphics", "Social Media Content", "Other"] as const;
export const BUDGET_CHOICES = ["Not decided yet", "Under $100", "$100-$300", "$300-$700", "$700-$1,500", "Above $1,500", "Prefer to discuss privately"] as const;
export const INQUIRY_STATUSES = ["new", "reviewing", "replied", "accepted", "declined", "archived"] as const;
