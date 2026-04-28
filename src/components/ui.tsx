"use client";

import * as React from "react";

function cn(...values: Array<string | undefined | null | false>) {
  return values.filter(Boolean).join(" ");
}

type ButtonVariant = "primary" | "outline" | "ghost" | "inverted";

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }
>(function Button({ className, variant = "primary", ...props }, ref) {
  const base =
    "inline-flex items-center justify-center rounded-xl font-medium transition-colors disabled:pointer-events-none disabled:opacity-50";

  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-app-primary text-white hover:bg-app-primary-600 active:bg-app-primary-600",
    outline:
      "border border-app-border bg-white text-app-fg hover:bg-app-bg active:bg-app-bg",
    ghost: "bg-transparent text-app-fg hover:bg-app-bg active:bg-app-bg",
    inverted:
      "bg-white text-app-primary hover:bg-white/95 active:bg-white/90 shadow-[0_10px_25px_rgba(0,0,0,0.12)]",
  };

  return (
    <button
      ref={ref}
      className={cn(base, "h-11 px-4 text-[14px]", variants[variant], className)}
      {...props}
    />
  );
});

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-2xl border border-app-border bg-white px-4 text-[14px] text-app-fg outline-none placeholder:text-app-muted focus:border-app-primary focus:ring-4 focus:ring-[rgba(31,91,255,0.12)]",
        className,
      )}
      {...props}
    />
  );
});

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-app-border bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)]",
        className,
      )}
      {...props}
    />
  );
}

export function Chip({
  className,
  active,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={cn(
        "h-8 rounded-full px-3 text-[12px] font-medium transition-colors",
        active
          ? "bg-app-bg text-app-fg"
          : "bg-transparent text-app-muted hover:bg-app-bg",
        className,
      )}
      {...props}
    />
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-app-border", className)} />;
}

