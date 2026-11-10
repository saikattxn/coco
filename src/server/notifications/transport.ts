import "server-only";
import { Resend } from "resend";

export type SendResult = { status: "SENT"; providerId: string } | { status: "SKIPPED"; reason: string };

export interface EmailTransport {
  send(msg: { to: string; subject: string; html: string; text: string; idempotencyKey: string }): Promise<SendResult>;
}

/** Resend transport — used when RESEND_API_KEY and EMAIL_FROM are configured. */
class ResendTransport implements EmailTransport {
  private client: Resend;
  constructor(apiKey: string, private from: string, private replyTo?: string) {
    this.client = new Resend(apiKey);
  }
  async send(msg: { to: string; subject: string; html: string; text: string; idempotencyKey: string }): Promise<SendResult> {
    const { data, error } = await this.client.emails.send(
      { from: this.from, to: msg.to, subject: msg.subject, html: msg.html, text: msg.text, replyTo: this.replyTo },
      { idempotencyKey: msg.idempotencyKey.slice(0, 256) },
    );
    if (error) throw new Error(`${error.name}: ${error.message}`);
    return { status: "SENT", providerId: data?.id ?? "unknown" };
  }
}

/** Development/test transport: records the message without sending anything. */
export class LogTransport implements EmailTransport {
  static outbox: { to: string; subject: string; text: string }[] = [];
  async send(msg: { to: string; subject: string; html: string; text: string }): Promise<SendResult> {
    LogTransport.outbox.push({ to: msg.to, subject: msg.subject, text: msg.text });
    if (process.env.NODE_ENV !== "test") console.info(`[email:log] to=${msg.to} subject="${msg.subject}"`);
    return { status: "SENT", providerId: "log" };
  }
}

/** No provider configured: nothing is sent, and the outbox records that honestly. */
class UnconfiguredTransport implements EmailTransport {
  async send(): Promise<SendResult> {
    return { status: "SKIPPED", reason: "Email provider not configured (set RESEND_API_KEY and EMAIL_FROM)" };
  }
}

export function getTransport(): EmailTransport {
  const mode = process.env.EMAIL_TRANSPORT;
  if (mode === "log" || process.env.NODE_ENV === "test") return new LogTransport();
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (key && from) return new ResendTransport(key, from, process.env.EMAIL_REPLY_TO || undefined);
  return new UnconfiguredTransport();
}

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM) || process.env.EMAIL_TRANSPORT === "log";
}
