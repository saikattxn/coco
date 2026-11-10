import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-cream p-6 text-center">
      <div>
        <h1 className="text-title text-wine">Page not found</h1>
        <Link href="/" className="btn btn-primary mt-6">Go to the homepage</Link>
      </div>
    </main>
  );
}
