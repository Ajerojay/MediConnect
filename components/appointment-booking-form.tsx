"use client";
import { useActionState } from "react";
import { bookAppointment } from "@/actions/appointments";
import { Input } from "@/components/ui/input";
import { FormSubmit } from "@/components/form-submit";
export function AppointmentBookingForm({
  doctors,
}: {
  doctors: { id: string; name: string; specialization: string }[];
}) {
  const [state, action] = useActionState(bookAppointment, {});
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold">
        Doctor
        <select
          name="doctorId"
          required
          className="focus-ring mt-2 h-11 w-full rounded-xl border bg-white px-3"
        >
          <option value="">Choose a doctor</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} — {d.specialization}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-semibold">
        Date and time
        <Input
          className="mt-2"
          type="datetime-local"
          name="startsAt"
          required
        />
      </label>
      <label className="text-sm font-semibold sm:col-span-2">
        Reason for visit
        <textarea
          name="reason"
          required
          minLength={5}
          className="focus-ring mt-2 min-h-24 w-full rounded-xl border bg-white p-3"
        />
      </label>
      <label className="text-sm font-semibold sm:col-span-2">
        Additional notes{" "}
        <span className="font-normal text-slate-400">(optional)</span>
        <textarea
          name="notes"
          className="focus-ring mt-2 min-h-20 w-full rounded-xl border bg-white p-3"
        />
      </label>
      {state.error && (
        <p className="text-sm text-red-700 sm:col-span-2">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-teal-700 sm:col-span-2">{state.success}</p>
      )}
      <FormSubmit className="sm:col-span-2">Request appointment</FormSubmit>
    </form>
  );
}
