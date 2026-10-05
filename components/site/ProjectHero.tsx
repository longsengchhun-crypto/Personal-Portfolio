"use client";

import { useEffect, useState } from "react";
import Picture from "@/components/ui/Picture";
import { ArrowUpRight, Loader2, Play } from "@/components/ui/Icon";

type Props = {
  title: string;
  cover: string;
  videoSrc?: string;
  embedSrc?: string;
  /** The embedded video is portrait (TikTok, Shorts). Uploaded files measure themselves. */
  vertical?: boolean;
  /** Where the embedded video lives, for the "watch there" fallback. */
  sourceUrl?: string;
  sourceLabel?: string;
};

// Opens on the poster frame; the video only loads once the visitor presses play. An uploaded file plays
// natively at its full resolution and sizes the frame to its own shape; an embed uses the service's player.
export default function ProjectHero({ title, cover, videoSrc, embedSrc, vertical, sourceUrl, sourceLabel }: Props) {
  const [playing, setPlaying] = useState(false);
  const [embedReady, setEmbedReady] = useState(false);
  const [fileVertical, setFileVertical] = useState(false);
  const playable = Boolean(videoSrc || embedSrc);

  // Read just the video's metadata up front so a portrait file gets a portrait frame before it plays.
  useEffect(() => {
    if (!videoSrc) return;
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () => setFileVertical(probe.videoHeight > probe.videoWidth);
    probe.src = videoSrc;
    return () => { probe.removeAttribute("src"); probe.load(); };
  }, [videoSrc]);

  const portrait = videoSrc ? fileVertical : Boolean(vertical);
  const embedUrl = embedSrc ? `${embedSrc}${embedSrc.includes("?") ? "&" : "?"}autoplay=1` : "";

  return <div className="phero">
    {cover && <div className="phero__backdrop" aria-hidden="true"><Picture src={cover} alt="" fill sizes="50vw" quality={30} /></div>}
    <div className={`phero__frame${portrait ? " phero__frame--vertical" : ""}`}>
      {playing && videoSrc && <video className="phero__video" src={videoSrc} poster={undefined} controls autoPlay playsInline preload="auto" controlsList="nodownload" />}
      {playing && !videoSrc && embedUrl && <>
        <iframe className="phero__video" src={embedUrl} title={`${title} video`} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" onLoad={() => setEmbedReady(true)} />
        {!embedReady && <span className="phero__loading" role="status"><Loader2 className="spin" aria-hidden="true" /> Loading video…</span>}
      </>}
      {!playing && <>
        {cover ? <Picture src={cover} alt={title} fill priority sizes="100vw" quality={85} className="phero__img" /> : <div className="phero__blank" />}
        {playable && <button type="button" className="phero__play btn btn--glass btn--lg" onClick={() => setPlaying(true)} aria-label={`Play ${title}`}><Play /> Play film</button>}
      </>}
    </div>
    {playing && !videoSrc && sourceUrl && <p className="phero__help caption">Video slow or not showing? <a className="link-arrow" href={sourceUrl} target="_blank" rel="noopener noreferrer">Watch it on {sourceLabel || "the original site"} <ArrowUpRight /></a></p>}
  </div>;
}
