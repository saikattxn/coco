import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  // Non-production deployments (previews, staging) are never indexed.
  if (process.env.ALLOW_INDEXING !== "1") return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/booking/"] },
    sitemap: appUrl("/sitemap.xml"),
    host: appUrl(),
  };
}
