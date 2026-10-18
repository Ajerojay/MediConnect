"use client";
import Link from "next/link";
import { HeartPulse } from "lucide-react";
import { usePathname } from "next/navigation";
export function SiteHeader() {
  const path = usePathname();
  if (/^\/(patient|doctor|admin)(\/|$)/.test(path)) return null;
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-sky-950"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-sky-950 text-teal-300">
            <HeartPulse size={21} />
          </span>
          MediConnect
        </Link>
        <nav className="flex items-center gap-4 text-sm font-semibold">
          <Link
            href="/login"
            className="rounded-xl bg-teal-700 px-4 py-2.5 text-white"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
