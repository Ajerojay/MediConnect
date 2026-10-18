import {
  Controller,
  Get,
  Global,
  Module,
  ServiceUnavailableException,
} from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { dataSource } from "./database/data-source";
import { AuthController, AuthService, JwtGuard, RolesGuard } from "./auth/auth";
import {
  PatientController,
  PatientRepository,
  PatientService,
} from "./patients/patients";
import {
  DoctorController,
  DoctorRepository,
  DoctorService,
} from "./doctors/doctors";
import {
  AppointmentController,
  AppointmentRepository,
  AppointmentService,
} from "./appointments/appointments";
import {
  MedicalRecordController,
  MedicalRecordRepository,
  MedicalRecordService,
} from "./medical-records/medical-records";
import { UserController, UserService } from "./users/users";
@Global()
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: "1h", algorithm: "HS256" },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtGuard, RolesGuard],
  exports: [JwtGuard, RolesGuard],
})
class AuthenticationModule {}
@Module({
  controllers: [PatientController],
  providers: [PatientService, PatientRepository],
})
class PatientsModule {}
@Module({
  controllers: [DoctorController],
  providers: [DoctorService, DoctorRepository],
})
class DoctorsModule {}
@Module({
  controllers: [AppointmentController],
  providers: [AppointmentService, AppointmentRepository],
})
class AppointmentsModule {}
@Module({
  controllers: [MedicalRecordController],
  providers: [MedicalRecordService, MedicalRecordRepository],
})
class MedicalRecordsModule {}
@Module({ controllers: [UserController], providers: [UserService] })
class UsersModule {}
@Controller("health")
class HealthController {
  constructor(private readonly ds: DataSource) {}
  @Get() async health() {
    try {
      await this.ds.query("SELECT 1");
      return { status: "ok", database: "mysql" };
    } catch {
      throw new ServiceUnavailableException("Database is unavailable.");
    }
  }
}
@Module({
  imports: [
    TypeOrmModule.forRoot(dataSource.options),
    AuthenticationModule,
    PatientsModule,
    DoctorsModule,
    AppointmentsModule,
    MedicalRecordsModule,
    UsersModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
