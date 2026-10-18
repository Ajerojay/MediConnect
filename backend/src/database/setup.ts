import { dataSource } from "./data-source";
import { User, Patient, Doctor, Role } from "./entities";
import { hash } from "bcryptjs";
async function main() {
  await dataSource.initialize();
  // Schema creation is an explicit setup operation, never automatic on API startup.
  await dataSource.synchronize();
  const accounts = [
    {
      email: process.env.SEED_PATIENT_EMAIL,
      password: process.env.SEED_PATIENT_PASSWORD,
      name: "Raffy Jay Ajero",
      role: Role.PATIENT,
    },
    {
      email: process.env.SEED_DOCTOR_EMAIL,
      password: process.env.SEED_DOCTOR_PASSWORD,
      name: "Levi",
      role: Role.DOCTOR,
    },
    {
      email: process.env.SEED_DOCTOR2_EMAIL,
      password: process.env.SEED_DOCTOR2_PASSWORD,
      name: "Hayek",
      role: Role.DOCTOR,
    },
    {
      email: process.env.SEED_ADMIN_EMAIL,
      password: process.env.SEED_ADMIN_PASSWORD,
      name: "Administrator",
      role: Role.ADMIN,
    },
  ];
  for (const a of accounts) {
    if (
      !a.email ||
      !a.password ||
      (await dataSource.getRepository(User).existsBy({ email: a.email }))
    )
      continue;
    await dataSource.transaction(async (m) => {
      const user = await m.save(
        User,
        m.create(User, {
          email: a.email!,
          fullName: a.name,
          passwordHash: await hash(a.password!, 12),
          role: a.role,
        }),
      );
      if (a.role === Role.PATIENT)
        await m.save(Patient, m.create(Patient, { userId: user.id }));
      if (a.role === Role.DOCTOR)
        await m.save(
          Doctor,
          m.create(Doctor, {
            userId: user.id,
            specialization: "General Medicine",
            licenseNumber: `MC-${user.id.slice(0, 8)}`,
          }),
        );
    });
  }
  console.log("Database schema and configured accounts are ready.");
}
main()
  .catch((error) => {
    console.error("Database setup failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => (dataSource.isInitialized ? dataSource.destroy() : undefined));
