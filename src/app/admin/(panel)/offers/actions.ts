"use server";

import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/server/auth";
import { audit } from "@/server/audit";
import { TAGS } from "@/server/public-data";
import { fieldErrors, formToObject, offerSchema } from "@/lib/validation";
import { slugify } from "@/lib/format";
import { londonToUtc } from "@/lib/time";
import { allowedImageUrl, storeImage, UploadError } from "@/server/storage";
import type { FormState } from "@/app/(site)/actions";

export async function saveOfferAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requirePermission("offers.write");
  const id = String(fd.get("id") || "") || undefined;
  const p = offerSchema.safeParse(formToObject(fd));
  if (!p.success) return { ok: false, errors: fieldErrors(p.error) };
  const d = p.data;
  let imageUrl = d.imageUrl ?? null;
  const file = fd.get("imageFile");
  if (file instanceof File && file.size > 0) {
    try {
      imageUrl = (await storeImage(file, "offers")).url;
    } catch (e) {
      if (e instanceof UploadError) return { ok: false, errors: { imageFile: e.message } };
      throw e;
    }
  } else if (imageUrl && !allowedImageUrl(imageUrl)) return { ok: false, errors: { imageUrl: "Use an uploaded image or an https Cloudinary link." } };
  if (d.ctaUrl && !/^(https:\/\/|\/)/.test(d.ctaUrl)) return { ok: false, errors: { ctaUrl: "Links must start with https:// or /" } };

  const data = {
    title: d.title,
    description: d.description,
    type: d.type,
    terms: d.terms,
    active: d.active,
    // Dates are London calendar dates: starts at 00:00, ends at 23:59
    startsAt: d.startsAt ? londonToUtc(d.startsAt, "00:00") : null,
    endsAt: d.endsAt ? new Date(londonToUtc(d.endsAt, "23:59").getTime() + 59_999) : null,
    imageUrl,
    imageAlt: imageUrl ? d.imageAlt ?? null : null,
    ctaLabel: d.ctaLabel ?? null,
    ctaUrl: d.ctaUrl ?? null,
  };
  let offerId = id;
  if (id) await db.offer.update({ where: { id }, data });
  else {
    let slug = slugify(d.title);
    for (let i = 2; await db.offer.findUnique({ where: { slug } }); i++) slug = `${slugify(d.title)}-${i}`;
    offerId = (await db.offer.create({ data: { ...data, slug } })).id;
  }
  await audit({ userId: user.id, action: id ? "offer.update" : "offer.create", entityType: "Offer", entityId: offerId, summary: `${id ? "Updated" : "Created"} offer “${d.title}” (${d.active ? "active" : "inactive"})` });
  updateTag(TAGS.offers);
  if (!id) redirect(`/admin/offers/${offerId}?saved=1`);
  refresh();
  return { ok: true, message: "Offer saved." };
}

export async function offerQuickAction(fd: FormData) {
  const user = await requirePermission("offers.write");
  const id = String(fd.get("id"));
  const op = String(fd.get("op"));
  const offer = await db.offer.findUniqueOrThrow({ where: { id } });
  if (op === "toggle") await db.offer.update({ where: { id }, data: { active: !offer.active } });
  if (op === "delete") await db.offer.update({ where: { id }, data: { deletedAt: new Date(), active: false } });
  await audit({ userId: user.id, action: `offer.${op}`, entityType: "Offer", entityId: id, summary: `${op === "delete" ? "Deleted" : offer.active ? "Paused" : "Activated"} offer “${offer.title}”` });
  updateTag(TAGS.offers);
  refresh();
}
