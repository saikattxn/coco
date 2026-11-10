import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export function SectionHeading({ title, intro, id, className, tone = "dark" }: { title: string; intro?: ReactNode; id?: string; className?: string; tone?: "dark" | "light" }) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <h2 id={id} className={cn("text-title", tone === "dark" ? "text-wine" : "text-ivory")}>{title}</h2>
      {intro && <div className={cn("mt-4 text-lg", tone === "dark" ? "text-ink-soft" : "text-ivory/80")}>{intro}</div>}
    </div>
  );
}

export function PageHero({ title, intro, children }: { title: string; intro?: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-wine-deep text-ivory">
      <div className="wrap relative py-16 md:py-24">
        <h1 className="text-display max-w-3xl">{title}</h1>
        {intro && <div className="prose-measure mt-5 text-lg text-ivory/80">{intro}</div>}
        {children}
      </div>
      <div aria-hidden className="h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
    </section>
  );
}
