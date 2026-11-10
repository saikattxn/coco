"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV } from "./nav";

export function MobileNav({ orderingUrl }: { orderingUrl: string }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="-mr-2 grid size-11 place-items-center rounded-full text-ivory"
      >
        {open ? <X aria-hidden className="size-6" /> : <Menu aria-hidden className="size-6" />}
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
      </button>
      {open && (
        <div id="mobile-menu" ref={panelRef} onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)} className="fixed inset-x-0 top-[4.5rem] bottom-0 z-40 overflow-y-auto bg-wine-deep px-5 pb-28 pt-4">
          <nav aria-label="Main">
            <ul className="divide-y divide-white/10">
              <li>
                <Link href="/" className="block py-4 font-display text-3xl text-ivory">Home</Link>
              </li>
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="block py-4 font-display text-3xl text-ivory">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-8 grid gap-3">
            <Link href="/book" className="btn btn-gold">Book a table</Link>
            <a href={orderingUrl} className="btn btn-outline text-ivory">Order online</a>
          </div>
        </div>
      )}
    </div>
  );
}
