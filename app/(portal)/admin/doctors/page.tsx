import { api } from "@/lib/api";
import type { Doctor } from "@/lib/types";
import { requireRole } from "@/lib/auth";
import { PageHeading } from "@/components/page-heading";
import { Card } from "@/components/ui/card";
export default async function Doctors() {
  await requireRole("ADMIN");
  const items = await api<Doctor[]>("/doctors?limit=100");
  return (
    <>
      <PageHeading
        title="Doctors"
        description="Clinical team directory and workload."
      />
      <Card className="divide-y">
        {items.map((d) => (
          <div
            key={d.id}
            className="flex flex-col justify-between gap-2 p-5 sm:flex-row"
          >
            <div>
              <p className="font-bold">Dr. {d.user.fullName}</p>
              <p className="text-sm text-slate-500">
                {d.specialization} · License {d.licenseNumber}
              </p>
            </div>
            <p className="text-sm font-semibold">
              {d.appointmentCount ?? 0} appointments
            </p>
          </div>
        ))}
      </Card>
    </>
  );
}
