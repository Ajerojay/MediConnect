import { config } from "dotenv";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { run, root } from "./local-mysql.mjs";
config({ path: resolve(root, ".env"), quiet: true });
const names = {
  baseUrl: process.env.BACKEND_URL || "http://127.0.0.1:4000/api/v1",
  patientEmail: process.env.SEED_PATIENT_EMAIL,
  patientPassword: process.env.SEED_PATIENT_PASSWORD,
  doctorEmail: process.env.SEED_DOCTOR_EMAIL,
  doctorPassword: process.env.SEED_DOCTOR_PASSWORD,
  adminEmail: process.env.SEED_ADMIN_EMAIL,
  adminPassword: process.env.SEED_ADMIN_PASSWORD,
};
if (Object.values(names).every(Boolean)) {
  const folder = resolve(root, ".local/postman");
  mkdirSync(folder, { recursive: true });
  writeFileSync(
    resolve(folder, "MediConnect.local.postman_environment.json"),
    JSON.stringify(
      {
        name: "MediConnect Local Offline",
        values: Object.entries(names).map(([key, value]) => ({
          key,
          value,
          enabled: true,
          type: key.endsWith("Password") ? "secret" : "default",
        })),
        _postman_variable_scope: "environment",
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "Private local Postman environment prepared under .local/postman (excluded from Git).",
  );
}
const directory = resolve(root, ".local/api-testing");
const cli = resolve(directory, "node_modules/newman/bin/newman.js");
if (existsSync(cli)) {
  console.log("Local Postman collection runner is already installed.");
} else {
  if (!process.env.npm_execpath)
    throw new Error("Run npm run setup:testing while internet is available.");
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    resolve(directory, "package.json"),
    JSON.stringify(
      { name: "mediconnect-local-api-testing", private: true },
      null,
      2,
    ) + "\n",
  );
  await run(process.execPath, [
    process.env.npm_execpath,
    "install",
    "--prefix",
    directory,
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    "--save-exact",
    "newman@6.2.3",
  ]);
  console.log(
    "Postman collection runner installed locally. npm run test:api now needs no package downloads.",
  );
}
