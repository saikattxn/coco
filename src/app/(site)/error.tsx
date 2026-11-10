"use client";

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="wrap max-w-2xl py-24">
      <h1 className="text-title text-wine">Something went wrong</h1>
      <p className="mt-4 text-lg text-ink-soft">This page didn&apos;t load properly. Please try again — if you were making a booking, you can also call us.</p>
      <button type="button" onClick={reset} className="btn btn-primary mt-8">Try again</button>
    </section>
  );
}
