import Link from "next/link";
export default function NotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center p-6 text-center">
      <div>
        <p className="text-7xl font-black text-teal-700">404</p>
        <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-slate-500">
          The page may have moved or you may not have access.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-sky-950 px-5 py-3 font-bold text-white"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}
