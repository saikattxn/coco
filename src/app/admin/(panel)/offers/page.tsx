import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/server/auth";
import { Badge, Empty, PageHeader, smallBtn, td, th } from "@/components/admin/ui";
import { offerQuickAction } from "./actions";
import { offerState } from "@/lib/offers";

const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/London" });

export default async function OffersAdmin() {
  await requirePermission("offers.write");
  const offers = await db.offer.findMany({ where: { deletedAt: null }, orderBy: [{ active: "desc" }, { createdAt: "desc" }] });
  return (
    <>
      <PageHeader title="Offers" description="Live offers appear on the homepage, the offers page and the order page." actions={<Link href="/admin/offers/new" className="btn btn-primary">New offer</Link>} />
      {offers.length === 0 ? (
        <Empty title="No offers yet" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="border-b border-line bg-[#fbf8f3]"><tr><th className={th}>Offer</th><th className={th}>Runs</th><th className={th}>Status</th><th className={th} /></tr></thead>
            <tbody>
              {offers.map((o) => {
                const s = offerState(o);
                return (
                  <tr key={o.id} className="border-b border-line/60 last:border-0">
                    <td className={td}><Link href={`/admin/offers/${o.id}`} className="font-semibold hover:underline">{o.title}</Link><span className="block text-xs text-ink-soft">{o.type.replace(/_/g, " ").toLowerCase()}</span></td>
                    <td className={`${td} text-ink-soft`}>{o.startsAt ? fmt.format(o.startsAt) : "Now"} – {o.endsAt ? fmt.format(o.endsAt) : "no end date"}</td>
                    <td className={td}><Badge status={s.status} label={s.label} /></td>
                    <td className={`${td} text-right`}>
                      <form action={offerQuickAction} className="inline-flex gap-2">
                        <input type="hidden" name="id" value={o.id} />
                        <button name="op" value="toggle" className={smallBtn}>{o.active ? "Pause" : "Activate"}</button>
                        <button name="op" value="delete" className={`${smallBtn} text-bad`}>Delete</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
