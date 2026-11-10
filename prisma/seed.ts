/**
 * Seed script — idempotent (safe to run repeatedly).
 *  - Reference data: roles & permissions, the 14 UK allergens, dietary tags.
 *  - Verified business data: address, phone, email, opening hours, live offer, menu (from the ordering site).
 *  - Configuration defaults: booking rules and a SAMPLE seating plan — replace with the real floor plan.
 *  - First Super Admin from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD.
 * Run: npm run db:seed
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { PERMISSIONS, ROLES } from "../src/server/permissions";
import { CATEGORIES, FEATURED, SPICE_MAP, parseAllergens } from "./data/menu";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const ALLERGENS: [string, string][] = [
  ["celery", "Celery"],
  ["cereals_gluten", "Cereals containing gluten"],
  ["crustaceans", "Crustaceans"],
  ["eggs", "Eggs"],
  ["fish", "Fish"],
  ["lupin", "Lupin"],
  ["milk", "Milk"],
  ["molluscs", "Molluscs"],
  ["mustard", "Mustard"],
  ["tree_nuts", "Tree nuts"],
  ["peanuts", "Peanuts"],
  ["sesame", "Sesame"],
  ["soya", "Soya"],
  ["sulphites", "Sulphur dioxide / sulphites"],
];

const DIETARY: [string, string][] = [
  ["vegetarian", "Vegetarian"],
  ["vegan", "Vegan"],
  ["gluten_free", "Gluten-free"],
];

async function seedRbac() {
  for (const [key, description] of Object.entries(PERMISSIONS)) {
    await db.permission.upsert({ where: { key }, update: { description }, create: { key, description } });
  }
  const perms = await db.permission.findMany();
  for (const [key, role] of Object.entries(ROLES)) {
    const r = await db.role.upsert({ where: { key }, update: { name: role.name, description: role.description }, create: { key, name: role.name, description: role.description } });
    await db.rolePermission.deleteMany({ where: { roleId: r.id } });
    await db.rolePermission.createMany({
      data: perms.filter((p) => (role.permissions as string[]).includes(p.key)).map((p) => ({ roleId: r.id, permissionId: p.id })),
    });
  }
}

async function seedAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL || "admin@cocotamarind.local").toLowerCase();
  if (await db.user.findUnique({ where: { email } })) return;
  const supplied = process.env.SEED_ADMIN_PASSWORD;
  const password = supplied || randomBytes(12).toString("base64url");
  const role = await db.role.findUniqueOrThrow({ where: { key: "SUPER_ADMIN" } });
  await db.user.create({ data: { email, name: process.env.SEED_ADMIN_NAME || "Administrator", passwordHash: await bcrypt.hash(password, 12), roleId: role.id } });
  console.log(`\n  Super Admin created: ${email}`);
  if (!supplied) console.log(`  Temporary password (shown once — change it after signing in): ${password}\n`);
}

/** Demo staff for local development only (SEED_DEMO=1). Passwords come from SEED_DEMO_PASSWORD. */
async function seedDemoStaff() {
  if (process.env.SEED_DEMO !== "1" || process.env.NODE_ENV === "production") return;
  const password = process.env.SEED_DEMO_PASSWORD;
  if (!password) throw new Error("Set SEED_DEMO_PASSWORD to create demo staff accounts.");
  const hash = await bcrypt.hash(password, 12);
  for (const [key, name] of [["MANAGER", "Demo Manager"], ["RESERVATIONS", "Demo Front of House"], ["CONTENT", "Demo Editor"]] as const) {
    const role = await db.role.findUniqueOrThrow({ where: { key } });
    const email = `${key.toLowerCase()}@cocotamarind.local`;
    await db.user.upsert({ where: { email }, update: {}, create: { email, name, passwordHash: hash, roleId: role.id } });
  }
}

