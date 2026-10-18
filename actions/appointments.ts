"use server";
import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { appointmentSchema } from "@/lib/validation";
import type { ActionState } from "./auth";
function refresh() {
  for (const path of [
    "/patient/appointments",
    "/doctor/schedule",
    "/doctor/medical-records",
  ])
    revalidatePath(path);
}
export async function bookAppointment(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireRole("PATIENT");
  const values = Object.fromEntries(form);
  const local = String(values.startsAt ?? "");
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local))
    values.startsAt = `${local}:00+08:00`;
  const parsed = appointmentSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    await api("/appointments", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    refresh();
    return { success: "Appointment requested successfully." };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Unable to book appointment.",
    };
  }
}
export async function updateAppointmentStatus(form: FormData) {
  await requireRole("DOCTOR", "ADMIN");
  await api(`/appointments/${String(form.get("id"))}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: form.get("status") }),
  });
  refresh();
}
export async function cancelAppointment(form: FormData) {
  await requireRole("PATIENT");
  await api(`/appointments/${String(form.get("id"))}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "CANCELLED",
      reason: "Cancelled by patient",
    }),
  });
  refresh();
}
