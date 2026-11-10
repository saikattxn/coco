import type { Metadata } from "next";
import Link from "next/link";
import { getContentBlocks, getMenu, getPageSeo, getSite } from "@/server/public-data";
import { PageHero } from "@/components/site/section";
import { TrackedLink } from "@/components/site/tracked-link";
import { MenuBrowser, type MenuCategoryView } from "./menu-browser";
import { appUrl } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo("/menu");
  return {
    title: seo?.title || "Menu — Indian Restaurant & Takeaway, Princes Risborough",
    description: seo?.description || "Our full menu: tandoori grills, house specials, seafood, biryani, vegetarian dishes and breads, with spice levels and allergen guidance.",
    alternates: { canonical: "/menu" },
  };
}

export default async function MenuPage() {
  const [menu, site, content] = await Promise.all([getMenu(), getSite(), getContentBlocks()]);
  const categories: MenuCategoryView[] = menu.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    items: c.items.map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      pricePence: i.pricePence,
      spiceLevel: i.spiceLevel,
      isVegetarian: i.isVegetarian,
      available: i.available,
      allergenInfoVerified: i.allergenInfoVerified,
      allergenNote: i.allergenNote,
      allergens: i.allergens.map((a) => ({ key: a.allergen.key, name: a.allergen.name })),
      tags: i.dietaryTags.map((t) => t.tag.key),
    })),
  }));
  const notice = content["menu.allergyNotice"];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: `${site.restaurantName} menu`,
    url: appUrl("/menu"),
    hasMenuSection: categories.map((c) => ({
      "@type": "MenuSection",
      name: c.name,
      hasMenuItem: c.items.filter((i) => i.available).map((i) => ({
        "@type": "MenuItem",
        name: i.name,
        description: i.description ?? undefined,
        offers: { "@type": "Offer", price: (i.pricePence / 100).toFixed(2), priceCurrency: "GBP" },
        ...(i.isVegetarian ? { suitableForDiet: "https://schema.org/VegetarianDiet" } : {}),
      })),
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageHero title="Our menu" intro="Northern Indian and Bangladeshi dishes, cooked fresh to order. Any dish not on the menu can be prepared on request.">
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/book" className="btn btn-gold">Book a table</Link>
          {site.orderingEnabled && <TrackedLink href={site.orderingUrl} event="order_click" className="btn btn-outline text-ivory">Order online</TrackedLink>}
        </div>
      </PageHero>
      <div className="wrap py-8">
        <aside aria-labelledby="allergy-notice" className="rounded-xl border border-gold/60 bg-ivory p-5 md:p-6">
          <h2 id="allergy-notice" className="font-display text-2xl text-wine">{notice?.title || "Allergies & dietary requirements"}</h2>
          <p className="mt-2 max-w-3xl text-ink-soft">{notice?.body}</p>
        </aside>
      </div>
      <MenuBrowser categories={categories} phone={site.phonePrimary} />
    </>
  );
}
