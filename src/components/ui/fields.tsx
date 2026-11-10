"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

type Common = { label: ReactNode; name: string; error?: string; hint?: string; optional?: boolean; className?: string };

function describedBy(id: string, error?: string, hint?: string) {
  return [error ? `${id}-err` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
}

function Meta({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error) return <p id={`${id}-err`} className="field-error">{error}</p>;
  if (hint) return <p id={`${id}-hint`} className="field-hint">{hint}</p>;
  return null;
}

function Label({ id, label, optional }: { id: string; label: ReactNode; optional?: boolean }) {
  return (
    <label htmlFor={id} className="field-label">
      {label} {optional && <span className="font-normal text-ink-soft">(optional)</span>}
    </label>
  );
}

export function TextField({ label, name, error, hint, optional, className, ...rest }: Common & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className={className}>
      <Label id={id} label={label} optional={optional} />
      <input id={id} name={name} className="field" aria-invalid={Boolean(error)} aria-describedby={describedBy(id, error, hint)} {...rest} />
      <Meta id={id} error={error} hint={hint} />
    </div>
  );
}

export function TextArea({ label, name, error, hint, optional, className, ...rest }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <div className={className}>
      <Label id={id} label={label} optional={optional} />
      <textarea id={id} name={name} className="field" rows={4} aria-invalid={Boolean(error)} aria-describedby={describedBy(id, error, hint)} {...rest} />
      <Meta id={id} error={error} hint={hint} />
    </div>
  );
}

export function SelectField({ label, name, error, hint, optional, className, children, ...rest }: Common & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <div className={className}>
      <Label id={id} label={label} optional={optional} />
      <select id={id} name={name} className="field" aria-invalid={Boolean(error)} aria-describedby={describedBy(id, error, hint)} {...rest}>
        {children}
      </select>
      <Meta id={id} error={error} hint={hint} />
    </div>
  );
}

export function FormAlert({ error }: { error?: string }) {
  if (!error) return null;
  return <div role="alert" className="rounded-xl border border-bad/40 bg-[#fbeceb] p-4 text-bad">{error}</div>;
}

export function Honeypot() {
  return (
    <div aria-hidden className="hidden">
      <label>
        Leave this empty <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
