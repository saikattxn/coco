import Link from "next/link";
import { getSite } from "@/server/public-data";
import { Wordmark } from "./logo";
import { MobileNav } from "./mobile-nav";
import { NAV } from "./nav";
import { TrackedLink } from "./tracked-link";

export async function SiteHeader() {
  const site = await getSite();
  return (
    <header className="sticky top-0 z-50 border-b border-gold/25 bg-wine-deep text-ivory">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-ivory focus:px-3 focus:py-2 focus:text-wine">
        Skip to content
      </a>
      <div className="wrap flex h-[4.5rem] items-center justify-between gap-6">
        <Link href="/" className="shrink-0">
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-7 text-[0.95rem]">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="text-ivory/85 underline-offset-8 transition-colors hover:text-ivory hover:underline decoration-gold">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          {site.orderingEnabled && (
            <TrackedLink href={site.orderingUrl} event="order_click" className="btn btn-outline text-ivory">
              Order online
            </TrackedLink>
          )}
          <Link href="/book" className="btn btn-gold">Book a table</Link>
        </div>
        <MobileNav orderingUrl={site.orderingUrl} />
      </div>
    </header>
  );
}
