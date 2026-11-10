"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

/** Google Maps loads only when asked for — it sets third-party cookies. */
export function MapEmbed({ query }: { query: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-line bg-cream lg:aspect-auto lg:min-h-[22rem]">
      {show ? (
        <iframe
          title="Map showing Coco Tamarind"
          src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`}
          className="absolute inset-0 size-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center p-6 text-center">
          <div>
            <MapPin aria-hidden className="mx-auto size-8 text-gold" />
            <p className="mt-3 max-w-xs text-sm text-ink-soft">The map is provided by Google, which may set cookies.</p>
            <button type="button" onClick={() => setShow(true)} className="btn btn-outline mt-4 text-wine">Show map</button>
          </div>
        </div>
      )}
    </div>
  );
}
