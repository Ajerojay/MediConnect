import { z } from "zod";
export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: z.email(),
  password: z.string().min(8),
});
export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
export const appointmentSchema = z.object({
  doctorId: z.string().min(1),
  startsAt: z.coerce
    .date()
    .refine((date) => date > new Date(), "Choose a future time"),
  reason: z.string().trim().min(5).max(500),
  notes: z.string().trim().max(1000).optional(),
});
export const appointmentStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["APPROVED", "COMPLETED", "CANCELLED"]),
  reason: z.string().max(500).optional(),
});
export const recordSchema = z.object({
  appointmentId: z.string().uuid(),
  diagnosis: z.string().trim().min(2).max(1000),
  treatment: z.string().trim().min(2).max(2000),
  consultationNotes: z.string().trim().min(2).max(5000),
  medication: z.string().trim().max(200).optional(),
  dosage: z.string().trim().max(100).optional(),
  frequency: z.string().trim().max(100).optional(),
  duration: z.string().trim().max(100).optional(),
  instructions: z.string().trim().max(500).optional(),
});
export const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(300).optional(),
  emergencyContact: z.string().trim().max(100).optional(),
  bloodType: z.string().trim().max(5).optional(),
  allergies: z.string().trim().max(500).optional(),
});
