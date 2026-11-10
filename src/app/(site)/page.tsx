import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Car, Clock, GlassWater, MapPin } from "lucide-react";
import { getActiveOffers, getContentBlocks, getFeaturedDishes, getGallery, getMenu, getOpeningHours, getPageSeo, getSite } from "@/server/public-data";
import { summariseHours, openingHoursSpec } from "@/lib/hours";
import { paragraphs, telHref } from "@/lib/format";
import { appUrl } from "@/lib/env";
import { MenuLine } from "@/components/site/menu-line";
import { SectionHeading } from "@/components/site/section";
import { TrackedLink } from "@/components/site/tracked-link";
import { MapEmbed } from "@/components/site/map-embed";

export async function generateMetadata(): Promise<Metadata> {
  const [site, seo] = await Promise.all([getSite(), getPageSeo("/")]);
  return {
    title: { absolute: seo?.title || site.seoTitle || "Coco Tamarind | Indian Restaurant in Princes Risborough" },
    description: seo?.description || site.seoDescription || undefined,
    alternates: { canonical: "/" },
    openGraph: { type: "website", url: "/", siteName: site.restaurantName, locale: "en_GB", images: seo?.ogImageUrl ? [seo.ogImageUrl] : undefined },
  };
}

type Testimonial = { quote: string; author: string; source?: string };

