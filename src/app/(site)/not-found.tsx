import Link from "next/link";

export default function NotFound() {
  return (
    <section className="wrap max-w-2xl py-24">
      <h1 className="text-title text-wine">We can&apos;t find that page</h1>
      <p className="mt-4 text-lg text-ink-soft">It may have moved when we updated our website.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="btn btn-primary">Go to the homepage</Link>
        <Link href="/menu" className="btn btn-outline text-wine">View the menu</Link>
        <Link href="/book" className="btn btn-outline text-wine">Book a table</Link>
      </div>
    </section>
  );
}
