import { cacheLife } from "next/cache";

/** Copyright year, cached for a day so the page can still be prerendered. */
export async function Year() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}
