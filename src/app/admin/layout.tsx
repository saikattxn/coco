import type { Metadata } from "next";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s · Coco Tamarind admin" }, robots: { index: false, follow: false } };
// Staff pages are per-request (session-based); allow them to render on the server each time.
export const instant = false;

export default function AdminRoot({ children }: LayoutProps<"/admin">) {
  return <div className="min-h-dvh bg-[#f7f2ea]">{children}</div>;
}
