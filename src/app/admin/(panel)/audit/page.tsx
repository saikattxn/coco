import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/server/auth";
import { PageHeader, smallBtn, td, th } from "@/components/admin/ui";

export default async function AuditPage({ searchParams }: PageProps<"/admin/audit">) {
  await requirePermission("audit.view");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const type = typeof sp.type === "string" ? sp.type : "";
  const where = type ? { entityType: type } : {};
  const [logs, types] = await Promise.all([
    db.auditLog.findMany({ where, include: { user: true }, orderBy: { createdAt: "desc" }, take: 100, skip: (page - 1) * 100 }),
    db.auditLog.findMany({ distinct: ["entityType"], select: { entityType: true } }),
  ]);
  return (
    <>
      <PageHeader title="Activity log" description="Every change made in the dashboard, and sign-ins. Kept for accountability." />
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/admin/audit" className={smallBtn}>All</Link>
        {types.map((t) => <Link key={t.entityType} href={`?type=${t.entityType}`} className={smallBtn}>{t.entityType}</Link>)}
      </div>
      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[44rem] text-sm">
          <thead className="border-b border-line bg-[#fbf8f3]"><tr><th className={th}>When</th><th className={th}>Who</th><th className={th}>What</th><th className={th}>Action</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-line/60 last:border-0">
                <td className={`${td} whitespace-nowrap text-ink-soft`}>{new Intl.DateTimeFormat("en-GB", { dateStyle: "short", timeStyle: "medium", timeZone: "Europe/London" }).format(l.createdAt)}</td>
                <td className={td}>{l.user?.name ?? "Guest / system"}</td>
                <td className={td}>{l.summary}</td>
                <td className={`${td} font-mono text-xs text-ink-soft`}>{l.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex gap-2">
        {page > 1 && <Link className={smallBtn} href={`?page=${page - 1}${type ? `&type=${type}` : ""}`}>Newer</Link>}
        {logs.length === 100 && <Link className={smallBtn} href={`?page=${page + 1}${type ? `&type=${type}` : ""}`}>Older</Link>}
      </div>
    </>
  );
}
