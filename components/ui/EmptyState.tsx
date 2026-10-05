import type { ReactNode } from "react";

export default function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return <div className="empty">
    {icon && <span className="empty__icon" aria-hidden="true">{icon}</span>}
    <h2>{title}</h2>
    {children && <p>{children}</p>}
    {action}
  </div>;
}
