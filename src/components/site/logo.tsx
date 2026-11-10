export function ArchMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 32" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M2 31V14C2 7 7 2.5 12 1c5 1.5 10 6 10 13v17" />
      <path d="M6 31V15c0-4.5 3-7.8 6-9 3 1.2 6 4.5 6 9v16" opacity=".55" />
    </svg>
  );
}

export function Wordmark({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <span className={`flex items-center gap-2.5 ${tone === "light" ? "text-ivory" : "text-wine"}`}>
      <ArchMark className="h-8 w-6 text-gold" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.65rem] font-semibold tracking-tight">Coco Tamarind</span>
        <span className={`mt-1 text-[0.7rem] tracking-[0.08em] ${tone === "light" ? "text-gold-light" : "text-ink-soft"}`}>Fine Indian dining · Askett</span>
      </span>
    </span>
  );
}
