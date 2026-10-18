import { api } from "@/lib/api";
import type { MedicalRecord } from "@/lib/types";
import { requireRole } from "@/lib/auth";
import { PageHeading } from "@/components/page-heading";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
export default async function Records() {
  await requireRole("PATIENT");
  const records = await api<MedicalRecord[]>("/medical-records");
  return (
    <>
      <PageHeading
        title="Medical records"
        description="Your visit history, diagnoses, treatments, and prescriptions."
      />
      <div className="space-y-4">
        {records.length ? (
          records.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold">{r.diagnosis}</h2>
                  <p className="text-sm text-slate-500">
                    {formatDate(r.visitDate)} · Dr. {r.doctor.user.fullName}
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Treatment
                  </p>
                  <p className="mt-1">{r.treatment}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Consultation notes
                  </p>
                  <p className="mt-1">{r.consultationNotes}</p>
                </div>
              </div>
              {r.prescriptions.length > 0 && (
                <div className="mt-5 rounded-xl bg-teal-50 p-4">
                  <p className="font-bold text-teal-900">Prescriptions</p>
                  {r.prescriptions.map((p) => (
                    <p key={p.id} className="mt-2 text-sm">
                      {p.medication} · {p.dosage} · {p.frequency} for{" "}
                      {p.duration}
                    </p>
                  ))}
                </div>
              )}
            </Card>
          ))
        ) : (
          <Card className="p-10 text-center text-slate-500">
            No medical records are available yet.
          </Card>
        )}
      </div>
    </>
  );
}
