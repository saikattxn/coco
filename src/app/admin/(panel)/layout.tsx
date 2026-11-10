import { db } from "@/lib/db";
import { requireUser } from "@/server/auth";
import { Sidebar } from "@/components/admin/sidebar";
import { ADMIN_NAV } from "@/components/admin/nav";
import { logoutAction } from "../(auth)/actions";

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireUser();
  const [pending, newEnquiries] = await Promise.all([
    user.permissions.has("reservations.read") ? db.reservation.count({ where: { OR: [{ status: "PENDING" }, { changeRequest: { not: null }, status: { in: ["PENDING", "CONFIRMED"] } }], startsAt: { gte: new Date() } } }) : 0,
    user.permissions.has("enquiries.read") ? db.contactEnquiry.count({ where: { status: "NEW" } }).then(async (c) => c + (await db.eventEnquiry.count({ where: { status: "NEW" } }))) : 0,
  ]);
  const items = ADMIN_NAV.filter((n) => user.permissions.has(n.perm)).map((n) => ({
    href: n.href,
    label: n.label,
    icon: n.icon,
    badge: n.href === "/admin/reservations" ? pending : n.href === "/admin/enquiries" ? newEnquiries : undefined,
  }));
  return (
    <div className="lg:flex">
      <Sidebar items={items} user={{ name: user.name, role: user.roleName }} logout={logoutAction} />
      <main id="main" className="min-w-0 flex-1 px-4 py-7 md:px-8 lg:py-10">{children}</main>
    </div>
  );
}
