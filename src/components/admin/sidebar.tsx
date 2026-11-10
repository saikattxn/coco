"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BadgePercent, CalendarDays, ChartColumn, FileText, History, Images, Inbox, LayoutDashboard, Menu, Settings, ShieldCheck, Users, UtensilsCrossed, X } from "lucide-react";
import { ArchMark } from "@/components/site/logo";

const ICONS = { BadgePercent, CalendarDays, ChartColumn, FileText, History, Images, Inbox, LayoutDashboard, Settings, ShieldCheck, Users, UtensilsCrossed };

export function Sidebar({ items, user, logout }: { items: { href: string; label: string; icon: string; badge?: number }[]; user: { name: string; role: string }; logout: () => Promise<void> }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between bg-wine-deep px-4 text-ivory lg:hidden">
        <Link href="/admin" className="flex items-center gap-2 font-display text-xl"><ArchMark className="h-6 w-5 text-gold" /> Coco Tamarind</Link>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="admin-nav" className="grid size-10 place-items-center">
          {open ? <X aria-hidden /> : <Menu aria-hidden />}<span className="sr-only">Menu</span>
        </button>
      </div>
      <aside id="admin-nav" className={`${open ? "block" : "hidden"} fixed inset-x-0 bottom-0 top-14 z-20 overflow-y-auto bg-wine-deep text-ivory lg:sticky lg:top-0 lg:block lg:h-dvh lg:w-64 lg:shrink-0`}>
        <div className="hidden px-5 pb-4 pt-6 lg:block">
          <Link href="/admin" className="flex items-center gap-2 font-display text-2xl"><ArchMark className="h-7 w-5 text-gold" /> Coco Tamarind</Link>
        </div>
        <nav aria-label="Dashboard" className="px-3 py-2">
          <ul className="space-y-0.5" onClick={() => setOpen(false)}>
            {items.map((i) => {
              const Icon = ICONS[i.icon as keyof typeof ICONS];
              return (
                <li key={i.href}>
                  <Link href={i.href} aria-current={active(i.href) ? "page" : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.95rem] ${active(i.href) ? "bg-white/12 text-ivory" : "text-ivory/75 hover:bg-white/8 hover:text-ivory"}`}>
                    {Icon && <Icon aria-hidden className="size-4.5" />}
                    <span className="flex-1">{i.label}</span>
                    {i.badge ? <span className="rounded-full bg-gold-light px-2 text-xs font-bold text-wine-deep">{i.badge}<span className="sr-only"> need attention</span></span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="mt-4 border-t border-white/10 px-5 py-5 text-sm">
          <p className="font-semibold">{user.name}</p>
          <p className="text-ivory/60">{user.role}</p>
          <div className="mt-3 flex gap-4">
            <Link href="/admin/account" className="underline underline-offset-4">My account</Link>
            <form action={logout}><button className="underline underline-offset-4">Sign out</button></form>
          </div>
          <Link href="/" className="mt-3 inline-block text-ivory/60 underline underline-offset-4">View website</Link>
        </div>
      </aside>
    </>
  );
}
