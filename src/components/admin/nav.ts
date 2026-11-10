import type { PermissionKey } from "@/server/permissions";

export const ADMIN_NAV: { href: string; label: string; perm: PermissionKey; icon: string }[] = [
  { href: "/admin", label: "Overview", perm: "dashboard.view", icon: "LayoutDashboard" },
  { href: "/admin/reservations", label: "Reservations", perm: "reservations.read", icon: "CalendarDays" },
  { href: "/admin/enquiries", label: "Enquiries", perm: "enquiries.read", icon: "Inbox" },
  { href: "/admin/customers", label: "Customers", perm: "customers.read", icon: "Users" },
  { href: "/admin/menu", label: "Menu", perm: "menu.write", icon: "UtensilsCrossed" },
  { href: "/admin/offers", label: "Offers", perm: "offers.write", icon: "BadgePercent" },
  { href: "/admin/content", label: "Website content", perm: "content.write", icon: "FileText" },
  { href: "/admin/gallery", label: "Gallery", perm: "content.write", icon: "Images" },
  { href: "/admin/reports", label: "Reports", perm: "reports.view", icon: "ChartColumn" },
  { href: "/admin/settings", label: "Booking settings", perm: "settings.write", icon: "Settings" },
  { href: "/admin/staff", label: "Staff", perm: "staff.manage", icon: "ShieldCheck" },
  { href: "/admin/audit", label: "Activity log", perm: "audit.view", icon: "History" },
];
