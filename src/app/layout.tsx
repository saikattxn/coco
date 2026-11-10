import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { appUrl } from "@/lib/env";
import "./globals.css";

const cormorant = localFont({
  src: [
    { path: "../fonts/cormorant-garamond-latin-wght-normal.woff2", style: "normal", weight: "300 700" },
    { path: "../fonts/cormorant-garamond-latin-wght-italic.woff2", style: "italic", weight: "300 700" },
  ],
  variable: "--font-cormorant",
  display: "swap",
});

const manrope = localFont({
  src: [{ path: "../fonts/manrope-latin-wght-normal.woff2", style: "normal", weight: "200 800" }],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: "Coco Tamarind | Indian Restaurant in Princes Risborough", template: "%s | Coco Tamarind" },
  description: "Fine Northern Indian and Bangladeshi cuisine at Askett, Princes Risborough.",
  applicationName: "Coco Tamarind",
  formatDetection: { telephone: false },
};

// Zoom is never disabled (WCAG 1.4.4)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3a0e17",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={`${cormorant.variable} ${manrope.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
