"use client";

import { useId, useState } from "react";
import Picture from "@/components/ui/Picture";

// Drag (or arrow-key) the divider to compare the original with the final.
export default function BeforeAfter({ before, after, title }: { before: string; after: string; title: string }) {
  const [position, setPosition] = useState(50);
  const id = useId();
  return <figure className="compare" style={{ ["--pos" as string]: `${position}%` }}>
    <div className="compare__stage">
      <Picture src={after} alt={`${title}, after`} fill sizes="(min-width: 1100px) 1100px, 100vw" className="compare__img" />
      <div className="compare__before"><Picture src={before} alt={`${title}, before`} fill sizes="(min-width: 1100px) 1100px, 100vw" className="compare__img" /></div>
      <span className="compare__tag compare__tag--before meta">Before</span>
      <span className="compare__tag compare__tag--after meta">After</span>
      <span className="compare__handle" aria-hidden="true" />
      <label htmlFor={id} className="sr-only">Reveal before and after</label>
      <input id={id} className="compare__range" type="range" min={0} max={100} value={position} onChange={(event) => setPosition(Number(event.target.value))} />
    </div>
  </figure>;
}
