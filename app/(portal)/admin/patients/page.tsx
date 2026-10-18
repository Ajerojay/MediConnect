import { api } from "@/lib/api";
import type { Patient } from "@/lib/types";
import { requireRole } from "@/lib/auth";
import { PageHeading } from "@/components/page-heading";
import { Card } from "@/components/ui/card";
export default async function Patients() {
  await requireRole("ADMIN");
  const items = await api<Patient[]>("/patients?limit=100");
  return (
    <>
      <PageHeading
        title="Patients"
        description="Patient directory and care activity."
      />
      <Card className="divide-y">
        {items.map((p) => (
          <div
            key={p.id}
            className="flex flex-col justify-between gap-2 p-5 sm:flex-row"
          >
            <div>
              <p className="font-bold">{p.user.fullName}</p>
              <p className="text-sm text-slate-500">
                {p.user.email} · Blood type {p.bloodType ?? "not recorded"}
              </p>
            </div>
            <p className="text-sm">
              {p.appointmentCount ?? 0} appointments · {p.recordCount ?? 0}{" "}
              records
            </p>
          </div>
        ))}
      </Card>
    </>
  );
}
