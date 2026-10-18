"use server";
import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { recordSchema } from "@/lib/validation";
import type { ActionState } from "./auth";
export async function createMedicalRecord(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireRole("DOCTOR");
  const parsed = recordSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const prescriptions =
    d.medication && d.dosage && d.frequency && d.duration
      ? [
          {
            medication: d.medication,
            dosage: d.dosage,
            frequency: d.frequency,
            duration: d.duration,
            instructions: d.instructions,
          },
        ]
      : [];
  try {
    await api("/medical-records", {
      method: "POST",
      body: JSON.stringify({
        appointmentId: d.appointmentId,
        diagnosis: d.diagnosis,
        treatment: d.treatment,
        consultationNotes: d.consultationNotes,
        prescriptions,
      }),
    });
    for (const path of [
      "/doctor/medical-records",
      "/doctor/schedule",
      "/patient/medical-records",
    ])
      revalidatePath(path);
    return { success: "Consultation record saved." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unable to save record." };
  }
}
