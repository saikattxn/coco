"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type Img = { id: string; url: string; alt: string; caption: string | null; category: string };
const LABELS: Record<string, string> = { FOOD: "Food", INTERIOR: "Interior", BAR: "Bar", DINING: "Dining", OCCASIONS: "Occasions", EVENTS: "Events" };

export function GalleryGrid({ images }: { images: Img[] }) {
  const cats = [...new Set(images.map((i) => i.category))];
  const [filter, setFilter] = useState<string | null>(null);
  const shown = filter ? images.filter((i) => i.category === filter) : images;
  const [open, setOpen] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setOpen(null);
    returnFocus.current?.focus();
  }, []);
  const step = useCallback((d: number) => setOpen((o) => (o === null ? o : (o + d + shown.length) % shown.length)), [shown.length]);

  useEffect(() => {
    if (open === null) return;
    dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "Tab" && dialogRef.current) {
        const f = [...dialogRef.current.querySelectorAll<HTMLElement>("button")];
        const i = f.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f.at(-1)?.focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0]?.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, step]);

  if (images.length === 0) return <p className="text-ink-soft">Photographs are coming soon.</p>;
  const current = open !== null ? shown[open] : null;

  return (
    <>
      {cats.length > 1 && (
        <div role="group" aria-label="Filter photographs" className="mb-8 flex flex-wrap gap-2">
          {[null, ...cats].map((c) => (
            <button key={c ?? "all"} type="button" aria-pressed={filter === c} onClick={() => setFilter(c)} className={`rounded-full border px-4 py-2 text-sm ${filter === c ? "border-wine bg-wine text-ivory" : "border-line bg-ivory hover:border-wine"}`}>
              {c ? LABELS[c] : "All"}
            </button>
          ))}
        </div>
      )}
      <ul className="columns-2 gap-3 md:columns-3 [&>li]:mb-3">
        {shown.map((img, i) => (
          <li key={img.id} className="break-inside-avoid">
            <button type="button" onClick={(e) => { returnFocus.current = e.currentTarget; setOpen(i); }} className="group block w-full overflow-hidden rounded-lg">
              <span className="relative block aspect-[4/5] bg-wine/10">
                <Image src={img.url} alt={img.alt} fill sizes="(min-width: 768px) 33vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              </span>
              <span className="sr-only">Open larger view</span>
            </button>
            {img.caption && <p className="mt-1.5 text-sm text-ink-soft">{img.caption}</p>}
          </li>
        ))}
      </ul>
      {current && (
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={current.alt} className="fixed inset-0 z-[70] flex flex-col bg-black/90 p-4 text-ivory" onClick={(e) => e.target === e.currentTarget && close()}>
          <div className="flex justify-between">
            <p className="text-sm text-ivory/70" aria-live="polite">{(open ?? 0) + 1} of {shown.length}</p>
            <button type="button" data-autofocus onClick={close} className="grid size-11 place-items-center rounded-full hover:bg-white/10"><X aria-hidden /><span className="sr-only">Close</span></button>
          </div>
          <div className="relative flex-1" onClick={(e) => e.target === e.currentTarget && close()}>
            <Image src={current.url} alt={current.alt} fill sizes="100vw" className="object-contain" />
          </div>
          <div className="flex items-center justify-between gap-4 pt-3">
            <button type="button" onClick={() => step(-1)} className="grid size-11 place-items-center rounded-full hover:bg-white/10"><ChevronLeft aria-hidden /><span className="sr-only">Previous photo</span></button>
            <p className="text-center text-sm">{current.caption || current.alt}</p>
            <button type="button" onClick={() => step(1)} className="grid size-11 place-items-center rounded-full hover:bg-white/10"><ChevronRight aria-hidden /><span className="sr-only">Next photo</span></button>
          </div>
        </div>
      )}
    </>
  );
}
