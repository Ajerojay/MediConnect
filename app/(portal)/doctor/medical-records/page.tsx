import { api } from "@/lib/api";
import type { Appointment, MedicalRecord } from "@/lib/types";
import { requireRole } from "@/lib/auth";
import { PageHeading } from "@/components/page-heading";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MedicalRecordForm } from "@/components/medical-record-form";
import { formatDate } from "@/lib/utils";
export default async function MedicalRecords() {
  await requireRole("DOCTOR");
  const [allAppointments, records] = await Promise.all([
    api<Appointment[]>("/appointments?status=APPROVED&limit=100"),
    api<MedicalRecord[]>("/medical-records"),
  ]);
  const appointments = allAppointments.filter((a) => !a.medicalRecord);
  return (
    <>
      <PageHeading
        title="Medical records"
        description="Document consultations and prescriptions securely."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New consultation record</CardTitle>
          </CardHeader>
          <CardContent>
            <MedicalRecordForm
              appointments={appointments.map((a) => ({
                id: a.id,
                label: `${a.patient.user.fullName} — ${formatDate(a.startsAt)}`,
              }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent records</CardTitle>
          </CardHeader>
          <div className="divide-y">
            {records.map((r) => (
              <div key={r.id} className="p-5">
                <p className="font-bold">
                  {r.patient.user.fullName} · {r.diagnosis}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {formatDate(r.visitDate)} · {r.prescriptions.length}{" "}
                  prescription(s)
                </p>
              </div>
            ))}
            {!records.length && (
              <p className="p-8 text-center text-slate-500">
                No records created yet.
              </p>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
