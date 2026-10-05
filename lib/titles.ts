// Turns a raw caption or file name into a clean project title: no hashtags, emoji or "Copy" leftovers
// from design files, no trailing punctuation, and ALL-CAPS captions become Title Case.
// Emoji plus the invisible joiners (variation selector, zero-width joiner) that glue emoji sequences together.
const EMOJI = new RegExp("[\\p{Extended_Pictographic}" + String.fromCharCode(0xfe0f, 0x200d) + "]", "gu");

export function tidyTitle(raw: string, max = 80) {
  let title = raw
    .replace(/#[^\s#]+/g, " ")
    .replace(EMOJI, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s+copy(\s*\d+)?$/i, "")
    .replace(/[\s.|·:;,\-–—]+$/g, "")
    .replace(/^[\s|·:;,\-–—]+/g, "");
  const letters = title.replace(/[^A-Za-z]/g, "");
  if (title.length > 14 && letters.length > 6 && letters === letters.toUpperCase()) {
    title = title.toLowerCase().replace(/(^|[\s(|:-])([a-z])/g, (_, lead: string, char: string) => lead + char.toUpperCase());
  }
  return title.slice(0, max).trim();
}
