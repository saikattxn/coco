"use client";

import { useMemo, useState } from "react";
import { MenuLine } from "@/components/site/menu-line";
import { SPICE_LABELS } from "@/lib/format";

export type MenuItemView = {
  id: string;
  name: string;
  description: string | null;
  pricePence: number;
  spiceLevel: number;
  isVegetarian: boolean;
  available: boolean;
  allergenInfoVerified: boolean;
  allergenNote: string | null;
  allergens: { key: string; name: string }[];
  tags: string[];
};
export type MenuCategoryView = { id: string; slug: string; name: string; description: string | null; items: MenuItemView[] };

const ALLERGEN_FILTERS = [
  ["milk", "Milk"],
  ["cereals_gluten", "Gluten"],
  ["eggs", "Eggs"],
  ["crustaceans", "Crustaceans"],
  ["fish", "Fish"],
  ["tree_nuts", "Tree nuts"],
  ["peanuts", "Peanuts"],
  ["mustard", "Mustard"],
  ["soya", "Soya"],
] as const;

export function MenuBrowser({ categories, phone }: { categories: MenuCategoryView[]; phone: string }) {
  const [veg, setVeg] = useState(false);
  const [vegan, setVegan] = useState(false);
  const [glutenFree, setGlutenFree] = useState(false);
  const [maxSpice, setMaxSpice] = useState(4);
  const [avoid, setAvoid] = useState<string[]>([]);

  const anyVegan = categories.some((c) => c.items.some((i) => i.tags.includes("vegan")));
  const anyGf = categories.some((c) => c.items.some((i) => i.tags.includes("gluten_free") && i.allergenInfoVerified));

  const filtered = useMemo(
    () =>
      categories
        .map((c) => ({
          ...c,
          items: c.items.filter(
            (i) =>
              (!veg || i.isVegetarian || i.tags.includes("vegetarian")) &&
              (!vegan || i.tags.includes("vegan")) &&
              // gluten-free only where verified by the kitchen
              (!glutenFree || (i.tags.includes("gluten_free") && i.allergenInfoVerified)) &&
              i.spiceLevel <= maxSpice &&
              avoid.every((a) => !i.allergens.some((x) => x.key === a)),
          ),
        }))
        .filter((c) => c.items.length > 0),
    [categories, veg, vegan, glutenFree, maxSpice, avoid],
  );
  const total = filtered.reduce((n, c) => n + c.items.length, 0);
  const filtering = veg || vegan || glutenFree || maxSpice < 4 || avoid.length > 0;

  return (
    <div className="wrap grid gap-10 pb-24 lg:grid-cols-[16rem_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <details className="group rounded-xl border border-line bg-ivory p-4 lg:open:bg-ivory" open>
          <summary className="cursor-pointer list-none font-semibold text-wine marker:hidden">
            Filter dishes {filtering && <span className="font-normal text-ink-soft">({total} shown)</span>}
          </summary>
          <div className="mt-4 space-y-5 text-[0.95rem]">
            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-semibold">Diet</legend>
              <label className="flex items-center gap-2"><input type="checkbox" checked={veg} onChange={(e) => setVeg(e.target.checked)} className="size-4 accent-[#5a1724]" /> Vegetarian</label>
              <label className={`flex items-center gap-2 ${!anyVegan ? "text-ink-soft" : ""}`}>
                <input type="checkbox" checked={vegan} disabled={!anyVegan} onChange={(e) => setVegan(e.target.checked)} className="size-4 accent-[#5a1724]" /> Vegan
              </label>
              <label className={`flex items-center gap-2 ${!anyGf ? "text-ink-soft" : ""}`}>
                <input type="checkbox" checked={glutenFree} disabled={!anyGf} onChange={(e) => setGlutenFree(e.target.checked)} className="size-4 accent-[#5a1724]" /> Gluten-free
              </label>
              {(!anyVegan || !anyGf) && <p className="text-xs text-ink-soft">Vegan and gluten-free dishes appear here once confirmed by our kitchen. Please ask us — many dishes can be adapted.</p>}
            </fieldset>
            <div>
              <label htmlFor="spice" className="mb-1 block text-sm font-semibold">Spice: up to {SPICE_LABELS[maxSpice].toLowerCase()}</label>
              <input id="spice" type="range" min={0} max={4} step={1} value={maxSpice} onChange={(e) => setMaxSpice(Number(e.target.value))} className="w-full accent-[#5a1724]" aria-valuetext={SPICE_LABELS[maxSpice]} />
            </div>
            <fieldset>
              <legend className="mb-1 text-sm font-semibold">Hide dishes listing</legend>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {ALLERGEN_FILTERS.map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={avoid.includes(key)}
                      onChange={(e) => setAvoid(e.target.checked ? [...avoid, key] : avoid.filter((a) => a !== key))}
                      className="size-4 accent-[#5a1724]"
                    />
                    {label}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink-soft">This hides dishes whose listed ingredients include these allergens. It does not mean the remaining dishes are free from them — always tell us about allergies.</p>
            </fieldset>
            {filtering && (
              <button type="button" className="text-sm font-semibold text-wine underline underline-offset-4" onClick={() => { setVeg(false); setVegan(false); setGlutenFree(false); setMaxSpice(4); setAvoid([]); }}>
                Clear filters
              </button>
            )}
          </div>
        </details>
        <nav aria-label="Menu sections" className="mt-6 hidden lg:block">
          <ul className="space-y-1.5 text-[0.95rem]">
            {filtered.map((c) => (
              <li key={c.id}><a href={`#${c.slug}`} className="text-ink-soft hover:text-wine">{c.name}</a></li>
            ))}
          </ul>
        </nav>
      </aside>

      <div aria-live="polite">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-line bg-ivory p-8">
            <h2 className="font-display text-3xl text-wine">No dishes match those filters</h2>
            <p className="mt-2 text-ink-soft">Try fewer filters, or call us on {phone} — our chefs can often adapt a dish.</p>
          </div>
        ) : (
          filtered.map((c) => (
            <section key={c.id} id={c.slug} aria-labelledby={`h-${c.slug}`} className="scroll-mt-24 border-b border-line py-12 first:pt-0 last:border-0">
              <h2 id={`h-${c.slug}`} className="text-title text-wine">{c.name}</h2>
              {c.description && <p className="mt-2 max-w-2xl text-ink-soft">{c.description}</p>}
              <ul className="mt-8 grid gap-x-14 gap-y-8 xl:grid-cols-2">
                {c.items.map((i) => (
                  <li key={i.id}>
                    <MenuLine name={i.name} price={i.pricePence} description={i.description} spice={i.spiceLevel} veg={i.isVegetarian} unavailable={!i.available}>
                      <AllergenInfo item={i} />
                    </MenuLine>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function AllergenInfo({ item }: { item: MenuItemView }) {
  const names = item.allergens.map((a) => a.name);
  if (item.allergenInfoVerified) {
    return (
      <p className="mt-1.5 text-xs text-ink-soft">
        <span className="font-semibold">Contains:</span> {names.length ? names.join(", ") : "none of the 14 major allergens as an ingredient"} · may contain traces
      </p>
    );
  }
  return (
    <p className="mt-1.5 text-xs text-ink-soft">
      {names.length ? <><span className="font-semibold">Listed allergens:</span> {names.join(", ")}. </> : null}
      Allergen information to be confirmed — please ask our team.
    </p>
  );
}
