// Serialises structured data for a <script type="application/ld+json"> tag. JSON.stringify leaves "<"
// untouched, so a project title containing "</script>" could otherwise end the tag early and inject markup.
const LINE_SEPARATOR = String.fromCharCode(8232);
const PARAGRAPH_SEPARATOR = String.fromCharCode(8233);

export const toJsonLd = (data: unknown) => JSON.stringify(data)
  .replaceAll("<", "\\u003c")
  .replaceAll(LINE_SEPARATOR, "\\u2028")
  .replaceAll(PARAGRAPH_SEPARATOR, "\\u2029");
