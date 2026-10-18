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
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { DataSource, EntityManager, Repository } from "typeorm";
import { z } from "zod";
import {
  Appointment,
  AppointmentStatus,
  Doctor,
  Role,
  User,
} from "../database/entities";
import { AuthRequest, JwtGuard, Roles, RolesGuard } from "../auth/auth";
import { idSchema, ok, pageSchema, ZodPipe } from "../common/http";
const future = z.coerce
  .date()
  .refine((v) => v > new Date(), "Choose a future date");
const fields = z
  .object({
    startsAt: future,
    reason: z.string().trim().min(5).max(500),
    notes: z.string().trim().max(1000).nullable(),
  })
  .strict();
const create = fields.extend({
  doctorId: z.uuid(),
  notes: fields.shape.notes.optional(),
});
const partial = fields
  .partial()
  .refine((v) => Object.keys(v).length > 0, "At least one field is required");
const statusSchema = z
  .object({
    status: z.enum(["APPROVED", "COMPLETED", "CANCELLED"]),
    reason: z.string().trim().max(500).optional(),
  })
  .strict();
const querySchema = pageSchema.extend({
  status: z.nativeEnum(AppointmentStatus).optional(),
});
const relations = {
  patient: { user: true },
  doctor: { user: true },
  medicalRecord: true,
};
@Injectable()
export class AppointmentRepository {
  readonly rows: Repository<Appointment>;
  constructor(ds: DataSource) {
    this.rows = ds.getRepository(Appointment);
  }
  get(id: string) {
    return this.rows.findOne({ where: { id }, relations });
  }
}
@Injectable()
export class AppointmentService {
  constructor(
    private readonly ds: DataSource,
    private readonly repository: AppointmentRepository,
  ) {}
  async list(user: User, q: z.infer<typeof querySchema>) {
    const qb = this.repository.rows
      .createQueryBuilder("appointment")
      .leftJoinAndSelect("appointment.patient", "patient")
      .leftJoinAndSelect("patient.user", "patientUser")
      .leftJoinAndSelect("appointment.doctor", "doctor")
      .leftJoinAndSelect("doctor.user", "doctorUser")
      .leftJoinAndSelect("appointment.medicalRecord", "medicalRecord");
    if (user.role === Role.PATIENT)
      qb.andWhere("appointment.patientId=:id", { id: user.patient?.id || "" });
    if (user.role === Role.DOCTOR)
      qb.andWhere("appointment.doctorId=:id", { id: user.doctor?.id || "" });
    if (q.status)
      qb.andWhere("appointment.status=:status", { status: q.status });
    const [items, total] = await qb
      .orderBy("appointment.startsAt", "DESC")
      .skip((q.page - 1) * q.limit)
      .take(q.limit)
      .getManyAndCount();
    return {
      items,
      total,
      page: q.page,
      limit: q.limit,
      totalPages: Math.ceil(total / q.limit),
    };
  }
  assertAccess(user: User, a: Appointment) {
    if (
      user.role !== Role.ADMIN &&
      user.patient?.id !== a.patientId &&
      user.doctor?.id !== a.doctorId
    )
      throw new ForbiddenException("You cannot access this appointment.");
  }
  async get(id: string, user: User) {
    const a = await this.repository.get(id);
    if (!a) throw new NotFoundException("Appointment was not found.");
    this.assertAccess(user, a);
    return a;
  }
  private async checkSlot(
    m: EntityManager,
    doctorId: string,
    start: Date,
    end: Date,
    exclude?: string,
  ) {
    const doctor = await m.findOne(Doctor, {
      where: { id: doctorId },
      relations: { user: true },
      lock: { mode: "pessimistic_write" },
    });
    if (!doctor?.user.isActive)
      throw new NotFoundException("Active doctor was not found.");
    const qb = m
      .getRepository(Appointment)
      .createQueryBuilder("a")
      .where(
        "a.doctorId=:doctorId AND a.status IN (:...statuses) AND a.startsAt < :end AND a.endsAt > :start",
        {
          doctorId,
          statuses: [AppointmentStatus.PENDING, AppointmentStatus.APPROVED],
          start,
          end,
        },
      );
    if (exclude) qb.andWhere("a.id<>:exclude", { exclude });
    if (await qb.getExists())
      throw new ConflictException("The doctor is not available at that time.");
  }
  async create(user: User, input: z.infer<typeof create>) {
    if (!user.patient)
      throw new ConflictException("A patient profile is required.");
    const endsAt = new Date(input.startsAt.getTime() + 1800000);
    const a = await this.ds.transaction(async (m) => {
      await this.checkSlot(m, input.doctorId, input.startsAt, endsAt);
      return m.save(
        Appointment,
        m.create(Appointment, {
          ...input,
          notes: input.notes ?? null,
          patientId: user.patient!.id,
          endsAt,
        }),
      );
    });
    return this.repository.get(a.id);
  }
  async update(id: string, user: User, input: Partial<z.infer<typeof fields>>) {
    await this.get(id, user);
    await this.ds.transaction(async (m) => {
      const a = await m.findOne(Appointment, {
        where: { id },
        lock: { mode: "pessimistic_write" },
      });
      if (!a) throw new NotFoundException("Appointment was not found.");
      if (a.status !== AppointmentStatus.PENDING)
        throw new ConflictException("Only pending appointments can be edited.");
      const start = input.startsAt ?? a.startsAt;
      const end = new Date(start.getTime() + 1800000);
      if (input.startsAt) await this.checkSlot(m, a.doctorId, start, end, id);
      await m.update(Appointment, id, {
        ...input,
        startsAt: start,
        endsAt: end,
      });
    });
    return this.repository.get(id);
  }
  async status(id: string, user: User, input: z.infer<typeof statusSchema>) {
    await this.get(id, user);
    await this.ds.transaction(async (m) => {
      const a = await m.findOne(Appointment, {
        where: { id },
        lock: { mode: "pessimistic_write" },
      });
      if (!a) throw new NotFoundException("Appointment was not found.");
      if (user.role === Role.PATIENT && input.status !== "CANCELLED")
        throw new ForbiddenException("Patients may only cancel appointments.");
      const allowed =
        a.status === AppointmentStatus.PENDING
          ? ["APPROVED", "CANCELLED"]
          : a.status === AppointmentStatus.APPROVED
            ? ["COMPLETED", "CANCELLED"]
            : [];
      if (!allowed.includes(input.status))
        throw new ConflictException("This status transition is not allowed.");
      await m.update(Appointment, id, {
        status: input.status as AppointmentStatus,
        cancellationReason:
          input.status === "CANCELLED" ? (input.reason ?? "Cancelled") : null,
      });
    });
    return this.repository.get(id);
  }
  async remove(id: string, user: User) {
    await this.get(id, user);
    await this.ds.transaction(async (m) => {
      const a = await m.findOne(Appointment, {
        where: { id },
        lock: { mode: "pessimistic_write" },
      });
      if (!a) throw new NotFoundException("Appointment was not found.");
      if (a.status !== AppointmentStatus.PENDING)
        throw new ConflictException(
          "Only pending appointments can be deleted.",
        );
      await m.delete(Appointment, id);
    });
  }
}
@Controller("appointments")
@UseGuards(JwtGuard, RolesGuard)
export class AppointmentController {
  constructor(private readonly service: AppointmentService) {}
  @Get() async list(
    @Query(new ZodPipe(querySchema)) q: z.infer<typeof querySchema>,
    @Req() req: AuthRequest,
  ) {
    const r = await this.service.list(req.user, q);
    return {
      ...ok(r.items),
      meta: {
        pagination: {
          page: r.page,
          limit: r.limit,
          total: r.total,
          totalPages: r.totalPages,
        },
      },
    };
  }
  @Get(":id") async get(
    @Param("id", new ZodPipe(idSchema)) id: string,
    @Req() req: AuthRequest,
  ) {
    return ok(await this.service.get(id, req.user));
  }
  @Post() @Roles(Role.PATIENT) async create(
    @Body(new ZodPipe(create)) body: z.infer<typeof create>,
    @Req() req: AuthRequest,
  ) {
    return ok(await this.service.create(req.user, body));
  }
  @Put(":id") @Roles(Role.PATIENT, Role.ADMIN) async replace(
    @Param("id", new ZodPipe(idSchema)) id: string,
    @Body(new ZodPipe(fields)) body: z.infer<typeof fields>,
    @Req() req: AuthRequest,
  ) {
    return ok(await this.service.update(id, req.user, body));
  }
  @Patch(":id") @Roles(Role.PATIENT, Role.ADMIN) async update(
    @Param("id", new ZodPipe(idSchema)) id: string,
    @Body(new ZodPipe(partial)) body: z.infer<typeof partial>,
    @Req() req: AuthRequest,
  ) {
    return ok(await this.service.update(id, req.user, body));
  }
  @Patch(":id/status") async status(
    @Param("id", new ZodPipe(idSchema)) id: string,
    @Body(new ZodPipe(statusSchema)) body: z.infer<typeof statusSchema>,
    @Req() req: AuthRequest,
  ) {
    return ok(await this.service.status(id, req.user, body));
  }
  @Delete(":id") @HttpCode(204) @Roles(Role.PATIENT, Role.ADMIN) remove(
    @Param("id", new ZodPipe(idSchema)) id: string,
    @Req() req: AuthRequest,
  ) {
    return this.service.remove(id, req.user);
  }
}
