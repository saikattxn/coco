import { db } from "@/lib/db";
import { requirePermission } from "@/server/auth";
import { PageHeader, Panel, smallBtn } from "@/components/admin/ui";
import { storageMode } from "@/server/storage";
import { updateImageAction } from "./actions";
import { AddImageForm } from "./add-form";
import { GALLERY_CATS } from "@/lib/gallery";

export default async function GalleryAdmin() {
  await requirePermission("content.write");
  const images = await db.galleryImage.findMany({ where: { deletedAt: null }, orderBy: [{ category: "asc" }, { sortOrder: "asc" }] });
  return (
    <>
      <PageHeader title="Gallery" description="Photos for the gallery page and homepage. The first food photo is used in the homepage arch." />
      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <ul className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          {images.map((img) => (
            <li key={img.id} className="overflow-hidden rounded-xl border border-line bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt} className="aspect-[4/3] w-full bg-[#efe7da] object-cover" loading="lazy" />
              <form action={updateImageAction} className="space-y-2 p-3 text-sm">
                <input type="hidden" name="id" value={img.id} />
                <label className="block"><span className="text-xs text-ink-soft">Description</span><input name="alt" defaultValue={img.alt} className="field min-h-9 py-1.5" /></label>
                <label className="block"><span className="text-xs text-ink-soft">Caption</span><input name="caption" defaultValue={img.caption ?? ""} className="field min-h-9 py-1.5" /></label>
                <div className="flex gap-2">
                  <label className="flex-1"><span className="text-xs text-ink-soft">Category</span>
                    <select name="category" defaultValue={img.category} className="field min-h-9 py-1.5">{Object.entries(GALLERY_CATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                  </label>
                  <label className="w-20"><span className="text-xs text-ink-soft">Order</span><input name="sortOrder" type="number" min={0} defaultValue={img.sortOrder} className="field min-h-9 py-1.5" /></label>
                </div>
                <label className="flex items-center gap-2"><input type="checkbox" name="published" defaultChecked={img.published} className="size-4 accent-[#5a1724]" /> Show on website</label>
                <div className="flex justify-between pt-1">
                  <button name="op" value="save" className={smallBtn}>Save</button>
                  <button name="op" value="delete" className={`${smallBtn} text-bad`}>Remove</button>
                </div>
              </form>
            </li>
          ))}
        </ul>
        <Panel title="Add a photo">
          <AddImageForm uploadsEnabled={storageMode() !== "none"} />
        </Panel>
      </div>
    </>
  );
}
