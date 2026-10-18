import {
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Injectable,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { z } from "zod";
import {
  Appointment,
  AppointmentStatus,
  MedicalRecord,
  Prescription,
  Role,
  User,
} from "../database/entities";
import { AuthRequest, JwtGuard, Roles, RolesGuard } from "../auth/auth";
import { idSchema, ok, ZodPipe } from "../common/http";
const fields = z
  .object({
    diagnosis: z.string().trim().min(2).max(1000),
    treatment: z.string().trim().min(2).max(2000),
    consultationNotes: z.string().trim().min(2).max(5000),
  })
  .strict();
const partial = fields
  .partial()
  .refine((v) => Object.keys(v).length > 0, "At least one field is required");
const prescription = z
  .object({
    medication: z.string().trim().min(1).max(200),
    dosage: z.string().trim().min(1).max(100),
    frequency: z.string().trim().min(1).max(100),
    duration: z.string().trim().min(1).max(100),
    instructions: z.string().max(500).nullable().optional(),
  })
  .strict();
const create = fields.extend({
  appointmentId: z.uuid(),
  prescriptions: z.array(prescription).max(20).default([]),
});
const relations = {
  patient: { user: true },
  doctor: { user: true },
  prescriptions: true,
};
@Injectable()
export class MedicalRecordRepository {
  readonly rows: Repository<MedicalRecord>;
  constructor(ds: DataSource) {
    this.rows = ds.getRepository(MedicalRecord);
  }
  get(id: string) {
    return this.rows.findOne({ where: { id }, relations });
  }
}
@Injectable()
export class MedicalRecordService {
  constructor(
    private readonly ds: DataSource,
    private readonly repository: MedicalRecordRepository,
  ) {}
  list(user: User) {
    return this.repository.rows.find({
      where:
        user.role === Role.PATIENT
          ? { patientId: user.patient?.id || "" }
          : user.role === Role.DOCTOR
            ? { doctorId: user.doctor?.id || "" }
            : {},
      relations,
      order: { visitDate: "DESC" },
      take: 100,
    });
  }
  async get(id: string, user: User) {
    const r = await this.repository.get(id);
    if (!r) throw new NotFoundException("Medical record was not found.");
    if (
      user.role !== Role.ADMIN &&
      user.patient?.id !== r.patientId &&
      user.doctor?.id !== r.doctorId
    )
      throw new ForbiddenException("You cannot access this medical record.");
    return r;
  }
  async create(input: z.infer<typeof create>, user: User) {
    if (!user.doctor)
      throw new ForbiddenException("A doctor profile is required.");
    const record = await this.ds.transaction(async (m) => {
      const appointment = await m.findOne(Appointment, {
        where: { id: input.appointmentId },
        lock: { mode: "pessimistic_write" },
      });
      if (!appointment)
        throw new NotFoundException("Appointment was not found.");
      if (appointment.doctorId !== user.doctor!.id)
        throw new ForbiddenException(
          "This appointment belongs to another doctor.",
        );
      if (
        appointment.status !== AppointmentStatus.APPROVED ||
        (await m.existsBy(MedicalRecord, { appointmentId: appointment.id }))
      )
        throw new ConflictException(
          "An approved, undocumented appointment is required.",
        );
      const r = await m.save(
        MedicalRecord,
        m.create(MedicalRecord, {
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          appointmentId: appointment.id,
          diagnosis: input.diagnosis,
          treatment: input.treatment,
          consultationNotes: input.consultationNotes,
          visitDate: new Date(),
        }),
      );
      if (input.prescriptions.length)
        await m.save(
          Prescription,
          input.prescriptions.map((p) =>
            m.create(Prescription, {
              ...p,
              instructions: p.instructions ?? null,
              medicalRecordId: r.id,
            }),
          ),
        );
      await m.update(Appointment, appointment.id, {
        status: AppointmentStatus.COMPLETED,
      });
      return r;
    });
    return this.repository.get(record.id);
  }
  async update(id: string, input: Partial<z.infer<typeof fields>>, user: User) {
    const r = await this.get(id, user);
    if (user.role !== Role.ADMIN && user.doctor?.id !== r.doctorId)
      throw new ForbiddenException(
        "Only the authoring doctor can update this record.",
      );
    await this.repository.rows.update(id, input);
    return this.repository.get(id);
  }
  async remove(id: string, user: User) {
    const r = await this.get(id, user);
    if (user.role !== Role.ADMIN && user.doctor?.id !== r.doctorId)
      throw new ForbiddenException(
        "Only the authoring doctor can delete this record.",
      );
    await this.repository.rows.delete(id);
  }
}
@Controller("medical-records")
@UseGuards(JwtGuard, RolesGuard)
export class MedicalRecordController {
  constructor(private readonly service: MedicalRecordService) {}
  @Get() async list(@Req() r: AuthRequest) {
    return ok(await this.service.list(r.user));
  }
  @Get(":id") async get(
    @Param("id", new ZodPipe(idSchema)) id: string,
    @Req() r: AuthRequest,
  ) {
    return ok(await this.service.get(id, r.user));
  }
  @Post() @Roles(Role.DOCTOR) async create(
    @Body(new ZodPipe(create)) body: z.infer<typeof create>,
    @Req() r: AuthRequest,
  ) {
    return ok(await this.service.create(body, r.user));
  }
  @Put(":id") @Roles(Role.ADMIN, Role.DOCTOR) async replace(
    @Param("id", new ZodPipe(idSchema)) id: string,
    @Body(new ZodPipe(fields)) body: z.infer<typeof fields>,
    @Req() r: AuthRequest,
  ) {
    return ok(await this.service.update(id, body, r.user));
  }
  @Patch(":id") @Roles(Role.ADMIN, Role.DOCTOR) async update(
    @Param("id", new ZodPipe(idSchema)) id: string,
    @Body(new ZodPipe(partial)) body: z.infer<typeof partial>,
    @Req() r: AuthRequest,
  ) {
    return ok(await this.service.update(id, body, r.user));
  }
  @Delete(":id") @Roles(Role.ADMIN, Role.DOCTOR) @HttpCode(204) remove(
    @Param("id", new ZodPipe(idSchema)) id: string,
    @Req() r: AuthRequest,
  ) {
    return this.service.remove(id, r.user);
  }
}
