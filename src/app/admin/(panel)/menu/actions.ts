"use server";

import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/server/auth";
import { audit } from "@/server/audit";
import { TAGS } from "@/server/public-data";
import { fieldErrors, formToObject, menuItemSchema } from "@/lib/validation";
import { parsePriceToPence, slugify } from "@/lib/format";
import { allowedImageUrl, storeImage, UploadError } from "@/server/storage";
import type { FormState } from "@/app/(site)/actions";

async function uniqueSlug(base: string, excludeId?: string) {
  let slug = slugify(base) || "dish";
  for (let i = 2; await db.menuItem.findFirst({ where: { slug, NOT: excludeId ? { id: excludeId } : undefined } }); i++) slug = `${slugify(base)}-${i}`;
  return slug;
}

export async function saveMenuItemAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requirePermission("menu.write");
  const id = String(fd.get("id") || "") || undefined;
  const parsed = menuItemSchema.safeParse(formToObject(fd, ["allergens", "dietaryTags"]));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const pricePence = parsePriceToPence(d.price);
  if (pricePence === null) return { ok: false, errors: { price: "Enter a price like 12.45" } };

  let imageUrl = d.imageUrl ?? null;
  const file = fd.get("imageFile");
  if (file instanceof File && file.size > 0) {
    try {
      imageUrl = (await storeImage(file, "menu")).url;
    } catch (e) {
      if (e instanceof UploadError) return { ok: false, errors: { imageFile: e.message } };
      throw e;
    }
  } else if (imageUrl && !allowedImageUrl(imageUrl)) {
    return { ok: false, errors: { imageUrl: "Use an uploaded image or an https link from Cloudinary." } };
  }
  if (imageUrl && !d.imageAlt) return { ok: false, errors: { imageAlt: "Describe the photo for people using screen readers." } };
  if (d.dietaryTags.length && !d.allergenInfoVerified) {
    const tags = await db.dietaryTag.findMany({ where: { id: { in: d.dietaryTags } } });
    if (tags.some((t) => t.key === "gluten_free")) return { ok: false, errors: { allergenInfoVerified: "Gluten-free can only be set once the kitchen has verified this dish's allergen information." } };
  }

  const data = {
    name: d.name,
    description: d.description ?? null,
    pricePence,
    categoryId: d.categoryId,
    spiceLevel: d.spiceLevel,
    isVegetarian: d.isVegetarian,
    available: d.available,
    featured: d.featured,
    bestseller: d.bestseller,
    allergenInfoVerified: d.allergenInfoVerified,
    allergenNote: d.allergenNote ?? null,
    imageUrl,
    imageAlt: imageUrl ? d.imageAlt ?? null : null,
  };
  const item = await db.$transaction(async (tx) => {
    const before = id ? await tx.menuItem.findUnique({ where: { id } }) : null;
    const saved = id
      ? await tx.menuItem.update({ where: { id }, data })
      : await tx.menuItem.create({ data: { ...data, slug: await uniqueSlug(d.name), sortOrder: (await tx.menuItem.count({ where: { categoryId: d.categoryId } })) + 1 } });
    await tx.menuItemAllergen.deleteMany({ where: { itemId: saved.id } });
    if (d.allergens.length) await tx.menuItemAllergen.createMany({ data: d.allergens.map((allergenId) => ({ itemId: saved.id, allergenId })) });
    await tx.menuItemDietary.deleteMany({ where: { itemId: saved.id } });
    if (d.dietaryTags.length) await tx.menuItemDietary.createMany({ data: d.dietaryTags.map((tagId) => ({ itemId: saved.id, tagId })) });
    const priceNote = before && before.pricePence !== pricePence ? ` (price £${(before.pricePence / 100).toFixed(2)} → £${(pricePence / 100).toFixed(2)})` : "";
    await audit({ userId: user.id, action: id ? "menu.update" : "menu.create", entityType: "MenuItem", entityId: saved.id, summary: `${id ? "Updated" : "Added"} ${saved.name}${priceNote}` }, tx);
    return saved;
  });
  updateTag(TAGS.menu);
  if (!id) redirect(`/admin/menu/items/${item.id}?saved=1`);
  refresh();
  return { ok: true, message: "Dish saved. The website has been updated." };
}

