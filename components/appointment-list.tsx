import { updateAppointmentStatus } from "@/actions/appointments";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
export function AppointmentList({
  appointments,
}: {
  appointments: {
    id: string;
    startsAt: Date | string;
    reason: string;
    status: string;
    patient: { user: { fullName: string } };
  }[];
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b p-5">
        <h2 className="text-lg font-bold">Appointments</h2>
      </div>
      {appointments.length ? (
        <div className="divide-y">
          {appointments.map((a) => (
            <div key={a.id} className="p-5">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <p className="font-bold">{a.patient.user.fullName}</p>
                  <p className="text-sm text-slate-500">
                    {formatDate(a.startsAt)} · {a.reason}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge status={a.status}>{a.status}</Badge>
                  {a.status === "PENDING" && (
                    <>
                      <StatusButton id={a.id} status="APPROVED">
                        Approve
                      </StatusButton>
                      <StatusButton id={a.id} status="CANCELLED" danger>
                        Reject
                      </StatusButton>
                    </>
                  )}
                  {a.status === "APPROVED" && (
                    <StatusButton id={a.id} status="COMPLETED">
                      Complete
                    </StatusButton>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="p-10 text-center text-slate-500">
          No appointments in this view.
        </p>
      )}
    </Card>
  );
}
function StatusButton({
  id,
  status,
  children,
  danger,
}: {
  id: string;
  status: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <form action={updateAppointmentStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <Button variant={danger ? "danger" : "outline"}>{children}</Button>
    </form>
  );
}
