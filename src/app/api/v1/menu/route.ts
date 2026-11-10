import { NextResponse } from "next/server";
import { getMenu } from "@/server/public-data";

/** GET /api/v1/menu — public menu as JSON (visible categories, live items). */
export async function GET() {
  const menu = await getMenu();
  return NextResponse.json({
    categories: menu.map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description,
      items: c.items.map((i) => ({
        slug: i.slug,
        name: i.name,
        description: i.description,
        price: i.pricePence / 100,
        currency: "GBP",
        spiceLevel: i.spiceLevel,
        vegetarian: i.isVegetarian,
        available: i.available,
        dietaryTags: i.dietaryTags.map((t) => t.tag.key),
        allergens: { verified: i.allergenInfoVerified, listed: i.allergens.map((a) => a.allergen.key) },
      })),
    })),
  });
}