const quickSchema = z.object({ id: z.string(), op: z.enum(["toggleAvailable", "toggleFeatured", "up", "down", "delete", "restore"]) });

export async function menuQuickAction(fd: FormData) {
  const user = await requirePermission("menu.write");
  const p = quickSchema.parse(formToObject(fd));
  const item = await db.menuItem.findUniqueOrThrow({ where: { id: p.id } });
  if (p.op === "toggleAvailable") await db.menuItem.update({ where: { id: item.id }, data: { available: !item.available } });
  if (p.op === "toggleFeatured") await db.menuItem.update({ where: { id: item.id }, data: { featured: !item.featured } });
  if (p.op === "delete") await db.menuItem.update({ where: { id: item.id }, data: { deletedAt: new Date() } });
  if (p.op === "restore") await db.menuItem.update({ where: { id: item.id }, data: { deletedAt: null } });
  if (p.op === "up" || p.op === "down") {
    const siblings = await db.menuItem.findMany({ where: { categoryId: item.categoryId, deletedAt: null }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
    const idx = siblings.findIndex((s) => s.id === item.id);
    const swap = siblings[p.op === "up" ? idx - 1 : idx + 1];
    if (swap) {
      const ordered = [...siblings];
      [ordered[idx], ordered[ordered.indexOf(swap)]] = [swap, item];
      await db.$transaction(ordered.map((s, i) => db.menuItem.update({ where: { id: s.id }, data: { sortOrder: i } })));
    }
  }
  const labels = { toggleAvailable: item.available ? "Marked unavailable" : "Marked available", toggleFeatured: item.featured ? "Removed from signature dishes" : "Added to signature dishes", up: "Moved up", down: "Moved down", delete: "Deleted", restore: "Restored" };
  await audit({ userId: user.id, action: `menu.${p.op}`, entityType: "MenuItem", entityId: item.id, summary: `${labels[p.op]}: ${item.name}` });
  updateTag(TAGS.menu);
  refresh();
}

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name is required.").max(80),
  description: z.string().trim().max(300).optional(),
  visible: z.string().optional(),
});

export async function saveCategoryAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requirePermission("menu.write");
  const p = categorySchema.safeParse(formToObject(fd));
  if (!p.success) return { ok: false, errors: fieldErrors(p.error) };
  const data = { name: p.data.name, description: p.data.description || null, visible: p.data.visible === "on" };
  if (p.data.id) {
    await db.menuCategory.update({ where: { id: p.data.id }, data });
  } else {
    let slug = slugify(p.data.name);
    for (let i = 2; await db.menuCategory.findUnique({ where: { slug } }); i++) slug = `${slugify(p.data.name)}-${i}`;
    await db.menuCategory.create({ data: { ...data, slug, sortOrder: (await db.menuCategory.count()) + 1 } });
  }
  await audit({ userId: user.id, action: p.data.id ? "menu.category.update" : "menu.category.create", entityType: "MenuCategory", entityId: p.data.id, summary: `${p.data.id ? "Updated" : "Added"} category ${p.data.name}` });
  updateTag(TAGS.menu);
  refresh();
  return { ok: true, message: "Category saved." };
}

export async function categoryMoveAction(fd: FormData) {
  const user = await requirePermission("menu.write");
  const id = String(fd.get("id"));
  const op = String(fd.get("op"));
  const cats = await db.menuCategory.findMany({ where: { deletedAt: null }, orderBy: { sortOrder: "asc" } });
  const idx = cats.findIndex((c) => c.id === id);
  if (op === "delete") {
    const count = await db.menuItem.count({ where: { categoryId: id, deletedAt: null } });
    if (count === 0) await db.menuCategory.update({ where: { id }, data: { deletedAt: new Date() } });
  } else {
    const j = op === "up" ? idx - 1 : idx + 1;
    if (idx >= 0 && cats[j]) {
      [cats[idx], cats[j]] = [cats[j], cats[idx]];
      await db.$transaction(cats.map((c, i) => db.menuCategory.update({ where: { id: c.id }, data: { sortOrder: i } })));
    }
  }
  await audit({ userId: user.id, action: `menu.category.${op}`, entityType: "MenuCategory", entityId: id, summary: `Category ${op}` });
  updateTag(TAGS.menu);
  refresh();
}
