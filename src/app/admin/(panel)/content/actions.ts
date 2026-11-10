"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/server/auth";
import { audit } from "@/server/audit";
import { TAGS } from "@/server/public-data";
import { fieldErrors, formToObject } from "@/lib/validation";
import type { FormState } from "@/app/(site)/actions";
import type { Prisma } from "@/generated/prisma/client";

export async function saveBlockAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requirePermission("content.write");
  const key = String(fd.get("key"));
  const title = String(fd.get("title") ?? "").trim().slice(0, 200);
  const body = String(fd.get("body") ?? "").trim().slice(0, 6000);
  await db.contentBlock.upsert({ where: { key }, update: { title, body, updatedById: user.id }, create: { key, title, body, updatedById: user.id } });
  await audit({ userId: user.id, action: "content.update", entityType: "ContentBlock", entityId: key, summary: `Edited “${key}”` });
  updateTag(TAGS.content);
  refresh();
  return { ok: true, message: "Saved and published." };
}

const testimonialSchema = z.object({ quote: z.string().trim().min(5).max(400), author: z.string().trim().min(2).max(80), source: z.string().trim().max(60).optional() });

export async function saveTestimonialsAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requirePermission("content.write");
  const quotes = fd.getAll("quote").map(String);
  const authors = fd.getAll("author").map(String);
  const sources = fd.getAll("source").map(String);
  const items = [];
  for (let i = 0; i < quotes.length; i++) {
    if (!quotes[i].trim() && !authors[i].trim()) continue;
    const p = testimonialSchema.safeParse({ quote: quotes[i], author: authors[i], source: sources[i] || undefined });
    if (!p.success) return { ok: false, errors: { _form: `Testimonial ${i + 1}: add both the quote and who said it.` } };
    items.push(p.data);
  }
  if (fd.get("confirmPermission") !== "on" && items.length) return { ok: false, errors: { _form: "Please confirm you have permission to publish these quotes." } };
  await db.contentBlock.upsert({ where: { key: "home.testimonials" }, update: { data: { items } as Prisma.InputJsonValue, updatedById: user.id }, create: { key: "home.testimonials", data: { items } as Prisma.InputJsonValue, updatedById: user.id } });
  await audit({ userId: user.id, action: "content.testimonials", entityType: "ContentBlock", entityId: "home.testimonials", summary: `Published ${items.length} testimonial(s)` });
  updateTag(TAGS.content);
  refresh();
  return { ok: true, message: `${items.length} testimonial${items.length === 1 ? "" : "s"} published.` };
}

const settingsSchema = z.object({
  restaurantName: z.string().trim().min(2).max(80),
  tagline: z.string().trim().max(140).optional(),
  addressLine1: z.string().trim().min(2).max(120),
  addressLine2: z.string().trim().max(120).optional(),
  town: z.string().trim().min(2).max(80),
  county: z.string().trim().max(80).optional(),
  postcode: z.string().trim().min(5).max(10),
  latitude: z.string().trim().optional(),
  longitude: z.string().trim().optional(),
  phonePrimary: z.string().trim().min(6).max(30),
  phoneSecondary: z.string().trim().max(30).optional(),
  email: z.email("Enter a valid email."),
  orderingUrl: z.url("Enter the full ordering link, starting https://"),
  orderingEnabled: z.string().optional(),
  tripadvisorUrl: z.url().optional().or(z.literal("")),
  googleReviewsUrl: z.url().optional().or(z.literal("")),
  facebookUrl: z.url().optional().or(z.literal("")),
  instagramUrl: z.url().optional().or(z.literal("")),
  parkingInfo: z.string().trim().max(200).optional(),
  hoursNote: z.string().trim().max(200).optional(),
  footerNote: z.string().trim().max(200).optional(),
  seoTitle: z.string().trim().max(70, "Keep titles under 70 characters.").optional(),
  seoDescription: z.string().trim().max(170, "Keep descriptions under 170 characters.").optional(),
});

export async function saveSiteSettingsAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requirePermission("content.write");
  const p = settingsSchema.safeParse(formToObject(fd));
  if (!p.success) return { ok: false, errors: fieldErrors(p.error) };
  const d = p.data;
  const num = (v?: string) => (v && !Number.isNaN(Number(v)) ? Number(v) : null);
  const opt = (v?: string) => (v ? v : null);
  await db.siteSettings.update({
    where: { id: "default" },
    data: {
      restaurantName: d.restaurantName, tagline: opt(d.tagline), addressLine1: d.addressLine1, addressLine2: opt(d.addressLine2), town: d.town, county: opt(d.county), postcode: d.postcode.toUpperCase(),
      latitude: num(d.latitude), longitude: num(d.longitude), phonePrimary: d.phonePrimary, phoneSecondary: opt(d.phoneSecondary), email: d.email, orderingUrl: d.orderingUrl, orderingEnabled: d.orderingEnabled === "on",
      tripadvisorUrl: opt(d.tripadvisorUrl), googleReviewsUrl: opt(d.googleReviewsUrl), facebookUrl: opt(d.facebookUrl), instagramUrl: opt(d.instagramUrl),
      parkingInfo: opt(d.parkingInfo), hoursNote: opt(d.hoursNote), footerNote: opt(d.footerNote), seoTitle: opt(d.seoTitle), seoDescription: opt(d.seoDescription),
    },
  });
  await audit({ userId: user.id, action: "settings.site", entityType: "SiteSettings", summary: "Updated contact details / site settings" });
  updateTag(TAGS.site);
  refresh();
  return { ok: true, message: "Saved. The whole website now shows these details." };
}

const seoSchema = z.object({ path: z.string().regex(/^\/[a-z-]*$/), title: z.string().trim().max(70, "Keep titles under 70 characters.").optional(), description: z.string().trim().max(170, "Keep descriptions under 170 characters.").optional() });

export async function savePageSeoAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requirePermission("seo.write");
  const p = seoSchema.safeParse(formToObject(fd));
  if (!p.success) return { ok: false, errors: fieldErrors(p.error) };
  await db.pageSeo.upsert({ where: { path: p.data.path }, update: { title: p.data.title || null, description: p.data.description || null }, create: { path: p.data.path, title: p.data.title || null, description: p.data.description || null } });
  await audit({ userId: user.id, action: "seo.update", entityType: "PageSeo", entityId: p.data.path, summary: `Updated SEO for ${p.data.path}` });
  updateTag(TAGS.seo);
  refresh();
  return { ok: true, message: `Saved SEO for ${p.data.path}.` };
}
