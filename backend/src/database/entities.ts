import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";

export enum Role {
  PATIENT = "PATIENT",
  DOCTOR = "DOCTOR",
  ADMIN = "ADMIN",
}
export enum AppointmentStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ unique: true, length: 254 }) email: string;
  @Column({ select: false, length: 255 }) passwordHash: string;
  @Column({ length: 80 }) fullName: string;
  @Column({ type: "varchar", length: 30, nullable: true }) phone: string | null;
  @Column({ type: "enum", enum: Role, default: Role.PATIENT }) role: Role;
  @Column({ default: true }) isActive: boolean;
  @OneToOne(() => Patient, (p) => p.user) patient: Patient | null;
  @OneToOne(() => Doctor, (d) => d.user) doctor: Doctor | null;
  @CreateDateColumn({
    type: "datetime",
    precision: 3,
    default: () => "CURRENT_TIMESTAMP(3)",
  })
  createdAt: Date;
  @UpdateDateColumn({
    type: "datetime",
    precision: 3,
    default: () => "CURRENT_TIMESTAMP(3)",
    onUpdate: "CURRENT_TIMESTAMP(3)",
  })
  updatedAt: Date;
}
@Entity("patients")
export class Patient {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ unique: true, type: "varchar", length: 36 }) userId: string;
  @OneToOne(() => User, (u) => u.patient, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
  @Column({ type: "date", nullable: true }) dateOfBirth: string | null;
  @Column({ type: "varchar", length: 30, nullable: true }) gender:
    string | null;
  @Column({ type: "varchar", length: 300, nullable: true }) address:
    string | null;
  @Column({ type: "varchar", length: 100, nullable: true }) emergencyContact:
    string | null;
  @Column({ type: "varchar", length: 5, nullable: true }) bloodType:
    string | null;
  @Column({ type: "text", nullable: true }) allergies: string | null;
  @OneToMany(() => Appointment, (a) => a.patient) appointments: Appointment[];
  @OneToMany(() => MedicalRecord, (r) => r.patient)
  medicalRecords: MedicalRecord[];
  @CreateDateColumn({
    type: "datetime",
    precision: 3,
    default: () => "CURRENT_TIMESTAMP(3)",
  })
  createdAt: Date;
  @UpdateDateColumn({
    type: "datetime",
    precision: 3,
    default: () => "CURRENT_TIMESTAMP(3)",
    onUpdate: "CURRENT_TIMESTAMP(3)",
  })
  updatedAt: Date;
}
@Entity("doctors")
export class Doctor {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ unique: true, type: "varchar", length: 36 }) userId: string;
  @OneToOne(() => User, (u) => u.doctor, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
  @Column({ length: 100 }) specialization: string;
  @Column({ unique: true, length: 100 }) licenseNumber: string;
  @OneToMany(() => Appointment, (a) => a.doctor) appointments: Appointment[];
  @OneToMany(() => MedicalRecord, (r) => r.doctor)
  medicalRecords: MedicalRecord[];
  @CreateDateColumn({
    type: "datetime",
    precision: 3,
    default: () => "CURRENT_TIMESTAMP(3)",
  })
  createdAt: Date;
  @UpdateDateColumn({
    type: "datetime",
    precision: 3,
    default: () => "CURRENT_TIMESTAMP(3)",
    onUpdate: "CURRENT_TIMESTAMP(3)",
  })
  updatedAt: Date;
}
@Entity("appointments")
@Index(["doctorId", "startsAt"])
export class Appointment {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ type: "varchar", length: 36 }) patientId: string;
  @Column({ type: "varchar", length: 36 }) doctorId: string;
  @ManyToOne(() => Patient, (p) => p.appointments, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "patientId" })
  patient: Patient;
  @ManyToOne(() => Doctor, (d) => d.appointments, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "doctorId" })
  doctor: Doctor;
  @Column({ type: "datetime", precision: 3 }) startsAt: Date;
  @Column({ type: "datetime", precision: 3 }) endsAt: Date;
  @Column({ length: 500 }) reason: string;
  @Column({ type: "text", nullable: true }) notes: string | null;
  @Column({
    type: "enum",
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;
  @Column({ type: "varchar", length: 500, nullable: true }) cancellationReason:
    string | null;
  @OneToOne(() => MedicalRecord, (r) => r.appointment)
  medicalRecord: MedicalRecord | null;
  @CreateDateColumn({
    type: "datetime",
    precision: 3,
    default: () => "CURRENT_TIMESTAMP(3)",
  })
  createdAt: Date;
  @UpdateDateColumn({
    type: "datetime",
    precision: 3,
    default: () => "CURRENT_TIMESTAMP(3)",
    onUpdate: "CURRENT_TIMESTAMP(3)",
  })
  updatedAt: Date;
}
@Entity("medical_records")
export class MedicalRecord {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ type: "varchar", length: 36 }) patientId: string;
  @Column({ type: "varchar", length: 36 }) doctorId: string;
  @Column({ type: "varchar", length: 36, unique: true, nullable: true })
  appointmentId: string | null;
  @ManyToOne(() => Patient, (p) => p.medicalRecords, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "patientId" })
  patient: Patient;
  @ManyToOne(() => Doctor, (d) => d.medicalRecords, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "doctorId" })
  doctor: Doctor;
  @OneToOne(() => Appointment, (a) => a.medicalRecord, { onDelete: "SET NULL" })
  @JoinColumn({ name: "appointmentId" })
  appointment: Appointment | null;
  @Column({ type: "text" }) diagnosis: string;
  @Column({ type: "text" }) treatment: string;
  @Column({ type: "text" }) consultationNotes: string;
  @Column({ type: "datetime", precision: 3 }) visitDate: Date;
  @OneToMany(() => Prescription, (p) => p.medicalRecord, {
    cascade: ["insert"],
  })
  prescriptions: Prescription[];
  @CreateDateColumn({
    type: "datetime",
    precision: 3,
    default: () => "CURRENT_TIMESTAMP(3)",
  })
  createdAt: Date;
  @UpdateDateColumn({
    type: "datetime",
    precision: 3,
    default: () => "CURRENT_TIMESTAMP(3)",
    onUpdate: "CURRENT_TIMESTAMP(3)",
  })
  updatedAt: Date;
}
@Entity("prescriptions")
export class Prescription {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ type: "varchar", length: 36 }) medicalRecordId: string;
  @ManyToOne(() => MedicalRecord, (r) => r.prescriptions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "medicalRecordId" })
  medicalRecord: MedicalRecord;
  @Column({ length: 200 }) medication: string;
  @Column({ length: 100 }) dosage: string;
  @Column({ length: 100 }) frequency: string;
  @Column({ length: 100 }) duration: string;
  @Column({ type: "varchar", length: 500, nullable: true }) instructions:
    string | null;
}
export const entities = [
  User,
  Patient,
  Doctor,
  Appointment,
  MedicalRecord,
  Prescription,
];
