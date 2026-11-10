"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { primaryBtn, smallBtn } from "./ui";

export function Submit({ children, pendingLabel, variant = "primary", name, value, confirm }: { children: ReactNode; pendingLabel?: string; variant?: "primary" | "small" | "danger"; name?: string; value?: string; confirm?: string }) {
  const { pending } = useFormStatus();
  const cls = variant === "primary" ? primaryBtn : variant === "danger" ? `${smallBtn} border-bad/40 text-bad hover:border-bad hover:text-bad` : smallBtn;
  return (
    <button
      type="submit"
      name={name}
      value={value}
      className={cls}
      disabled={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending ? pendingLabel ?? "Saving…" : children}
    </button>
  );
}
