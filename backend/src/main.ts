import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ApiExceptionFilter } from "./common/http";
async function bootstrap() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
    throw new Error("Set JWT_SECRET to at least 32 random characters in .env.");
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api/v1");
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableShutdownHooks();
  await app.listen(Number(process.env.BACKEND_PORT || 4000), "127.0.0.1");
  console.log(
    `MediConnect API: http://localhost:${process.env.BACKEND_PORT || 4000}/api/v1`,
  );
}
bootstrap().catch((error) => {
  console.error("Backend startup failed:", error.message);
  process.exitCode = 1;
});
