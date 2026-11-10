import type { Metadata } from "next";
import { getGallery } from "@/server/public-data";
import { PageHero } from "@/components/site/section";
import { GalleryGrid } from "./gallery-grid";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photographs of our food, restaurant and bar at Coco Tamarind, Askett.",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage() {
  const images = await getGallery();
  return (
    <>
      <PageHero title="Gallery" intro="Food from our kitchen and moments from the restaurant." />
      <div className="wrap py-14 md:py-20">
        <GalleryGrid images={images.map((i) => ({ id: i.id, url: i.url, alt: i.alt, caption: i.caption, category: i.category }))} />
      </div>
    </>
  );
}
