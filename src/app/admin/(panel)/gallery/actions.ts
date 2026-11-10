"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/server/auth";
import { audit } from "@/server/audit";
import { TAGS } from "@/server/public-data";
import { allowedImageUrl, storeImage, UploadError } from "@/server/storage";
import type { FormState } from "@/app/(site)/actions";

const CATS = ["FOOD", "INTERIOR", "BAR", "DINING", "OCCASIONS", "EVENTS"] as const;
const addSchema = z.object({ alt: z.string().trim().min(5, "Describe the photo (at least 5 characters).").max(200), caption: z.string().trim().max(200).optional(), category: z.enum(CATS), url: z.string().trim().optional() });

export async function addImageAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requirePermission("content.write");
  const p = addSchema.safeParse({ alt: fd.get("alt"), caption: fd.get("caption") || undefined, category: fd.get("category"), url: fd.get("url") || undefined });
  if (!p.success) return { ok: false, errors: Object.fromEntries(p.error.issues.map((i) => [i.path.join("."), i.message])) };
  let url = p.data.url;
  let width: number | undefined, height: number | undefined;
  const file = fd.get("file");
  if (file instanceof File && file.size > 0) {
    try {
      ({ url, width, height } = await storeImage(file, "gallery"));
    } catch (e) {
      if (e instanceof UploadError) return { ok: false, errors: { file: e.message } };
      throw e;
    }
  }
  if (!url) return { ok: false, errors: { file: "Upload a photo or paste a link." } };
  if (!allowedImageUrl(url)) return { ok: false, errors: { url: "Links must be https Cloudinary links or uploads." } };
  const img = await db.galleryImage.create({ data: { url, alt: p.data.alt, caption: p.data.caption ?? null, category: p.data.category, width, height, sortOrder: await db.galleryImage.count() } });
  await audit({ userId: user.id, action: "gallery.add", entityType: "GalleryImage", entityId: img.id, summary: `Added photo “${p.data.alt}”` });
  updateTag(TAGS.gallery);
  refresh();
  return { ok: true, message: "Photo added." };
}

const editSchema = z.object({ id: z.string(), alt: z.string().trim().min(5).max(200), caption: z.string().trim().max(200).optional(), category: z.enum(CATS), sortOrder: z.coerce.number().int().min(0).max(9999), published: z.string().optional() });

export async function updateImageAction(fd: FormData) {
  const user = await requirePermission("content.write");
  const op = fd.get("op");
  const id = String(fd.get("id"));
  if (op === "delete") {
    await db.galleryImage.update({ where: { id }, data: { deletedAt: new Date(), published: false } });
    await audit({ userId: user.id, action: "gallery.delete", entityType: "GalleryImage", entityId: id, summary: "Removed a photo" });
  } else {
    const p = editSchema.parse({ id, alt: fd.get("alt"), caption: fd.get("caption") || undefined, category: fd.get("category"), sortOrder: fd.get("sortOrder"), published: fd.get("published") ?? undefined });
    await db.galleryImage.update({ where: { id }, data: { alt: p.alt, caption: p.caption ?? null, category: p.category, sortOrder: p.sortOrder, published: p.published === "on" } });
    await audit({ userId: user.id, action: "gallery.update", entityType: "GalleryImage", entityId: id, summary: `Updated photo “${p.alt}”` });
  }
  updateTag(TAGS.gallery);
  refresh();
}
