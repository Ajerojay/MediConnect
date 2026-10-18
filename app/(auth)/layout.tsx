import { HeartPulse } from "lucide-react";
import Link from "next/link";
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <section className="hidden bg-sky-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <HeartPulse className="text-teal-300" />
          MediConnect
        </Link>
        <div>
          <p className="max-w-lg text-4xl font-black leading-tight">
            Care coordination that feels calm, clear, and human.
          </p>
          <p className="mt-5 max-w-md leading-7 text-sky-200">
            Your appointments and health records stay connected through every
            visit.
          </p>
        </div>
        <p className="text-sm text-sky-300">
          Private by design · Role-based access
        </p>
      </section>
      <section className="grid place-items-center p-5 sm:p-10">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </div>
  );
}
