import { Flame, Leaf } from "lucide-react";
import { formatPrice, SPICE_LABELS } from "@/lib/format";

export function SpiceMark({ level }: { level: number }) {
  if (!level) return null;
  const flames = Math.min(level, 3);
  return (
    <span className="inline-flex items-center gap-0.5 text-[#a8432d]" title={SPICE_LABELS[level]}>
      {Array.from({ length: flames }).map((_, i) => (
        <Flame key={i} aria-hidden className="size-3.5" />
      ))}
      <span className="sr-only">{SPICE_LABELS[level]}</span>
    </span>
  );
}

export function VegMark() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#e5eedf] px-2 py-0.5 text-xs font-semibold text-ok" title="Vegetarian">
      <Leaf aria-hidden className="size-3" /> V
      <span className="sr-only">Vegetarian</span>
    </span>
  );
}

/** "Name ........ £12.45" with description underneath. */
export function MenuLine({ name, price, description, spice, veg, unavailable, children }: { name: string; price: number; description?: string | null; spice?: number; veg?: boolean; unavailable?: boolean; children?: React.ReactNode }) {
  return (
    <div className={unavailable ? "opacity-55" : undefined}>
      <div className="flex items-baseline gap-2">
        <h3 className="font-display text-[1.4rem] leading-tight text-ink">{name}</h3>
        <span className="flex shrink-0 items-center gap-1.5">
          {veg && <VegMark />}
          <SpiceMark level={spice ?? 0} />
        </span>
        <span aria-hidden className="leader" />
        <span className="shrink-0 font-semibold tabular-nums text-wine">{unavailable ? "Unavailable" : formatPrice(price)}</span>
      </div>
      {description && <p className="mt-1 max-w-[60ch] text-[0.95rem] text-ink-soft">{description}</p>}
      {children}
    </div>
  );
}
