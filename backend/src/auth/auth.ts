import {
  Body,
  CanActivate,
  Controller,
  ExecutionContext,
  ForbiddenException,
  Get,
  HttpCode,
  Injectable,
  Post,
  Req,
  SetMetadata,
  UnauthorizedException,
  UseGuards,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Reflector } from "@nestjs/core";
import { DataSource } from "typeorm";
import { compare, hash } from "bcryptjs";
import { z } from "zod";
import { Patient, Role, User } from "../database/entities";
import { ok, ZodPipe } from "../common/http";
export interface AuthRequest {
  user: User;
  headers: { authorization?: string };
}
export const Roles = (...roles: Role[]) => SetMetadata("roles", roles);
export const accountSchema = z
  .object({
    email: z
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    fullName: z.string().trim().min(2).max(80),
    password: z.string().min(8).max(72),
    phone: z.string().trim().max(30).nullable().optional(),
  })
  .strict();
const loginSchema = z
  .object({
    email: z.email().transform((v) => v.toLowerCase()),
    password: z.string().min(1).max(72),
  })
  .strict();
@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly ds: DataSource,
  ) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer "))
      throw new UnauthorizedException("A valid Bearer token is required.");
    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync(authorization.slice(7), {
        algorithms: ["HS256"],
      });
    } catch {
      throw new UnauthorizedException(
        "The access token is invalid or expired.",
      );
    }
    const user = await this.ds.getRepository(User).findOne({
      where: { id: payload.sub },
      relations: { patient: true, doctor: true },
    });
    if (!user?.isActive)
      throw new UnauthorizedException("The account is unavailable.");
    request.user = user;
    return true;
  }
}
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<Role[]>("roles", [
      context.getHandler(),
      context.getClass(),
    ]);
    if (
      roles &&
      !roles.includes(
        context.switchToHttp().getRequest<AuthRequest>().user.role,
      )
    )
      throw new ForbiddenException("Your role cannot perform this action.");
    return true;
  }
}
@Injectable()
export class AuthService {
  constructor(
    private readonly ds: DataSource,
    private readonly jwt: JwtService,
  ) {}
  async register(input: z.infer<typeof accountSchema>) {
    if (await this.ds.getRepository(User).existsBy({ email: input.email }))
      throw new ConflictException("An account with this email already exists.");
    const passwordHash = await hash(input.password, 12);
    return this.ds.transaction(async (manager) => {
      const user = await manager.save(
        User,
        manager.create(User, {
          email: input.email,
          fullName: input.fullName,
          phone: input.phone ?? null,
          passwordHash,
          role: Role.PATIENT,
        }),
      );
      await manager.save(Patient, manager.create(Patient, { userId: user.id }));
      const { passwordHash: _, ...safe } = user;
      return safe;
    });
  }
  async login(input: z.infer<typeof loginSchema>) {
    const user = await this.ds
      .getRepository(User)
      .createQueryBuilder("user")
      .addSelect("user.passwordHash")
      .where("user.email=:email", { email: input.email })
      .getOne();
    if (!user?.isActive || !(await compare(input.password, user.passwordHash)))
      throw new UnauthorizedException("Email or password is incorrect.");
    const { passwordHash: _, ...safe } = user;
    return {
      accessToken: await this.jwt.signAsync({ sub: user.id }),
      tokenType: "bearer",
      expiresIn: 3600,
      user: safe,
    };
  }
}
@Controller("auth")
export class AuthController {
  constructor(private readonly service: AuthService) {}
  @Post("register") async register(
    @Body(new ZodPipe(accountSchema)) body: z.infer<typeof accountSchema>,
  ) {
    return ok(await this.service.register(body));
  }
  @Post("login")
  @HttpCode(200)
  async login(
    @Body(new ZodPipe(loginSchema)) body: z.infer<typeof loginSchema>,
  ) {
    return ok(await this.service.login(body));
  }
  @Get("me") @UseGuards(JwtGuard, RolesGuard) me(@Req() request: AuthRequest) {
    return ok(request.user);
  }
}
