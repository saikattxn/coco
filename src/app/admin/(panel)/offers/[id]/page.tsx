import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/server/auth";
import { londonDateIso } from "@/lib/time";
import { Flash, PageHeader } from "@/components/admin/ui";
import { OfferForm } from "./offer-form";
import { storageMode } from "@/server/storage";

export default async function OfferEdit({ params, searchParams }: PageProps<"/admin/offers/[id]">) {
  await requirePermission("offers.write");
  const { id } = await params;
  const sp = await searchParams;
  const offer = id === "new" ? null : await db.offer.findUnique({ where: { id } });
  if (id !== "new" && !offer) notFound();
  return (
    <>
      <PageHeader title={offer?.title ?? "New offer"} actions={<Link href="/admin/offers" className="btn btn-outline text-wine">All offers</Link>} />
      <Flash message={sp.saved ? "Offer created." : null} />
      <OfferForm
        uploadsEnabled={storageMode() !== "none"}
        offer={offer ? {
          id: offer.id, title: offer.title, description: offer.description, type: offer.type, terms: offer.terms, active: offer.active,
          startsAt: offer.startsAt ? londonDateIso(offer.startsAt) : "", endsAt: offer.endsAt ? londonDateIso(offer.endsAt) : "",
          imageUrl: offer.imageUrl ?? "", imageAlt: offer.imageAlt ?? "", ctaLabel: offer.ctaLabel ?? "", ctaUrl: offer.ctaUrl ?? "",
        } : null}
      />
    </>
  );
}
