import Link from "next/link";
import { logout } from "@/actions/auth";
import {
  CalendarDays,
  FileHeart,
  LogOut,
  Stethoscope,
  UserRound,
  UsersRound,
} from "lucide-react";
import type { Role } from "@/lib/types";
import { initials } from "@/lib/utils";
const links: Record<
  Role,
  { href: string; label: string; icon: typeof CalendarDays }[]
> = {
  PATIENT: [
    {
      href: "/patient/appointments",
      label: "Appointments",
      icon: CalendarDays,
    },
    {
      href: "/patient/medical-records",
      label: "Medical records",
      icon: FileHeart,
    },
  ],
  DOCTOR: [
    { href: "/doctor/schedule", label: "Schedule", icon: CalendarDays },
    { href: "/doctor/patients", label: "Patients", icon: UsersRound },
    {
      href: "/doctor/medical-records",
      label: "Medical records",
      icon: FileHeart,
    },
  ],
  ADMIN: [
    { href: "/admin/users", label: "Users", icon: UsersRound },
    { href: "/admin/doctors", label: "Doctors", icon: Stethoscope },
    { href: "/admin/patients", label: "Patients", icon: UserRound },
  ],
};
export function PortalShell({
  user,
  children,
}: {
  user: { fullName: string; email: string; role: Role };
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="border-b bg-sky-950 p-4 text-white lg:min-h-screen lg:border-b-0">
        <div className="flex items-center justify-between lg:block">
          <Link
            href={`/${user.role.toLowerCase()}/dashboard`}
            className="text-lg font-black"
          >
            MediConnect<span className="text-teal-300">+</span>
          </Link>
          <span className="rounded-full bg-sky-800 px-3 py-1 text-xs font-bold lg:hidden">
            {user.role}
          </span>
        </div>
        <nav className="mt-5 flex gap-2 overflow-x-auto pb-2 lg:mt-10 lg:block lg:space-y-1">
          {links[user.role].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="focus-ring flex min-w-max items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-sky-100 hover:bg-sky-900 hover:text-white"
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 hidden border-t border-sky-800 pt-5 lg:block">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-teal-600 text-sm font-black">
              {initials(user.fullName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{user.fullName}</p>
              <p className="truncate text-xs text-sky-300">{user.email}</p>
            </div>
          </div>
          <form action={logout}>
            <button className="focus-ring mt-4 flex items-center gap-2 text-sm text-sky-200 hover:text-white">
              <LogOut size={16} /> Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex min-h-16 items-center justify-between border-b bg-white px-4 sm:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
              {user.role.toLowerCase()} workspace
            </p>
            <p className="font-bold">Welcome, {user.fullName.split(" ")[0]}</p>
          </div>
          <form action={logout}>
            <button className="focus-ring flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600">
              <LogOut size={16} /> Sign out
            </button>
          </form>
        </header>
        <main className="p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
