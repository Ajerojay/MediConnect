"use client";
import { useActionState } from "react";
import { createMedicalRecord } from "@/actions/records";
import { Input } from "@/components/ui/input";
import { FormSubmit } from "@/components/form-submit";
export function MedicalRecordForm({
  appointments,
}: {
  appointments: { id: string; label: string }[];
}) {
  const [state, action] = useActionState(createMedicalRecord, {});
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold sm:col-span-2">
        Appointment
        <select
          name="appointmentId"
          required
          className="mt-2 h-11 w-full rounded-xl border bg-white px-3"
        >
          <option value="">Choose approved appointment</option>
          {appointments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </label>
      {[
        ["Diagnosis", "diagnosis"],
        ["Treatment", "treatment"],
        ["Consultation notes", "consultationNotes"],
      ].map(([l, n]) => (
        <label key={n} className="text-sm font-semibold sm:col-span-2">
          {l}
          <textarea
            name={n}
            required
            className="mt-2 min-h-20 w-full rounded-xl border p-3"
          />
        </label>
      ))}
      <p className="border-t pt-4 font-bold sm:col-span-2">
        Prescription{" "}
        <span className="font-normal text-slate-400">(optional)</span>
      </p>
      {[
        ["Medication", "medication"],
        ["Dosage", "dosage"],
        ["Frequency", "frequency"],
        ["Duration", "duration"],
        ["Instructions", "instructions"],
      ].map(([l, n]) => (
        <label key={n} className="text-sm font-semibold">
          {l}
          <Input className="mt-2" name={n} />
        </label>
      ))}
      {state.error && (
        <p className="text-red-700 sm:col-span-2">{state.error}</p>
      )}
      {state.success && (
        <p className="text-teal-700 sm:col-span-2">{state.success}</p>
      )}
      <FormSubmit className="sm:col-span-2">
        Save consultation record
      </FormSubmit>
    </form>
  );
}
