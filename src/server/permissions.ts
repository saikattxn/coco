/** Single source of truth for roles and permissions. Seeded into the DB; checked server-side. */
export const PERMISSIONS = {
  "dashboard.view": "View the dashboard overview",
  "reservations.read": "View reservations and booking calendar",
  "reservations.write": "Create, edit, confirm and cancel reservations",
  "reservations.export": "Export reservations to CSV",
  "menu.write": "Manage menu categories and dishes",
  "content.write": "Edit page content, gallery, hours and contact details",
  "seo.write": "Edit SEO metadata",
  "offers.write": "Manage offers and promotions",
  "customers.read": "View customer records",
  "customers.write": "Edit customers, consent, export and erase personal data",
  "enquiries.read": "View contact and event enquiries",
  "enquiries.write": "Update enquiry status and notes",
  "staff.manage": "Manage staff accounts and roles",
  "settings.write": "Change booking rules, seating and opening hours",
  "reports.view": "View reports and analytics",
  "audit.view": "View the audit log",
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

const ALL = Object.keys(PERMISSIONS) as PermissionKey[];

export const ROLES: Record<string, { name: string; description: string; permissions: PermissionKey[] }> = {
  SUPER_ADMIN: {
    name: "Super Admin",
    description: "Full access including staff accounts",
    permissions: ALL,
  },
  MANAGER: {
    name: "Restaurant Manager",
    description: "Runs the restaurant day to day: everything except staff accounts",
    permissions: ALL.filter((p) => p !== "staff.manage"),
  },
  RESERVATIONS: {
    name: "Reservation Staff",
    description: "Front of house: bookings, guests and enquiries",
    permissions: [
      "dashboard.view",
      "reservations.read",
      "reservations.write",
      "customers.read",
      "enquiries.read",
      "enquiries.write",
    ],
  },
  CONTENT: {
    name: "Content Editor",
    description: "Website content, menu, gallery and offers",
    permissions: ["dashboard.view", "menu.write", "content.write", "seo.write", "offers.write"],
  },
};

export function roleHas(roleKey: string, permission: PermissionKey): boolean {
  return ROLES[roleKey]?.permissions.includes(permission) ?? false;
}
