export type Role = "PATIENT" | "DOCTOR" | "ADMIN";
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
  patient?: Patient | null;
  doctor?: Doctor | null;
}
export interface Patient {
  id: string;
  userId: string;
  user: User;
  bloodType: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  allergies: string | null;
  emergencyContact: string | null;
  appointmentCount?: number;
  recordCount?: number;
}
export interface Doctor {
  id: string;
  userId: string;
  user: User;
  specialization: string;
  licenseNumber: string;
  appointmentCount?: number;
}
export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  patient: Patient;
  doctor: Doctor;
  startsAt: string;
  endsAt: string;
  reason: string;
  notes: string | null;
  status: string;
  medicalRecord: MedicalRecord | null;
}
export interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string | null;
}
export interface MedicalRecord {
  id: string;
  patient: Patient;
  doctor: Doctor;
  appointmentId: string | null;
  diagnosis: string;
  treatment: string;
  consultationNotes: string;
  visitDate: string;
  prescriptions: Prescription[];
}
