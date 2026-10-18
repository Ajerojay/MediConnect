import { api } from "@/lib/api";
import type { Appointment, Doctor } from "@/lib/types";
import { requireRole } from "@/lib/auth";
import { cancelAppointment } from "@/actions/appointments";
import { AppointmentBookingForm } from "@/components/appointment-booking-form";
import { PageHeading } from "@/components/page-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
export default async function Appointments() {
  await requireRole("PATIENT");
  const [appointments, allDoctors] = await Promise.all([
    api<Appointment[]>("/appointments?limit=100"),
    api<Doctor[]>("/doctors?limit=100"),
  ]);
  const doctors = allDoctors.filter((d) => d.user.isActive);
  return (
    <>
      <PageHeading
        title="Appointments"
        description="Request a visit and follow its status."
      />
      <div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
        <Card id="book">
          <CardHeader>
            <CardTitle>Book an appointment</CardTitle>
          </CardHeader>
          <CardContent>
            <AppointmentBookingForm
              doctors={doctors.map((d) => ({
                id: d.id,
                name: `Dr. ${d.user.fullName}`,
                specialization: d.specialization,
              }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Appointment history</CardTitle>
          </CardHeader>
          <div className="divide-y">
            {appointments.length ? (
              appointments.map((a) => (
                <div key={a.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">Dr. {a.doctor.user.fullName}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDate(a.startsAt)} · {a.reason}
                      </p>
                    </div>
                    <Badge status={a.status}>{a.status}</Badge>
                  </div>
                  {["PENDING", "APPROVED"].includes(a.status) && (
                    <form action={cancelAppointment} className="mt-3">
                      <input type="hidden" name="id" value={a.id} />
                      <Button variant="danger">Cancel</Button>
                    </form>
                  )}
                </div>
              ))
            ) : (
              <p className="p-8 text-center text-slate-500">
                No appointments yet.
              </p>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
