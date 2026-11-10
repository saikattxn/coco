import Link from "next/link";
import { CalendarDays, Phone, ShoppingBag } from "lucide-react";
import { getSite } from "@/server/public-data";
import { telHref } from "@/lib/format";
import { TrackedLink } from "./tracked-link";

/** Mobile: the three things people come for, always one tap away. */
export async function ActionBar() {
  const site = await getSite();
  const item = "flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[0.8rem] font-semibold";
  return (
    <nav aria-label="Quick actions" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-wine-deep text-ivory pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="flex">
        <Link href="/book" className={`${item} bg-gold-light text-wine-deep`}>
          <CalendarDays aria-hidden className="size-5" /> Book
        </Link>
        {site.orderingEnabled && (
          <TrackedLink href={site.orderingUrl} event="order_click" className={item}>
            <ShoppingBag aria-hidden className="size-5" /> Order
          </TrackedLink>
        )}
        <TrackedLink href={telHref(site.phonePrimary)} event="phone_click" className={item}>
          <Phone aria-hidden className="size-5" /> Call
        </TrackedLink>
      </div>
    </nav>
  );
}
