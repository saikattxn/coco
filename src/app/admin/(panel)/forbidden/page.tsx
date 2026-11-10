import Link from "next/link";

export default function Forbidden() {
  return (
    <div className="max-w-xl">
      <h1 className="font-display text-4xl text-wine">You don&apos;t have access to that page</h1>
      <p className="mt-2 text-ink-soft">Your role doesn&apos;t include this area. Ask a Super Admin if you need access.</p>
      <Link href="/admin" className="btn btn-primary mt-6">Back to overview</Link>
    </div>
  );
}
