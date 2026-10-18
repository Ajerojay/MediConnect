import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Injectable,
  NotFoundException,
  Param,
  Patch,
  Req,
  UseGuards,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import { z } from "zod";
import { Role, User } from "../database/entities";
import { AuthRequest, JwtGuard, Roles, RolesGuard } from "../auth/auth";
import { idSchema, ok, ZodPipe } from "../common/http";
const update = z
  .object({
    fullName: z.string().trim().min(2).max(80).optional(),
    phone: z.string().max(30).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, "At least one field is required");
@Injectable()
export class UserService {
  constructor(private readonly ds: DataSource) {}
  list() {
    return this.ds
      .getRepository(User)
      .find({ order: { createdAt: "DESC" }, take: 100 });
  }
  async get(id: string) {
    const u = await this.ds.getRepository(User).findOneBy({ id });
    if (!u) throw new NotFoundException("User was not found.");
    return u;
  }
  async update(id: string, input: z.infer<typeof update>, actor: User) {
    await this.get(id);
    if (id === actor.id && input.isActive === false)
      throw new ForbiddenException(
        "You cannot disable your own administrator account.",
      );
    await this.ds.getRepository(User).update(id, input);
    return this.get(id);
  }
}
@Controller("users")
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UserController {
  constructor(private readonly service: UserService) {}
  @Get() async list() {
    return ok(await this.service.list());
  }
  @Get(":id") async get(@Param("id", new ZodPipe(idSchema)) id: string) {
    return ok(await this.service.get(id));
  }
  @Patch(":id") async update(
    @Param("id", new ZodPipe(idSchema)) id: string,
    @Body(new ZodPipe(update)) body: z.infer<typeof update>,
    @Req() r: AuthRequest,
  ) {
    return ok(await this.service.update(id, body, r.user));
  }
}
