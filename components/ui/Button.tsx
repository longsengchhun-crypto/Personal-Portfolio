import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";

type Variant = "primary" | "accent" | "glass" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export function buttonClass({ variant = "primary", size = "md", block, icon, className = "" }: { variant?: Variant; size?: Size; block?: boolean; icon?: boolean; className?: string }) {
  return ["btn", `btn--${variant}`, size !== "md" && `btn--${size}`, block && "btn--block", icon && "btn--icon", className].filter(Boolean).join(" ");
}

type CommonProps = { variant?: Variant; size?: Size; block?: boolean; icon?: boolean; children: ReactNode };

export function Button({ variant, size, block, icon, className, state, children, ...rest }: CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { state?: "loading" | "success" }) {
  return <button type="button" {...rest} className={buttonClass({ variant, size, block, icon, className })} data-state={state} aria-busy={state === "loading" || undefined}>{children}</button>;
}

export function LinkButton({ variant, size, block, icon, className, children, ...rest }: CommonProps & ComponentProps<typeof Link>) {
  return <Link {...rest} className={buttonClass({ variant, size, block, icon, className })}>{children}</Link>;
}