async function seedSite() {
  await db.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      restaurantName: "Coco Tamarind",
      tagline: "Fine Indian dining in Princes Risborough",
      addressLine1: "Aylesbury Road",
      addressLine2: "Askett",
      town: "Princes Risborough",
      county: "Buckinghamshire",
      postcode: "HP27 9LY",
      phonePrimary: "01844 343111",
      // Website shows 01844 346100; a local listing shows 01844 343100 — confirm with management.
      phoneSecondary: "01844 346100",
      email: "cocotamarindhp27@gmail.com",
      orderingUrl: "https://order.cocotamarindhp27.co.uk/home",
      orderingEnabled: true,
      tripadvisorUrl: "https://www.tripadvisor.co.uk/Restaurant_Review-g18931489-d1765640-Reviews-Coco_Tamarind-Askett_Princes_Risborough_Buckinghamshire_England.html",
      facebookUrl: "https://www.facebook.com/Coco-Tamarind-Indian-Restaurant-1571589906501629",
      instagramUrl: "https://www.instagram.com/cocotamarind/",
      parkingInfo: "Free on-site parking.",
      hoursNote: "Open 7 days, including bank holidays. Closed Christmas Day.",
      seoTitle: "Coco Tamarind | Indian Restaurant & Takeaway in Princes Risborough",
      seoDescription:
        "Fine Northern Indian and Bangladeshi cuisine at Askett, Princes Risborough. Book a table, order collection or delivery, and celebrate with us. Free parking.",
    },
  });

  const blocks: { key: string; title?: string; body?: string; data?: object }[] = [
    {
      key: "home.hero",
      title: "Fine Indian dining in Princes Risborough",
      body: "Northern Indian and Bangladeshi cooking, a serpentine bar and a warm welcome — at Askett, with free parking.",
    },
    {
      key: "home.intro",
      title: "Welcome to Coco Tamarind",
      body:
        "Walk in and you will be greeted at our serpentine bar, where our waiters can entertain you with pre-dinner drinks and an array of Indian street food and tapas. Later, you can lounge here with luxurious desserts, coffees and liqueurs.\n\nIndian cuisine is a combination of subtle tastes. Fragrant spices are delicately blended to create the dishes presented to you by one of the most experienced chefs in the UK.",
    },
    {
      key: "home.story",
      title: "Cooked as we cook at home",
      body:
        "Our dishes are of Northern Indian and Bangladeshi origin, prepared exactly as in our own homes. Loyal to our local roots, we work where possible with seasonal produce from local farmers and growers.\n\nAny dish that does not appear on the menu can be prepared on request.",
    },
    {
      key: "home.celebrations",
      title: "Celebrate with us",
      body: "Birthdays, anniversaries, family gatherings and company dinners — tell us what you have in mind and our team will help you plan it.",
    },
    {
      key: "about.story",
      title: "Our story",
      body:
        "Walk in and you will be greeted at the serpentine bar at Coco Tamarind, where our waiters can entertain you with pre-dinner drinks and an array of Indian street food and tapas. Later, you can lounge here with luxurious desserts, coffees and liqueurs.\n\nIndian cuisine is a combination of subtle tastes. Fragrant and exotic spices are delicately blended to create the dishes presented to you by one of the most experienced chefs in the UK.",
    },
    {
      key: "about.heritage",
      title: "Northern Indian & Bangladeshi heritage",
      body:
        "Our dishes are of Northern Indian and Bangladeshi origin and are prepared at Coco Tamarind exactly as in our own homes. Unlike many \"Indian\" restaurants, our menu reflects the diversity of cooking styles and ingredients from the length and breadth of the Indian subcontinent.",
    },
    {
      key: "about.ingredients",
      title: "Fresh, local, seasonal",
      body:
        "All dishes are prepared with fresh ingredients each day. Loyal to our local roots, we work where possible with seasonal produce from local farmers and growers. We can also prepare a selection of dishes as lighter, low-calorie options — please ask.",
    },
    {
      key: "about.hospitality",
      title: "Hospitality",
      body:
        "Our customers are special to us. That is why we have carefully chosen our dishes, and why we freshly prepare and cook them for you in the finest traditional way. Any dish that does not appear on the menu can be served on request.",
    },
    {
      key: "celebrations.intro",
      title: "Birthdays, anniversaries & private dining",
      body:
        "From a birthday table for six to a company dinner, we'd love to host your occasion. Tell us the date, the number of guests and anything special you have in mind, and our team will come back to you to plan the details.",
    },
    {
      key: "menu.allergyNotice",
      title: "Allergies & dietary requirements",
      body:
        "If you have an allergy or intolerance, please speak to our team before ordering — call us or ask your server. Allergen information shown on this website is a guide only; our kitchen handles all 14 major allergens and we cannot guarantee any dish is free from traces.",
    },
  ];
  for (const b of blocks) {
    await db.contentBlock.upsert({ where: { key: b.key }, update: {}, create: { key: b.key, title: b.title, body: b.body, data: b.data } });
  }
}

async function seedHours() {
  // Verified on the current website: open 7 days, lunch 12:00–14:00, dinner 17:30–23:00
  for (let weekday = 0; weekday < 7; weekday++) {
    for (const [period, opensAt, closesAt] of [["LUNCH", "12:00", "14:00"], ["DINNER", "17:30", "23:00"]] as const) {
      await db.openingHours.upsert({ where: { weekday_period: { weekday, period } }, update: {}, create: { weekday, period, opensAt, closesAt } });
    }
  }
  for (const date of ["2026-12-25", "2027-12-25"]) {
    await db.closureDate.upsert({ where: { date: new Date(`${date}T00:00:00Z`) }, update: {}, create: { date: new Date(`${date}T00:00:00Z`), reason: "Christmas Day" } });
  }
  await db.bookingSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
}

