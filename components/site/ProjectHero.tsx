"use client";

import { useState } from "react";
import Picture from "@/components/ui/Picture";
import { Play } from "@/components/ui/Icon";

type Props = { title: string; cover: string; videoSrc?: string; embedSrc?: string; vertical?: boolean };

// Opens on the poster frame; the video only loads once the visitor presses play.
export default function ProjectHero({ title, cover, videoSrc, embedSrc, vertical }: Props) {
  const [playing, setPlaying] = useState(false);
  const playable = Boolean(videoSrc || embedSrc);
  return <div className="phero">
    {cover && <div className="phero__backdrop" aria-hidden="true"><Picture src={cover} alt="" fill sizes="50vw" quality={30} /></div>}
    <div className={`phero__frame${vertical ? " phero__frame--vertical" : ""}`}>
      {playing && videoSrc && <video className="phero__video" src={videoSrc} controls autoPlay playsInline />}
      {playing && !videoSrc && embedSrc && <iframe className="phero__video" src={`${embedSrc}${embedSrc.includes("?") ? "&" : "?"}autoplay=1`} title={`${title} video`} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />}
      {!playing && <>
        {cover ? <Picture src={cover} alt={title} fill priority sizes="100vw" quality={85} className="phero__img" /> : <div className="phero__blank" />}
        {playable && <button type="button" className="phero__play btn btn--glass btn--lg" onClick={() => setPlaying(true)} aria-label={`Play ${title}`}><Play /> Play film</button>}
      </>}
    </div>
  </div>;
}
