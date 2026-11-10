import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getContentBlocks, getGallery, getPageSeo } from "@/server/public-data";
import { PageHero } from "@/components/site/section";
import { paragraphs } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo("/about");
  return {
    title: seo?.title || "Our story",
    description: seo?.description || "Northern Indian and Bangladeshi cooking at Askett, near Princes Risborough — fresh ingredients, local produce and warm hospitality.",
    alternates: { canonical: "/about" },
  };
}

export default async function AboutPage() {
  const [c, gallery] = await Promise.all([getContentBlocks(), getGallery()]);
  const story = c["about.story"];
  const sections = ["about.heritage", "about.ingredients", "about.hospitality"].map((k) => c[k]).filter(Boolean);
  const img = gallery.find((g) => g.category === "INTERIOR") ?? gallery[0];
  return (
    <>
      <PageHero title={story?.title || "Our story"} />
      <section className="wrap grid gap-12 py-16 md:py-24 lg:grid-cols-[1.2fr_1fr]">
        <div className="prose-measure space-y-5 text-lg">
          {paragraphs(story?.body).map((p, i) => <p key={i}>{p}</p>)}
        </div>
        {img && (
          <div className="mx-auto w-full max-w-sm">
            <div className="arch relative aspect-[4/5] bg-wine/10">
              <Image src={img.url} alt={img.alt} fill sizes="24rem" className="object-cover" />
            </div>
          </div>
        )}
      </section>
      <section className="bg-ivory">
        <div className="wrap grid gap-12 py-16 md:grid-cols-3 md:py-24">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="font-display text-3xl text-wine">{s.title}</h2>
              <div className="mt-3 space-y-3 text-ink-soft">{paragraphs(s.body).map((p, i) => <p key={i}>{p}</p>)}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="wrap flex flex-wrap items-center justify-between gap-6 py-16">
        <h2 className="font-display text-4xl text-wine">Come and see us</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/book" className="btn btn-primary">Book a table</Link>
          <Link href="/menu" className="btn btn-outline text-wine">View the menu</Link>
        </div>
      </section>
    </>
  );
}
