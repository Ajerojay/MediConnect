import { api } from "@/lib/api";
import type { Appointment } from "@/lib/types";
import { requireRole } from "@/lib/auth";
import { PageHeading } from "@/components/page-heading";
import { AppointmentList } from "@/components/appointment-list";
export default async function Schedule() {
  await requireRole("DOCTOR");
  const appointments = await api<Appointment[]>("/appointments?limit=100");
  return (
    <>
      <PageHeading
        title="Schedule"
        description="Upcoming requests and confirmed consultations."
      />
      <AppointmentList appointments={appointments} />
    </>
  );
}
