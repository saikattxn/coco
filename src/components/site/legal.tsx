import type { ReactNode } from "react";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <article className="wrap max-w-3xl py-14 md:py-20">
      <h1 className="text-title text-wine">{title}</h1>
      <p className="mt-2 text-sm text-ink-soft">Last updated {updated}</p>
      <div className="mt-8 space-y-5 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:text-wine [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">{children}</div>
    </article>
  );
}
