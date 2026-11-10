import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [string, number, MetadataRoute.Sitemap[number]["changeFrequency"]][] = [
    ["/", 1, "weekly"],
    ["/menu", 0.9, "weekly"],
    ["/book", 0.9, "monthly"],
    ["/order", 0.8, "monthly"],
    ["/offers", 0.7, "weekly"],
    ["/celebrations", 0.7, "monthly"],
    ["/gallery", 0.5, "monthly"],
    ["/about", 0.5, "yearly"],
    ["/contact", 0.6, "yearly"],
    ["/privacy", 0.1, "yearly"],
    ["/terms", 0.1, "yearly"],
    ["/cookies", 0.1, "yearly"],
  ];
  return pages.map(([path, priority, changeFrequency]) => ({ url: appUrl(path), priority, changeFrequency }));
}
