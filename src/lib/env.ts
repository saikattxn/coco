/** Public base URL used in emails, canonical URLs and the sitemap. */
export function appUrl(path = ""): string {
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL; // set automatically on Vercel, e.g. coco-abc.vercel.app
  const base = (process.env.APP_URL || (vercel ? `https://${vercel}` : "http://localhost:3000")).replace(/\/$/, "");
  return `${base}${path}`;
}
