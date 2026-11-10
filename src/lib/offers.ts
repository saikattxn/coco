export function offerState(o: { active: boolean; startsAt: Date | null; endsAt: Date | null }, now = new Date()) {
  if (!o.active) return { status: "INACTIVE", label: "Paused" } as const;
  if (o.startsAt && o.startsAt > now) return { status: "PENDING", label: "Scheduled" } as const;
  if (o.endsAt && o.endsAt < now) return { status: "CLOSED", label: "Expired" } as const;
  return { status: "ACTIVE", label: "Live" } as const;
}
