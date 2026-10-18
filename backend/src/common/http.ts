import {
  ArgumentsHost,
  UnprocessableEntityException,
  Catch,
  ExceptionFilter,
  HttpException,
  Injectable,
  PipeTransform,
} from "@nestjs/common";
import { z } from "zod";
import { QueryFailedError } from "typeorm";
@Injectable()
export class ZodPipe implements PipeTransform {
  constructor(private readonly schema: z.ZodType) {}
  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success)
      throw new UnprocessableEntityException({
        code: "VALIDATION_ERROR",
        message: "The request contains invalid data.",
        details: result.error.flatten(),
      });
    return result.data;
  }
}
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    let status = 500;
    let code = "INTERNAL_SERVER_ERROR";
    let message = "An unexpected server error occurred.";
    let details: unknown;
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === "string") message = body;
      else {
        const b = body as Record<string, unknown>;
        message = String(b.message || message);
        code = String(
          b.code || exception.name.replace(/Exception$/, "").toUpperCase(),
        );
        details = b.details;
      }
    } else if (exception instanceof QueryFailedError) {
      const driver = exception.driverError as { code?: string };
      if (driver.code === "ER_DUP_ENTRY") {
        status = 409;
        code = "RESOURCE_CONFLICT";
        message = "A record with these unique values already exists.";
      } else if (
        ["ER_ROW_IS_REFERENCED_2", "ER_NO_REFERENCED_ROW_2"].includes(
          driver.code || "",
        )
      ) {
        status = 409;
        code = "RELATED_RECORD_CONFLICT";
        message = "This operation conflicts with a related record.";
      }
    }
    if (status === 500) console.error(exception);
    response.status(status).json({
      success: false,
      error: { code, message, ...(details ? { details } : {}) },
    });
  }
}
export const ok = <T>(data: T) => ({ success: true, data });
export const idSchema = z.uuid();
export const pageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
});
