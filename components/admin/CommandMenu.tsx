"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, Search } from "@/components/ui/Icon";
import { ADMIN_NAV } from "./navigation";

type Command = { id: string; label: string; hint: string; group: "Actions" | "Go to"; run: () => void };

// Ctrl/Cmd+K: jump anywhere or start a common task without hunting through the sidebar.
export default function CommandMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const commands = useMemo<Command[]>(() => {
    const go = (href: string) => () => router.push(href);
    return [
      { id: "new-project", label: "New project", hint: "Create a project", group: "Actions", run: go("/dashboard/projects/new/") },
      { id: "upload", label: "Upload media", hint: "Add images or video", group: "Actions", run: go("/dashboard/media/?upload=1") },
      { id: "homepage", label: "Edit homepage", hint: "Hero slides and showreel", group: "Actions", run: go("/dashboard/settings/?tab=homepage") },
      { id: "messages", label: "View messages", hint: "Open the inbox", group: "Actions", run: go("/dashboard/messages/") },
      { id: "site", label: "Open website", hint: "In a new tab", group: "Actions", run: () => window.open("/", "_blank", "noopener") },
      ...ADMIN_NAV.map((item) => ({ id: `go-${item.label}`, label: item.label, hint: "Go to", group: "Go to" as const, run: go(item.href) })),
      { id: "go-clients", label: "Client accounts", hint: "Go to", group: "Go to", run: go("/dashboard/clients/") },
    ];
  }, [router]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? commands.filter((command) => `${command.label} ${command.hint}`.toLowerCase().includes(q)) : commands;
  }, [commands, query]);

  useEffect(() => { if (open) { setQuery(""); setActive(0); window.setTimeout(() => input.current?.focus(), 30); } }, [open]);
  useEffect(() => { setActive(0); }, [query]);

  if (!open) return null;
  const run = (command?: Command) => { if (!command) return; onClose(); command.run(); };
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") { event.preventDefault(); onClose(); }
    else if (event.key === "ArrowDown") { event.preventDefault(); setActive((value) => Math.min(value + 1, results.length - 1)); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActive((value) => Math.max(value - 1, 0)); }
    else if (event.key === "Enter") { event.preventDefault(); run(results[active]); }
  };

  return <div className="dialog-backdrop cmdk-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="cmdk dialog" role="dialog" aria-modal="true" aria-label="Command menu" onKeyDown={onKeyDown}>
      <div className="cmdk__input"><Search aria-hidden="true" /><input ref={input} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Type a command or page name…" aria-label="Command" role="combobox" aria-expanded="true" aria-controls="cmdk-list" aria-activedescendant={results[active] ? `cmdk-${results[active].id}` : undefined} /><span className="kbd">Esc</span></div>
      <ul className="cmdk__list" id="cmdk-list" role="listbox">
        {results.length === 0 && <li className="cmdk__empty">Nothing matches “{query}”.</li>}
        {results.map((command, index) => <li key={command.id} role="presentation">
          {(index === 0 || results[index - 1].group !== command.group) && <p className="meta cmdk__group">{command.group}</p>}
          <button type="button" id={`cmdk-${command.id}`} role="option" aria-selected={index === active} className="cmdk__item" onMouseMove={() => setActive(index)} onClick={() => run(command)}>
            <span>{command.label}</span><small>{command.hint}</small>{command.id === "site" ? <ArrowUpRight aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
          </button>
        </li>)}
      </ul>
    </div>
  </div>;
}
