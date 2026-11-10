import { db } from "@/lib/db";
import { can, requirePermission } from "@/server/auth";
import { PageHeader, Panel } from "@/components/admin/ui";
import { BlockForm, PageSeoForm, SiteSettingsForm, TestimonialsForm } from "./forms";

const BLOCKS: [string, string, string?][] = [
  ["home.hero", "Homepage — first screen", "The heading and line visitors see first."],
  ["home.intro", "Homepage — welcome"],
  ["home.story", "Homepage — our story"],
  ["home.celebrations", "Homepage — celebrations"],
  ["about.story", "About — main story"],
  ["about.heritage", "About — heritage"],
  ["about.ingredients", "About — ingredients"],
  ["about.hospitality", "About — hospitality"],
  ["celebrations.intro", "Celebrations page — introduction"],
  ["menu.allergyNotice", "Menu — allergy notice", "Shown at the top of the menu. Review with the kitchen."],
];
const SEO_PATHS = ["/", "/menu", "/book", "/about", "/celebrations"];

export default async function ContentAdmin() {
  const user = await requirePermission("content.write");
  const [blocks, site, seo] = await Promise.all([db.contentBlock.findMany(), db.siteSettings.findUniqueOrThrow({ where: { id: "default" } }), db.pageSeo.findMany()]);
  const b = Object.fromEntries(blocks.map((x) => [x.key, x]));
  const testimonials = ((b["home.testimonials"]?.data as { items?: { quote: string; author: string; source?: string }[] } | null)?.items ?? []);
  return (
    <>
      <PageHeader title="Website content" description="Edit the words on the website. Changes are published as soon as you save." />
      <div className="space-y-6">
        <Panel title="Contact details, links & opening note">
          <SiteSettingsForm site={site as unknown as Record<string, string | boolean | number | null>} />
        </Panel>
        <Panel title="Page text">
          <div className="grid gap-8 lg:grid-cols-2">
            {BLOCKS.map(([key, label, hint]) => (
              <BlockForm key={key} blockKey={key} label={label} hint={hint} title={b[key]?.title ?? ""} body={b[key]?.body ?? ""} />
            ))}
          </div>
        </Panel>
        <Panel title="Guest testimonials (homepage)">
          <p className="mb-4 text-sm text-ink-soft">Only publish genuine comments you have permission to use. Leave empty to show review links only.</p>
          <TestimonialsForm items={testimonials} />
        </Panel>
        {can(user, "seo.write") && (
          <Panel title="Search engine titles & descriptions">
            <p className="text-sm text-ink-soft">Leave blank to use the defaults. Opening hours, address and opening times are sent to Google automatically.</p>
            {SEO_PATHS.map((p) => {
              const row = seo.find((s) => s.path === p);
              return <PageSeoForm key={p} path={p} title={row?.title ?? ""} description={row?.description ?? ""} />;
            })}
          </Panel>
        )}
      </div>
    </>
  );
}
