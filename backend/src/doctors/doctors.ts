import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { hash } from "bcryptjs";
import { z } from "zod";
import { Doctor, Role, User } from "../database/entities";
import { accountSchema, JwtGuard, Roles, RolesGuard } from "../auth/auth";
import { idSchema, ok, pageSchema, ZodPipe } from "../common/http";
const fields = z
  .object({
    fullName: z.string().trim().min(2).max(80),
    phone: z.string().max(30).nullable(),
    specialization: z.string().trim().min(2).max(100),
    licenseNumber: z.string().trim().min(2).max(100),
  })
  .strict();
const partial = fields
  .partial()
  .refine((v) => Object.keys(v).length > 0, "At least one field is required");
const create = accountSchema.extend({
  specialization: fields.shape.specialization,
  licenseNumber: fields.shape.licenseNumber,
});
@Injectable()
export class DoctorRepository {
  readonly rows: Repository<Doctor>;
  constructor(ds: DataSource) {
    this.rows = ds.getRepository(Doctor);
  }
  get(id: string) {
    return this.rows.findOne({ where: { id }, relations: { user: true } });
  }
}
@Injectable()
export class DoctorService {
  constructor(
    private readonly ds: DataSource,
    private readonly repository: DoctorRepository,
  ) {}
  list(q: z.infer<typeof pageSchema>) {
    const qb = this.repository.rows
      .createQueryBuilder("doctor")
      .leftJoinAndSelect("doctor.user", "user")
      .loadRelationCountAndMap(
        "doctor.appointmentCount",
        "doctor.appointments",
      );
    if (q.search)
      qb.where(
        "user.fullName LIKE :search OR doctor.specialization LIKE :search",
        { search: `%${q.search}%` },
      );
    return qb
      .orderBy("user.fullName", "ASC")
      .skip((q.page - 1) * q.limit)
      .take(q.limit)
      .getMany();
  }
  async get(id: string) {
    const item = await this.repository.get(id);
    if (!item) throw new NotFoundException("Doctor was not found.");
    return item;
  }
  create(input: z.infer<typeof create>) {
    return this.ds.transaction(async (m) => {
      const user = await m.save(
        User,
        m.create(User, {
          email: input.email,
          passwordHash: await hash(input.password, 12),
          fullName: input.fullName,
          phone: input.phone ?? null,
          role: Role.DOCTOR,
        }),
      );
      const doctor = await m.save(
        Doctor,
        m.create(Doctor, {
          userId: user.id,
          specialization: input.specialization,
          licenseNumber: input.licenseNumber,
        }),
      );
      return m.findOne(Doctor, {
        where: { id: doctor.id },
        relations: { user: true },
      });
    });
  }
  async update(id: string, input: Partial<z.infer<typeof fields>>) {
    await this.get(id);
    await this.ds.transaction(async (m) => {
      const doctor = await m.findOneByOrFail(Doctor, { id });
      const { fullName, phone, ...profile } = input;
      if (fullName !== undefined || phone !== undefined)
        await m.update(
          User,
          { id: doctor.userId },
          {
            ...(fullName !== undefined ? { fullName } : {}),
            ...(phone !== undefined ? { phone } : {}),
          },
        );
      if (Object.keys(profile).length) await m.update(Doctor, { id }, profile);
    });
    return this.repository.get(id);
  }
  async remove(id: string) {
    const doctor = await this.get(id);
    await this.ds.transaction(async (m) => {
      await m.delete(Doctor, id);
      await m.delete(User, doctor.userId);
    });
  }
}
@Controller("doctors")
@UseGuards(JwtGuard, RolesGuard)
export class DoctorController {
  constructor(private readonly service: DoctorService) {}
  @Get() async list(
    @Query(new ZodPipe(pageSchema)) q: z.infer<typeof pageSchema>,
  ) {
    return ok(await this.service.list(q));
  }
  @Get(":id") async get(@Param("id", new ZodPipe(idSchema)) id: string) {
    return ok(await this.service.get(id));
  }
  @Post() @Roles(Role.ADMIN) async create(
    @Body(new ZodPipe(create)) body: z.infer<typeof create>,
  ) {
    return ok(await this.service.create(body));
  }
  @Put(":id") @Roles(Role.ADMIN) async replace(
    @Param("id", new ZodPipe(idSchema)) id: string,
    @Body(new ZodPipe(fields)) body: z.infer<typeof fields>,
  ) {
    return ok(await this.service.update(id, body));
  }
  @Patch(":id") @Roles(Role.ADMIN) async update(
    @Param("id", new ZodPipe(idSchema)) id: string,
    @Body(new ZodPipe(partial)) body: z.infer<typeof partial>,
  ) {
    return ok(await this.service.update(id, body));
  }
  @Delete(":id") @HttpCode(204) @Roles(Role.ADMIN) remove(
    @Param("id", new ZodPipe(idSchema)) id: string,
  ) {
    return this.service.remove(id);
  }
}