/** SAMPLE seating plan so the booking engine works out of the box. Replace in Admin → Settings → Seating. */
async function seedSeating() {
  if ((await db.table.count()) > 0) return;
  const main = await db.seatingArea.create({ data: { name: "Main restaurant", sortOrder: 1 } });
  const bar = await db.seatingArea.create({ data: { name: "Bar lounge", sortOrder: 2 } });
  const tables = [
    ...["M1", "M2", "M3", "M4"].map((label, i) => ({ label, areaId: main.id, minCovers: 1, maxCovers: 2, combinable: true, joinGroup: "window", sortOrder: i })),
    ...["M5", "M6", "M7", "M8", "M9", "M10"].map((label, i) => ({ label, areaId: main.id, minCovers: 2, maxCovers: 4, combinable: true, joinGroup: "centre", sortOrder: 10 + i })),
    ...["M11", "M12"].map((label, i) => ({ label, areaId: main.id, minCovers: 4, maxCovers: 6, combinable: false, joinGroup: null, sortOrder: 20 + i })),
    { label: "M13", areaId: main.id, minCovers: 6, maxCovers: 10, combinable: false, joinGroup: null, sortOrder: 30 },
    ...["B1", "B2", "B3"].map((label, i) => ({ label, areaId: bar.id, minCovers: 1, maxCovers: 2, combinable: false, joinGroup: null, sortOrder: i })),
  ];
  await db.table.createMany({ data: tables });
}

async function seedMenu() {
  for (const [key, name] of ALLERGENS) await db.allergen.upsert({ where: { key }, update: { name }, create: { key, name } });
  for (const [key, name] of DIETARY) await db.dietaryTag.upsert({ where: { key }, update: { name }, create: { key, name } });
  if ((await db.menuItem.count()) > 0) return; // never overwrite edits made in the dashboard

  const allergens = Object.fromEntries((await db.allergen.findMany()).map((a) => [a.key, a.id]));
  const vegTag = await db.dietaryTag.findUniqueOrThrow({ where: { key: "vegetarian" } });

  for (const [ci, cat] of CATEGORIES.entries()) {
    const category = await db.menuCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { slug: cat.slug, name: cat.name, description: cat.description, sortOrder: ci, visible: cat.visible ?? true },
    });
    const lines = cat.lines.trim() ? cat.lines.trim().split("\n") : [];
    const seen = new Set<string>();
    for (const [i, line] of lines.entries()) {
      const [name, description, allergenText, spice, veg, price, unavailable] = line.split("|").map((s) => (s ?? "").trim());
      let itemSlug = slug(name);
      if (seen.has(itemSlug)) itemSlug = `${itemSlug}-${i}`;
      seen.add(itemSlug);
      const keys = parseAllergens(allergenText);
      await db.menuItem.create({
        data: {
          slug: itemSlug,
          name,
          description: description || null,
          pricePence: Math.round(Number(price) * 100),
          categoryId: category.id,
          spiceLevel: SPICE_MAP[spice] ?? 0,
          isVegetarian: veg === "V",
          available: unavailable !== "X",
          featured: FEATURED.includes(name),
          allergenInfoVerified: false,
          allergenNote: allergenText || null,
          sortOrder: i,
          allergens: { create: keys.map((k) => ({ allergenId: allergens[k] })) },
          dietaryTags: veg === "V" ? { create: [{ tagId: vegTag.id }] } : undefined,
        },
      });
    }
  }
}

async function seedOffers() {
  await db.offer.upsert({
    where: { slug: "collection-20-off" },
    update: {},
    create: {
      slug: "collection-20-off",
      title: "20% off collection orders over £20",
      description: "Order online for collection and save 20% on orders over £20.",
      type: "COLLECTION_DISCOUNT",
      terms: "Applies to collection orders over £20 placed through our online ordering service. Discount applied at checkout. Not available on delivery orders. Terms to be confirmed by management.",
      active: true,
      ctaLabel: "Order for collection",
      ctaUrl: "https://order.cocotamarindhp27.co.uk/home",
    },
  });
}

/** The restaurant's own photography from the current website. Replace with a professional shoot. */
async function seedGallery() {
  if ((await db.galleryImage.count()) > 0) return;
  const base = "https://cocotamarindhp27.co.uk/wp-content/uploads";
  const images = [
    ["2019/06/s3.jpg", "Sizzling tandoori platter with grilled vegetables", "FOOD"],
    ["2019/06/sl1.jpg", "A selection of dishes from the Coco Tamarind kitchen", "FOOD"],
    ["2019/06/sl2.jpg", "Plated Indian dishes at Coco Tamarind", "FOOD"],
    ["2019/09/DSC01087.jpg", "Chef's dish at Coco Tamarind", "FOOD"],
    ["2019/09/DSC01071.jpg", "Curry served at Coco Tamarind", "FOOD"],
    ["2019/09/DSC01039.jpg", "Tandoori dish at Coco Tamarind", "FOOD"],
    ["2019/09/4J8A7004.jpg", "Dining at Coco Tamarind", "DINING"],
    ["2019/06/s1a.jpg", "Inside Coco Tamarind restaurant", "INTERIOR"],
  ] as const;
  await db.galleryImage.createMany({ data: images.map(([path, alt, category], i) => ({ url: `${base}/${path}`, alt, category, sortOrder: i })) });
}

async function main() {
  await seedRbac();
  await seedAdmin();
  await seedDemoStaff();
  await seedSite();
  await seedHours();
  await seedSeating();
  await seedMenu();
  await seedOffers();
  await seedGallery();
  const counts = { items: await db.menuItem.count(), categories: await db.menuCategory.count(), tables: await db.table.count(), users: await db.user.count() };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
