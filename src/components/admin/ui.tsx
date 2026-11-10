import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="font-display text-4xl text-wine">{title}</h1>
        {description && <p className="mt-1 text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, children, className, actions }: { title?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cn("rounded-xl border border-line bg-white p-5", className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-lg font-semibold text-ink">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-[#fff3d6] text-[#7a5300]",
  CONFIRMED: "bg-[#e3f1e6] text-[#24603a]",
  CANCELLED: "bg-[#f1e4e4] text-[#8f2a2a]",
  COMPLETED: "bg-[#e7e9f3] text-[#3a4479]",
  NO_SHOW: "bg-[#efe6ef] text-[#6b2f6b]",
  NEW: "bg-[#fff3d6] text-[#7a5300]",
  IN_PROGRESS: "bg-[#e7eef7] text-[#2b4f7a]",
  RESPONDED: "bg-[#e3f1e6] text-[#24603a]",
  CLOSED: "bg-[#ececec] text-[#555]",
  SPAM: "bg-[#f1e4e4] text-[#8f2a2a]",
  SENT: "bg-[#e3f1e6] text-[#24603a]",
  QUEUED: "bg-[#fff3d6] text-[#7a5300]",
  SENDING: "bg-[#e7eef7] text-[#2b4f7a]",
  FAILED: "bg-[#f1e4e4] text-[#8f2a2a]",
  SKIPPED: "bg-[#ececec] text-[#555]",
  ACTIVE: "bg-[#e3f1e6] text-[#24603a]",
  INACTIVE: "bg-[#ececec] text-[#555]",
};

export function Badge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_STYLES[status] ?? "bg-[#ececec] text-[#555]")}>
      {label ?? status.replace("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
    </span>
  );
}

export function Stat({ label, value, hint, href }: { label: string; value: ReactNode; hint?: ReactNode; href?: string }) {
  const body = (
    <>
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-4xl text-ink tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="block rounded-xl border border-line bg-white p-5 hover:border-wine">{body}</Link>
  ) : (
    <div className="rounded-xl border border-line bg-white p-5">{body}</div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line p-8 text-center">
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-1 text-sm text-ink-soft">{children}</div>}
    </div>
  );
}

export function Flash({ message, tone = "ok" }: { message?: string | null; tone?: "ok" | "error" }) {
  if (!message) return null;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("mb-5 rounded-lg border p-3 text-sm", tone === "ok" ? "border-[#b9dcc3] bg-[#eef8f1] text-[#24603a]" : "border-bad/40 bg-[#fbeceb] text-bad")}>
      {message}
    </div>
  );
}

export const th = "px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft";
export const td = "px-3 py-3 align-top";
export const smallBtn = "inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-sm font-semibold hover:border-wine hover:text-wine disabled:opacity-50";
export const primaryBtn = "inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-wine px-4 text-sm font-semibold text-ivory hover:bg-wine-deep disabled:opacity-50";
