import type { ReactNode } from "react";
import { AlertTriangle } from "@/components/ui/Icon";

// Shared frame for the client sign-in / create-account pages (and the admin login).
export default function AuthShell({ kicker, title, intro, error, children, footer }: { kicker: string; title: string; intro: string; error?: string; children: ReactNode; footer?: ReactNode }) {
  return <section className="auth wrap">
    <div className="auth__intro">
      <p className="meta meta--accent">{kicker}</p>
      <h1 className="title">{title}</h1>
      <p className="lede">{intro}</p>
    </div>
    <div className="auth__card glass glass--strong">
      {error && <div className="notice notice--error" role="alert"><AlertTriangle aria-hidden="true" /><span>{error}</span></div>}
      {children}
      {footer && <p className="auth__switch">{footer}</p>}
    </div>
  </section>;
}
