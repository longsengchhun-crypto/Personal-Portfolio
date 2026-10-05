import type { ReactNode } from "react";

export default function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: string; actions?: ReactNode; eyebrow?: string }) {
  return <header className="adm-head">
    <div>
      {eyebrow && <p className="meta">{eyebrow}</p>}
      <h1>{title}</h1>
      {description && <p className="adm-head__desc">{description}</p>}
    </div>
    {actions && <div className="adm-head__actions">{actions}</div>}
  </header>;
}