export default async function HomePage() {
  const [site, content, featured, menu, offers, gallery, { hours }] = await Promise.all([
    getSite(),
    getContentBlocks(),
    getFeaturedDishes(),
    getMenu(),
    getActiveOffers(),
    getGallery(),
    getOpeningHours(),
  ]);
  const hero = content["home.hero"];
  const heroImage = (hero?.data?.imageUrl as string | undefined) ?? gallery.find((g) => g.category === "FOOD")?.url;
  const heroAlt = (hero?.data?.imageAlt as string | undefined) ?? gallery.find((g) => g.category === "FOOD")?.alt ?? "";
  const storyImage = gallery.find((g) => g.category === "INTERIOR") ?? gallery.find((g) => g.category === "DINING");
  const atmosphere = gallery.filter((g) => g.url !== heroImage).slice(0, 4);
  const testimonials = ((content["home.testimonials"]?.data as unknown as { items?: Testimonial[] })?.items ?? []).filter((t) => t.quote && t.author);
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${site.restaurantName}, ${site.addressLine1}, ${site.postcode}`)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": appUrl("/#restaurant"),
    name: site.restaurantName,
    url: appUrl("/"),
    telephone: site.phonePrimary.replace(/^0/, "+44 "),
    email: site.email,
    servesCuisine: ["Indian", "Bangladeshi"],
    priceRange: "££",
    acceptsReservations: appUrl("/book"),
    hasMenu: appUrl("/menu"),
    image: gallery.slice(0, 3).map((g) => g.url),
    address: {
      "@type": "PostalAddress",
      streetAddress: [site.addressLine1, site.addressLine2].filter(Boolean).join(", "),
      addressLocality: site.town,
      addressRegion: site.county ?? undefined,
      postalCode: site.postcode,
      addressCountry: "GB",
    },
    ...(site.latitude && site.longitude ? { geo: { "@type": "GeoCoordinates", latitude: site.latitude, longitude: site.longitude } } : {}),
    openingHoursSpecification: openingHoursSpec(hours),
    sameAs: [site.facebookUrl, site.instagramUrl, site.tripadvisorUrl].filter(Boolean),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-wine-deep text-ivory">
        <div className="wrap grid items-center gap-10 pb-16 pt-10 md:pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-24">
          <div>
            <h1 className="text-display">{hero?.title || "Fine Indian dining in Princes Risborough"}</h1>
            <p className="prose-measure mt-6 text-lg text-ivory/80 md:text-xl">{hero?.body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/book" className="btn btn-gold">Book a table</Link>
              {site.orderingEnabled && (
                <TrackedLink href={site.orderingUrl} event="order_click" className="btn btn-outline text-ivory">
                  Order collection or delivery
                </TrackedLink>
              )}
            </div>
            <dl className="mt-10 grid max-w-lg gap-x-8 gap-y-4 text-sm text-ivory/75 sm:grid-cols-2">
              <div className="flex gap-3">
                <dt><MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-gold-light" /><span className="sr-only">Address</span></dt>
                <dd>{site.addressLine1}, {site.addressLine2}, {site.town} {site.postcode}</dd>
              </div>
              <div className="flex gap-3">
                <dt><Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-gold-light" /><span className="sr-only">Opening hours</span></dt>
                <dd>{summariseHours(hours).map((h) => <span key={h.label} className="block">{h.label}: {h.value}</span>)}</dd>
              </div>
            </dl>
          </div>
          <div className="mx-auto w-full max-w-[17rem] sm:max-w-xs lg:max-w-md">
            <div className="arch-frame">
              <div className="arch relative aspect-[3/4] bg-wine">
                {heroImage && <Image src={heroImage} alt={heroAlt} fill priority sizes="(min-width: 1024px) 28rem, 22rem" className="object-cover" />}
              </div>
            </div>
          </div>
        </div>
        <div aria-hidden className="h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
      </section>

      {/* Introduction */}
      <section className="wrap grid gap-12 py-20 md:py-28 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <h2 className="text-title text-wine">{content["home.intro"]?.title}</h2>
          <div className="prose-measure mt-6 space-y-4 text-lg">
            {paragraphs(content["home.intro"]?.body).map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </div>
        <ul className="space-y-6 self-end border-l border-gold/50 pl-6 text-ink-soft lg:mb-2">
          <li className="flex gap-3"><GlassWater aria-hidden className="mt-1 size-5 shrink-0 text-gold" /><span><strong className="text-ink">The serpentine bar</strong> for pre-dinner drinks, street food and tapas</span></li>
          <li className="flex gap-3"><Clock aria-hidden className="mt-1 size-5 shrink-0 text-gold" /><span><strong className="text-ink">Open seven days</strong>, lunch and dinner — including bank holidays</span></li>
          {site.parkingInfo && <li className="flex gap-3"><Car aria-hidden className="mt-1 size-5 shrink-0 text-gold" /><span><strong className="text-ink">{site.parkingInfo}</strong></span></li>}
        </ul>
      </section>

      {/* Signature dishes */}
      {featured.length > 0 && (
        <section aria-labelledby="signature" className="bg-ivory py-20 md:py-28">
          <div className="wrap">
            <SectionHeading id="signature" title="Signature dishes" intro="A few of the dishes our guests come back for, from the tandoor and the chef's specials." />
            <div className="mt-12 grid gap-x-16 gap-y-9 md:grid-cols-2">
              {featured.map((d) => (
                <MenuLine key={d.id} name={d.name} price={d.pricePence} description={d.description} spice={d.spiceLevel} veg={d.isVegetarian} />
              ))}
            </div>
            <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/menu" className="btn btn-primary">See the full menu</Link>
              <Link href="/menu#house-specials" className="font-semibold text-wine underline decoration-gold underline-offset-4">Chef&apos;s house specials</Link>
            </div>
          </div>
        </section>
      )}

      {/* Categories index */}
      <section aria-labelledby="categories" className="wrap py-20 md:py-24">
        <h2 id="categories" className="text-title text-wine">On the menu</h2>
        <ul className="mt-8 flex flex-wrap gap-x-2 gap-y-3">
          {menu.map((c) => (
            <li key={c.id}>
              <Link href={`/menu#${c.slug}`} className="inline-block rounded-full border border-line bg-ivory px-4 py-2 font-display text-xl text-ink transition-colors hover:border-wine hover:text-wine">
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Story */}
      <section aria-labelledby="story" className="bg-wine text-ivory">
        <div className="wrap grid items-center gap-12 py-20 md:py-28 lg:grid-cols-2">
          {storyImage && (
            <div className="mx-auto w-full max-w-md">
              <div className="arch relative aspect-[4/5] bg-wine-deep">
                <Image src={storyImage.url} alt={storyImage.alt} fill sizes="(min-width: 1024px) 28rem, 90vw" className="object-cover" />
              </div>
            </div>
          )}
          <div>
            <h2 id="story" className="text-title">{content["home.story"]?.title}</h2>
            <div className="prose-measure mt-6 space-y-4 text-lg text-ivory/85">
              {paragraphs(content["home.story"]?.body).map((p, i) => <p key={i}>{p}</p>)}
            </div>
            <Link href="/about" className="btn btn-outline mt-8 text-ivory">Read our story</Link>
          </div>
        </div>
      </section>

      {/* Atmosphere */}
      {atmosphere.length > 0 && (
        <section aria-labelledby="atmosphere" className="wrap py-20 md:py-28">
          <SectionHeading id="atmosphere" title="The restaurant" intro="A spacious dining room, the serpentine bar, and dishes fresh from the tandoor." />
          <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
            {atmosphere.map((g, i) => (
              <li key={g.id} className={i === 0 ? "col-span-2 row-span-2" : ""}>
                <div className={`relative overflow-hidden rounded-lg bg-wine/10 ${i === 0 ? "aspect-square" : "aspect-[4/3] md:aspect-square"}`}>
                  <Image src={g.url} alt={g.alt} fill sizes={i === 0 ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"} className="object-cover" />
                </div>
              </li>
            ))}
          </ul>
          <Link href="/gallery" className="mt-8 inline-block font-semibold text-wine underline decoration-gold underline-offset-4">View the gallery</Link>
        </section>
      )}

      {/* Testimonials (only approved quotes) and review links */}
      <section aria-labelledby="reviews" className="bg-ivory py-20 md:py-24">
        <div className="wrap">
          <SectionHeading id="reviews" title="What our guests say" intro="Read honest reviews from people who have dined with us, or leave your own." />
          {testimonials.length > 0 && (
            <ul className="mt-10 grid gap-10 md:grid-cols-3">
              {testimonials.slice(0, 3).map((t, i) => (
                <li key={i}>
                  <figure>
                    <blockquote className="font-display text-2xl leading-snug text-ink">“{t.quote}”</blockquote>
                    <figcaption className="mt-3 text-sm text-ink-soft">{t.author}{t.source ? `, ${t.source}` : ""}</figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-10 flex flex-wrap gap-3">
            {site.tripadvisorUrl && <a href={site.tripadvisorUrl} className="btn btn-outline text-wine" target="_blank" rel="noopener">Read reviews on Tripadvisor</a>}
            {site.googleReviewsUrl && <a href={site.googleReviewsUrl} className="btn btn-outline text-wine" target="_blank" rel="noopener">Read reviews on Google</a>}
          </div>
        </div>
      </section>

      {/* Offers */}
      {offers.length > 0 && (
        <section aria-labelledby="offers" className="wrap py-20 md:py-24">
          <SectionHeading id="offers" title="Current offers" />
          <ul className="mt-10 grid gap-6 md:grid-cols-2">
            {offers.slice(0, 2).map((o) => (
              <li key={o.id} className="rounded-2xl border border-gold/50 bg-ivory p-7">
                <h3 className="font-display text-3xl text-wine">{o.title}</h3>
                <p className="mt-3 text-ink-soft">{o.description}</p>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  {o.ctaUrl && (
                    <TrackedLink href={o.ctaUrl} event="order_click" className="btn btn-primary">{o.ctaLabel || "Find out more"}</TrackedLink>
                  )}
                  <Link href="/offers" className="text-sm text-ink-soft underline underline-offset-4">Terms apply</Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Celebrations */}
      <section aria-labelledby="celebrate" className="bg-wine-deep text-ivory">
        <div className="wrap flex flex-col gap-8 py-20 md:flex-row md:items-end md:justify-between md:py-24">
          <SectionHeading id="celebrate" tone="light" title={content["home.celebrations"]?.title || "Celebrate with us"} intro={content["home.celebrations"]?.body} />
          <Link href="/celebrations" className="btn btn-gold shrink-0">Plan a celebration</Link>
        </div>
      </section>

      {/* Book & order */}
      <section className="wrap grid gap-6 py-20 md:grid-cols-2 md:py-24">
        <div className="rounded-2xl bg-wine p-8 text-ivory md:p-10">
          <h2 className="font-display text-4xl">Reserve your table</h2>
          <p className="mt-3 text-ivory/80">Choose a time that suits you and we&apos;ll confirm by email straight away.</p>
          <Link href="/book" className="btn btn-gold mt-7">Book a table</Link>
        </div>
        <div className="rounded-2xl border border-line bg-ivory p-8 md:p-10">
          <h2 className="font-display text-4xl text-wine">Takeaway at home</h2>
          <p className="mt-3 text-ink-soft">Order online for collection or delivery. Pay by card, cash or Apple Pay.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            {site.orderingEnabled && <TrackedLink href={site.orderingUrl} event="order_click" className="btn btn-primary">Order online</TrackedLink>}
            <TrackedLink href={telHref(site.phonePrimary)} event="phone_click" className="btn btn-outline text-wine">Call {site.phonePrimary}</TrackedLink>
          </div>
        </div>
      </section>

      {/* Location */}
      <section aria-labelledby="find-us" className="bg-ivory">
        <div className="wrap grid gap-10 py-20 md:py-24 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 id="find-us" className="text-title text-wine">Find us</h2>
            <address className="mt-6 text-lg not-italic">
              {site.restaurantName}<br />
              {site.addressLine1}, {site.addressLine2}<br />
              {site.town}, {site.county}<br />
              {site.postcode}
            </address>
            <p className="mt-4 text-ink-soft">On Aylesbury Road (A4010) in Askett, just outside Princes Risborough. {site.parkingInfo}</p>
            <TrackedLink href={mapsUrl} event="directions_click" target="_blank" rel="noopener" className="btn btn-primary mt-7">Get directions</TrackedLink>
          </div>
          <MapEmbed query={`${site.restaurantName}, ${site.addressLine1}, ${site.postcode}`} />
        </div>
      </section>
    </>
  );
}
