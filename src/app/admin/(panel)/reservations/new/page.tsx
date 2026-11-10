import { db } from "@/lib/db";
import { requirePermission } from "@/server/auth";
import { londonDateIso } from "@/lib/time";
import { PageHeader } from "@/components/admin/ui";
import { NewReservationForm } from "./new-form";

export default async function NewReservationPage() {
  await requirePermission("reservations.write");
  const tables = await db.table.findMany({ where: { active: true }, include: { area: true }, orderBy: [{ area: { sortOrder: "asc" } }, { sortOrder: "asc" }] });
  return (
    <>
      <PageHeader title="New booking" description="For phone and walk-in bookings. Capacity rules still apply, so tables can't be double-booked." />
      <NewReservationForm today={londonDateIso(new Date())} tables={tables.map((t) => ({ id: t.id, label: t.label, area: t.area.name, maxCovers: t.maxCovers }))} />
    </>
  );
}
