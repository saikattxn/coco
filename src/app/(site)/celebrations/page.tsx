import type { Metadata } from "next";
import { getContentBlocks, getPageSeo, getSite } from "@/server/public-data";
import { PageHero } from "@/components/site/section";
import { paragraphs, telHref } from "@/lib/format";
import { EventEnquiryForm } from "./event-form";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo("/celebrations");
  return {
    title: seo?.title || "Birthdays, anniversaries & private dining near Princes Risborough",
    description: seo?.description || "Celebrate a birthday, anniversary, family gathering or corporate dinner at Coco Tamarind. Send us an enquiry and we'll help you plan it.",
    alternates: { canonical: "/celebrations" },
  };
}

const OCCASIONS = [
  ["Birthdays", "A table for the family or a bigger get-together — tell us if there's a cake or a surprise."],
  ["Anniversaries", "A quiet table for two, or a celebration with the people who were there."],
  ["Family gatherings", "Dishes to share around the table — let us know if you need high chairs."],
  ["Corporate dinners", "Team meals and client dinners — tell us if you'd like to discuss a set menu."],
  ["Group dining", "Larger parties than our online booking takes — we'll plan the seating."],
  ["Private events", "Talk to us about exclusive use and what's possible."],
] as const;

export default async function CelebrationsPage() {
  const [c, site] = await Promise.all([getContentBlocks(), getSite()]);
  const intro = c["celebrations.intro"];
  return (
    <>
      <PageHero title={intro?.title || "Celebrations & private dining"} intro={paragraphs(intro?.body)[0]} />
      <div className="wrap grid gap-14 py-16 md:py-20 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <ul className="divide-y divide-line border-y border-line">
            {OCCASIONS.map(([title, body]) => (
              <li key={title} className="py-5">
                <h2 className="font-display text-2xl text-wine">{title}</h2>
                <p className="mt-1 text-ink-soft">{body}</p>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-ink-soft">
            Rather talk it through? Call <a href={telHref(site.phonePrimary)} className="underline">{site.phonePrimary}</a>. {site.parkingInfo}
          </p>
        </div>
        <EventEnquiryForm />
      </div>
    </>
  );
}
