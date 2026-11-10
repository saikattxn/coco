import Link from "next/link";
import { ArrowDown, ArrowUp, Eye, EyeOff, Star } from "lucide-react";
import { db } from "@/lib/db";
import { requirePermission } from "@/server/auth";
import { formatPrice } from "@/lib/format";
import { Badge, PageHeader, Panel, smallBtn } from "@/components/admin/ui";
import { categoryMoveAction, menuQuickAction } from "./actions";
import { CategoryForm } from "./category-form";

export default async function MenuAdmin({ searchParams }: PageProps<"/admin/menu">) {
  await requirePermission("menu.write");
  const sp = await searchParams;
  const showDeleted = sp.deleted === "1";
  const categories = await db.menuCategory.findMany({
    where: { deletedAt: null },
    orderBy: { sortOrder: "asc" },
    include: { items: { where: showDeleted ? { deletedAt: { not: null } } : { deletedAt: null }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] } },
  });
  const unverified = await db.menuItem.count({ where: { deletedAt: null, allergenInfoVerified: false } });
  const iconBtn = "grid size-8 place-items-center rounded-md border border-line bg-white hover:border-wine";

  return (
    <>
      <PageHeader
        title="Menu"
        description="Changes appear on the website straight away."
        actions={
          <>
            <Link href={showDeleted ? "/admin/menu" : "/admin/menu?deleted=1"} className={smallBtn}>{showDeleted ? "Back to menu" : "Deleted dishes"}</Link>
            <Link href="/admin/menu/items/new" className="btn btn-primary">Add dish</Link>
          </>
        }
      />
      {unverified > 0 && !showDeleted && (
        <div className="mb-6 rounded-lg border border-[#e8cf91] bg-[#fff7e3] p-4 text-sm text-[#6b4b00]">
          <strong>{unverified} dishes have unverified allergen information.</strong> The website shows &ldquo;to be confirmed — please ask&rdquo; for these. When the kitchen has checked a dish, open it, correct the allergens and tick &ldquo;Allergen information verified&rdquo;.
        </div>
      )}
      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          {categories.map((c, ci) => (
            <Panel
              key={c.id}
              title={`${c.name} (${c.items.length})`}
              actions={
                <div className="flex items-center gap-1.5">
                  {!c.visible && <Badge status="INACTIVE" label="Hidden" />}
                  <form action={categoryMoveAction} className="flex gap-1">
                    <input type="hidden" name="id" value={c.id} />
                    <button name="op" value="up" disabled={ci === 0} className={iconBtn} aria-label={`Move ${c.name} up`}><ArrowUp aria-hidden className="size-4" /></button>
                    <button name="op" value="down" disabled={ci === categories.length - 1} className={iconBtn} aria-label={`Move ${c.name} down`}><ArrowDown aria-hidden className="size-4" /></button>
                  </form>
                  <details className="relative">
                    <summary className={`${smallBtn} cursor-pointer list-none`}>Edit</summary>
                    <div className="absolute right-0 z-10 mt-2 w-80 rounded-xl border border-line bg-white p-4 shadow-lg">
                      <CategoryForm category={{ id: c.id, name: c.name, description: c.description ?? "", visible: c.visible }} />
                      {c.items.length === 0 && (
                        <form action={categoryMoveAction} className="mt-3 border-t border-line pt-3">
                          <input type="hidden" name="id" value={c.id} />
                          <button name="op" value="delete" className="text-sm text-bad underline">Delete empty category</button>
                        </form>
                      )}
                    </div>
                  </details>
                </div>
              }
            >
              {c.items.length === 0 ? (
                <p className="text-sm text-ink-soft">{showDeleted ? "No deleted dishes." : "No dishes yet."}</p>
              ) : (
                <ul className="divide-y divide-line">
                  {c.items.map((i, ii) => (
                    <li key={i.id} className="flex flex-wrap items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <Link href={`/admin/menu/items/${i.id}`} className="font-semibold hover:underline">{i.name}</Link>
                        <span className="ml-2 tabular-nums text-ink-soft">{formatPrice(i.pricePence)}</span>
                        <span className="ml-2 inline-flex gap-1 align-middle">
                          {!i.available && <Badge status="CANCELLED" label="Unavailable" />}
                          {i.featured && <Badge status="CONFIRMED" label="Signature" />}
                          {i.isVegetarian && <Badge status="RESPONDED" label="V" />}
                          {!i.allergenInfoVerified && <Badge status="PENDING" label="Allergens unverified" />}
                        </span>
                      </div>
                      <form action={menuQuickAction} className="flex gap-1">
                        <input type="hidden" name="id" value={i.id} />
                        {showDeleted ? (
                          <button name="op" value="restore" className={smallBtn}>Restore</button>
                        ) : (
                          <>
                            <button name="op" value="toggleAvailable" className={iconBtn} aria-label={i.available ? `Mark ${i.name} unavailable` : `Mark ${i.name} available`} title={i.available ? "Mark unavailable" : "Mark available"}>
                              {i.available ? <Eye aria-hidden className="size-4" /> : <EyeOff aria-hidden className="size-4 text-bad" />}
                            </button>
                            <button name="op" value="toggleFeatured" className={iconBtn} aria-label={i.featured ? `Remove ${i.name} from signature dishes` : `Add ${i.name} to signature dishes`} title="Signature dish">
                              <Star aria-hidden className={`size-4 ${i.featured ? "fill-gold text-gold" : ""}`} />
                            </button>
                            <button name="op" value="up" disabled={ii === 0} className={iconBtn} aria-label={`Move ${i.name} up`}><ArrowUp aria-hidden className="size-4" /></button>
                            <button name="op" value="down" disabled={ii === c.items.length - 1} className={iconBtn} aria-label={`Move ${i.name} down`}><ArrowDown aria-hidden className="size-4" /></button>
                          </>
                        )}
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          ))}
        </div>
        <div>
          <Panel title="Add a category">
            <CategoryForm />
          </Panel>
          <p className="mt-4 text-sm text-ink-soft">Hidden categories (such as Desserts and Drinks, until their menus are added) don&apos;t appear on the website.</p>
        </div>
      </div>
    </>
  );
}
