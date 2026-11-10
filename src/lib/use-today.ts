"use client";

import { useSyncExternalStore } from "react";
import { londonDateIso } from "./time";

const noop = () => () => {};

/** Today's London date on the client; empty during server rendering (no hydration mismatch). */
export function useToday(): string {
  return useSyncExternalStore(noop, () => londonDateIso(new Date()), () => "");
}
