import { api } from "@/lib/api";
import type { Patient } from "@/lib/types";
import { requireRole } from "@/lib/auth";
import { PageHeading } from "@/components/page-heading";
import { Card } from "@/components/ui/card";
export default async function Patients() {
  await requireRole("DOCTOR");
  const patients = await api<Patient[]>("/patients?limit=100");
  const appointments = patients.map((patient) => ({
    patient,
    patientId: patient.id,
  }));
  return (
    <>
      <PageHeading
        title="Patients"
        description="People you have seen or are scheduled to see."
      />
      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="p-4">Patient</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Blood type</th>
              <th className="p-4">Records</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {appointments.map((a) => (
              <tr key={a.patientId}>
                <td className="p-4 font-bold">{a.patient.user.fullName}</td>
                <td className="p-4">{a.patient.user.email}</td>
                <td className="p-4">{a.patient.bloodType ?? "—"}</td>
                <td className="p-4">{a.patient.recordCount ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
