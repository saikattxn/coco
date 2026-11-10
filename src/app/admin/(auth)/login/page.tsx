import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { Wordmark } from "@/components/site/logo";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-wine-deep p-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Wordmark /></div>
        <div className="rounded-2xl bg-ivory p-7 shadow-xl">
          <h1 className="font-display text-3xl text-wine">Staff sign in</h1>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
