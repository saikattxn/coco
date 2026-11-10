import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/server/auth";
import { Flash, PageHeader } from "@/components/admin/ui";
import { MenuItemForm } from "./item-form";
import { storageMode } from "@/server/storage";

export default async function MenuItemPage({ params, searchParams }: PageProps<"/admin/menu/items/[id]">) {
  await requirePermission("menu.write");
  const { id } = await params;
  const sp = await searchParams;
  const isNew = id === "new";
  const [item, categories, allergens, tags] = await Promise.all([
    isNew ? null : db.menuItem.findUnique({ where: { id }, include: { allergens: true, dietaryTags: true } }),
    db.menuCategory.findMany({ where: { deletedAt: null }, orderBy: { sortOrder: "asc" } }),
    db.allergen.findMany({ orderBy: { name: "asc" } }),
    db.dietaryTag.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!isNew && !item) notFound();
  return (
    <>
      <PageHeader title={item ? item.name : "Add a dish"} actions={<Link href="/admin/menu" className="btn btn-outline text-wine">Back to menu</Link>} />
      <Flash message={sp.saved ? "Dish added. The website has been updated." : null} />
      <MenuItemForm
        item={
          item
            ? {
                id: item.id,
                name: item.name,
                description: item.description ?? "",
                price: (item.pricePence / 100).toFixed(2),
                categoryId: item.categoryId,
                spiceLevel: item.spiceLevel,
                isVegetarian: item.isVegetarian,
                available: item.available,
                featured: item.featured,
                bestseller: item.bestseller,
                allergenInfoVerified: item.allergenInfoVerified,
                allergenNote: item.allergenNote ?? "",
                imageUrl: item.imageUrl ?? "",
                imageAlt: item.imageAlt ?? "",
                allergens: item.allergens.map((a) => a.allergenId),
                dietaryTags: item.dietaryTags.map((t) => t.tagId),
              }
            : null
        }
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        allergens={allergens.map((a) => ({ id: a.id, name: a.name }))}
        tags={tags.map((t) => ({ id: t.id, name: t.name, key: t.key }))}
        uploadsEnabled={storageMode() !== "none"}
      />
    </>
  );
}
