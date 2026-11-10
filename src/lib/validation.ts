/** Zod schemas shared by client forms and server handlers. */
import { z } from "zod";

const trimmed = (max: number) => z.string().trim().max(max);
const name = trimmed(100).min(2, "Please enter your name.");
const email = z.string().trim().toLowerCase().max(254).pipe(z.email("Please enter a valid email address."));
const ukPhone = z
  .string()
  .trim()
  .max(30)
  .regex(/^[+\d][\d\s()-]{6,}$/, "Please enter a valid phone number.");
const dateIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please choose a date.");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Please choose a time.");
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Please keep this under ${max} characters.`)
    .optional()
    .transform((v) => (v ? v : undefined));
const checkbox = z
  .union([z.boolean(), z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
  .optional()
  .transform((v) => v === true || v === "on" || v === "true");

export const OCCASIONS = ["Birthday", "Anniversary", "Date night", "Business", "Family gathering", "Celebration", "Other"] as const;

export const reservationSchema = z.object({
  name,
  email,
  phone: ukPhone,
  partySize: z.coerce.number().int().min(1, "Please choose the number of guests.").max(40),
  date: dateIso,
  time,
  occasion: z.enum(OCCASIONS).optional().or(z.literal("").transform(() => undefined)),
  specialRequests: optionalText(500),
  marketingConsent: checkbox,
  // honeypot: must be empty
  website: z.string().max(0, "Invalid submission.").optional(),
});
export type ReservationInput = z.infer<typeof reservationSchema>;

export const staffReservationSchema = reservationSchema.extend({
  email: email.optional().or(z.literal("").transform(() => undefined)),
  source: z.enum(["PHONE", "WALK_IN", "STAFF"]).default("PHONE"),
  tableId: z.string().optional().or(z.literal("").transform(() => undefined)),
  staffNotes: optionalText(1000),
  status: z.enum(["PENDING", "CONFIRMED"]).default("CONFIRMED"),
  sendEmail: checkbox,
});

export const availabilityQuerySchema = z.object({
  date: dateIso,
  partySize: z.coerce.number().int().min(1).max(40),
});

export const changeRequestSchema = z.object({
  message: z.string().trim().min(5, "Please tell us what you'd like to change.").max(500),
});

export const contactSchema = z.object({
  name,
  email,
  phone: z.string().trim().max(30).optional().or(z.literal("").transform(() => undefined)),
  subject: optionalText(150),
  message: z.string().trim().min(10, "Please write a short message.").max(2000),
  website: z.string().max(0).optional(),
});

export const EVENT_TYPES = {
  BIRTHDAY: "Birthday",
  ANNIVERSARY: "Anniversary",
  FAMILY: "Family gathering",
  CORPORATE: "Corporate dinner",
  GROUP: "Group dining",
  PRIVATE: "Private event",
  OTHER: "Something else",
} as const;

export const eventEnquirySchema = z.object({
  name,
  email,
  phone: ukPhone,
  eventType: z.enum(Object.keys(EVENT_TYPES) as [keyof typeof EVENT_TYPES, ...(keyof typeof EVENT_TYPES)[]]),
  eventDate: dateIso,
  preferredTime: optionalText(40),
  guests: z.coerce.number().int().min(2, "Events are for 2 or more guests.").max(300),
  budgetNote: optionalText(200),
  message: optionalText(2000),
  website: z.string().max(0).optional(),
});

export const newsletterSchema = z.object({
  email,
  name: optionalText(100),
  consent: checkbox.refine((v) => v, "Please tick to confirm you'd like to receive our emails."),
  website: z.string().max(0).optional(),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(200),
});

export const menuItemSchema = z.object({
  name: trimmed(120).min(2, "Name is required."),
  description: optionalText(600),
  price: z.string().trim().regex(/^£?\d+(\.\d{1,2})?$/, "Enter a price like 12.45"),
  categoryId: z.string().min(1, "Choose a category."),
  spiceLevel: z.coerce.number().int().min(0).max(4),
  isVegetarian: checkbox,
  available: checkbox,
  featured: checkbox,
  bestseller: checkbox,
  allergenInfoVerified: checkbox,
  allergenNote: optionalText(300),
  imageUrl: z.string().trim().max(500).optional().or(z.literal("").transform(() => undefined)),
  imageAlt: optionalText(200),
  allergens: z.array(z.string()).default([]),
  dietaryTags: z.array(z.string()).default([]),
});

export const offerSchema = z
  .object({
    title: trimmed(120).min(3, "Title is required."),
    description: trimmed(1000).min(10, "Add a short description."),
    type: z.enum(["COLLECTION_DISCOUNT", "SEASONAL", "SPECIAL_MENU", "CELEBRATION", "MIDWEEK", "LIMITED_TIME"]),
    terms: trimmed(2000).min(5, "Terms and conditions are required."),
    startsAt: z.string().optional().or(z.literal("").transform(() => undefined)),
    endsAt: z.string().optional().or(z.literal("").transform(() => undefined)),
    active: checkbox,
    imageUrl: z.string().trim().max(500).optional().or(z.literal("").transform(() => undefined)),
    imageAlt: optionalText(200),
    ctaLabel: optionalText(40),
    ctaUrl: z.string().trim().max(500).optional().or(z.literal("").transform(() => undefined)),
  })
  .refine((o) => !o.startsAt || !o.endsAt || o.startsAt <= o.endsAt, { message: "End date must be after start date.", path: ["endsAt"] });

export type FieldErrors = Record<string, string>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** FormData → plain object (multi-value keys become arrays). */
export function formToObject(fd: FormData, arrayKeys: string[] = []): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const key of new Set(fd.keys())) {
    if (key.startsWith("$ACTION")) continue;
    const all = fd.getAll(key).filter((v): v is string => typeof v === "string");
    obj[key] = arrayKeys.includes(key) ? all : all[0];
  }
  for (const key of arrayKeys) if (!(key in obj)) obj[key] = [];
  return obj;
}
