import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";

/**
 * Cached reads for public pages. Each is tagged; admin mutations call updateTag(tag)
 * so edits appear immediately while visitors get fast, pre-rendered pages.
 */
export const TAGS = { booking: "booking", site: "site", content: "content", hours: "hours", menu: "menu", offers: "offers", gallery: "gallery", seo: "seo" } as const;

export async function getSite() {
  "use cache";
  cacheTag(TAGS.site);
  cacheLife("days");
  const s = await db.siteSettings.findUnique({ where: { id: "default" } });
  if (!s) throw new Error("Site settings missing — run `npm run db:seed`.");
  return s;
}

export async function getContentBlocks() {
  "use cache";
  cacheTag(TAGS.content);
  cacheLife("days");
  const blocks = await db.contentBlock.findMany();
  return Object.fromEntries(blocks.map((b) => [b.key, { title: b.title ?? "", body: b.body ?? "", data: (b.data ?? {}) as Record<string, string> }]));
}

export async function getOpeningHours() {
  "use cache";
  cacheTag(TAGS.hours);
  cacheLife("days");
  const [hours, closures] = await Promise.all([
    db.openingHours.findMany({ orderBy: [{ weekday: "asc" }, { period: "asc" }] }),
    db.closureDate.findMany({ orderBy: { date: "asc" } }),
  ]);
  return { hours, closures };
}

export async function getMenu() {
  "use cache";
  cacheTag(TAGS.menu);
  cacheLife("days");
  return db.menuCategory.findMany({
    where: { visible: true, deletedAt: null, items: { some: { deletedAt: null } } },
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        where: { deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: { allergens: { include: { allergen: true } }, dietaryTags: { include: { tag: true } } },
      },
    },
  });
}

export async function getFeaturedDishes() {
  "use cache";
  cacheTag(TAGS.menu);
  cacheLife("days");
  return db.menuItem.findMany({
    where: { featured: true, available: true, deletedAt: null, category: { visible: true, deletedAt: null } },
    orderBy: [{ sortOrder: "asc" }],
    include: { category: true },
    take: 6,
  });
}

export async function getActiveOffers() {
  "use cache";
  cacheTag(TAGS.offers);
  cacheLife("hours"); // start/end dates take effect within the hour
  const now = new Date();
  return db.offer.findMany({
    where: {
      active: true,
      deletedAt: null,
      AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
}

export async function getGallery() {
  "use cache";
  cacheTag(TAGS.gallery);
  cacheLife("days");
  return db.galleryImage.findMany({ where: { published: true, deletedAt: null }, orderBy: [{ category: "asc" }, { sortOrder: "asc" }] });
}

export async function getPageSeo(path: string) {
  "use cache";
  cacheTag(TAGS.seo);
  cacheLife("days");
  return db.pageSeo.findUnique({ where: { path } });
}

export async function getPublicBookingSettings() {
  "use cache";
  cacheTag(TAGS.booking);
  cacheLife("days");
  const s = await db.bookingSettings.findUnique({ where: { id: "default" } });
  if (!s) throw new Error("Booking settings missing — run `npm run db:seed`.");
  return { onlineBookingEnabled: s.onlineBookingEnabled, minPartySize: s.minPartySize, maxOnlinePartySize: s.maxOnlinePartySize, maxDaysAhead: s.maxDaysAhead, autoConfirmMaxParty: s.autoConfirmMaxParty };
}
