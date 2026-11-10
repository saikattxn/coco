import "server-only";
import { after } from "next/server";
import { processOutbox } from "./outbox";

/** Send queued emails right after the response is sent. The cron job is the safety net. */
export function kickOutbox() {
  if (process.env.NODE_ENV === "test") return;
  after(async () => {
    try {
      await processOutbox(10);
    } catch (e) {
      console.error("Outbox processing failed (will retry via cron)", e);
    }
  });
}
