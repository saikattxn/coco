"use client";

import type { AnchorHTMLAttributes } from "react";
import { trackEvent, type TrackedEvent } from "@/lib/track";

/** A link that records a conversion event (first-party count + GA4 when consented). */
export function TrackedLink({ event, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { event: TrackedEvent; href: string }) {
  return (
    <a
      {...props}
      onClick={(e) => {
        trackEvent(event);
        props.onClick?.(e);
      }}
    />
  );
}
