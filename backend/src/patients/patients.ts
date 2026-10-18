import {
  Body,
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
import { DataSource, Repository } from "typeorm";
import { hash } from "bcryptjs";
import { z } from "zod";
import { Patient, Role, User } from "../database/entities";
import {
  accountSchema,
  AuthRequest,
  JwtGuard,
  Roles,
  RolesGuard,
} from "../auth/auth";
import { idSchema, ok, pageSchema, ZodPipe } from "../common/http";
const fields = z
  .object({
    fullName: z.string().trim().min(2).max(80),
    phone: z.string().max(30).nullable(),
    dateOfBirth: z.iso.date().nullable(),
    gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).nullable(),
    address: z.string().max(300).nullable(),
    emergencyContact: z.string().max(100).nullable(),
    bloodType: z.string().max(5).nullable(),
    allergies: z.string().max(500).nullable(),
  })
  .strict();
const partial = fields
  .partial()
  .refine((v) => Object.keys(v).length > 0, "At least one field is required");
const create = accountSchema.extend({
  dateOfBirth: fields.shape.dateOfBirth.optional(),
  gender: fields.shape.gender.optional(),
  address: fields.shape.address.optional(),
  emergencyContact: fields.shape.emergencyContact.optional(),
  bloodType: fields.shape.bloodType.optional(),
  allergies: fields.shape.allergies.optional(),
});
@Injectable()
export class PatientRepository {
  readonly rows: Repository<Patient>;
  constructor(ds: DataSource) {
    this.rows = ds.getRepository(Patient);
  }
  get(id: string) {
    return this.rows.findOne({ where: { id }, relations: { user: true } });
  }
}
@Injectable()
export class PatientService {
  constructor(
    private readonly ds: DataSource,
    private readonly repository: PatientRepository,
  ) {}
  async list(q: z.infer<typeof pageSchema>) {
    const qb = this.repository.rows
      .createQueryBuilder("patient")
      .leftJoinAndSelect("patient.user", "user")
      .loadRelationCountAndMap(
        "patient.appointmentCount",
        "patient.appointments",
      )
      .loadRelationCountAndMap("patient.recordCount", "patient.medicalRecords");
    if (q.search)
      qb.where("user.fullName LIKE :search OR user.email LIKE :search", {
        search: `%${q.search}%`,
      });
    return qb
      .orderBy("user.fullName", "ASC")
      .skip((q.page - 1) * q.limit)
      .take(q.limit)
      .getMany();
  }
  async get(id: string, user: User) {
    const patient = await this.repository.get(id);
    if (!patient) throw new NotFoundException("Patient was not found.");
    if (user.role === Role.PATIENT && user.patient?.id !== id)
      throw new ForbiddenException("You cannot access this patient.");
    return patient;
  }
  async create(input: z.infer<typeof create>) {
    return this.ds.transaction(async (m) => {
      const user = await m.save(
        User,
        m.create(User, {
          email: input.email,
          passwordHash: await hash(input.password, 12),
          fullName: input.fullName,
          phone: input.phone ?? null,
          role: Role.PATIENT,
        }),
      );
      const { email, password, fullName, phone, ...profile } = input;
      const patient = await m.save(
        Patient,
        m.create(Patient, { ...profile, userId: user.id }),
      );
      return m.findOne(Patient, {
        where: { id: patient.id },
        relations: { user: true },
      });
    });
  }
  async update(id: string, input: Partial<z.infer<typeof fields>>, user: User) {
    await this.get(id, user);
    await this.ds.transaction(async (m) => {
      const patient = await m.findOneByOrFail(Patient, { id });
      const { fullName, phone, ...profile } = input;
      if (fullName !== undefined || phone !== undefined)
        await m.update(
          User,
          { id: patient.userId },
          {
            ...(fullName !== undefined ? { fullName } : {}),
            ...(phone !== undefined ? { phone } : {}),
          },
        );
      if (Object.keys(profile).length) await m.update(Patient, { id }, profile);
    });
    return this.repository.get(id);
  }
  async remove(id: string, user: User) {
    const p = await this.get(id, user);
    await this.ds.transaction(async (m) => {
      await m.delete(Patient, id);
      await m.delete(User, p.userId);
    });
  }
}
@Controller("patients")
@UseGuards(JwtGuard, RolesGuard)
export class PatientController {
  constructor(private readonly service: PatientService) {}
  @Get() @Roles(Role.ADMIN, Role.DOCTOR) async list(
    @Query(new ZodPipe(pageSchema)) q: z.infer<typeof pageSchema>,
  ) {
    return ok(await this.service.list(q));
  }
  @Get(":id") async get(
    @Param("id", new ZodPipe(idSchema)) id: string,
    @Req() req: AuthRequest,
  ) {
    return ok(await this.service.get(id, req.user));
  }
  @Post() @Roles(Role.ADMIN) async create(
    @Body(new ZodPipe(create)) body: z.infer<typeof create>,
  ) {
    return ok(await this.service.create(body));
  }
  @Put(":id") @Roles(Role.ADMIN, Role.PATIENT) async replace(
    @Param("id", new ZodPipe(idSchema)) id: string,
    @Body(new ZodPipe(fields)) body: z.infer<typeof fields>,
    @Req() req: AuthRequest,
  ) {
    return ok(await this.service.update(id, body, req.user));
  }
  @Patch(":id") @Roles(Role.ADMIN, Role.PATIENT) async update(
    @Param("id", new ZodPipe(idSchema)) id: string,
    @Body(new ZodPipe(partial)) body: z.infer<typeof partial>,
    @Req() req: AuthRequest,
  ) {
    return ok(await this.service.update(id, body, req.user));
  }
  @Delete(":id") @HttpCode(204) @Roles(Role.ADMIN) remove(
    @Param("id", new ZodPipe(idSchema)) id: string,
    @Req() req: AuthRequest,
  ) {
    return this.service.remove(id, req.user);
  }
}
