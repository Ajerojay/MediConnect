import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  unlinkSync,
  existsSync,
} from "node:fs";
import mysql from "mysql2/promise";
import { root } from "./local-mysql.mjs";
config({ path: `${root}/.env`, quiet: true });

const values = {
  baseUrl: process.env.BACKEND_URL || "http://127.0.0.1:4000/api/v1",
  patientEmail: process.env.SEED_PATIENT_EMAIL,
  patientPassword: process.env.SEED_PATIENT_PASSWORD,
  doctorEmail: process.env.SEED_DOCTOR_EMAIL,
  doctorPassword: process.env.SEED_DOCTOR_PASSWORD,
  adminEmail: process.env.SEED_ADMIN_EMAIL,
  adminPassword: process.env.SEED_ADMIN_PASSWORD,
};
for (const [key, value] of Object.entries(values))
  if (!value)
    throw new Error(
      `Configure ${key} credentials in local .env before running API verification.`,
    );
const directory = `${root}/.local/verification`;
mkdirSync(directory, { recursive: true });
const runId = randomUUID();
const environmentFile = `${directory}/${runId}-environment.json`;
const reportFile = `${directory}/${runId}-report.json`;
writeFileSync(
  environmentFile,
  JSON.stringify({
    name: "Local API verification",
    values: Object.entries(values).map(([key, value]) => ({
      key,
      value,
      enabled: true,
    })),
  }),
);
try {
  const npmCli = process.env.npm_execpath;
  if (!npmCli)
    throw new Error("Run API verification through npm run test:api.");
  const cli = spawn(
    process.execPath,
    [
      npmCli,
      "exec",
      "--yes",
      "--package=newman@6.2.3",
      "--",
      "newman",
      "run",
      `${root}/postman/MediConnect.postman_collection.json`,
      "--environment",
      environmentFile,
      "--reporters",
      "cli,json",
      "--reporter-json-export",
      reportFile,
    ],
    { cwd: root, windowsHide: true, stdio: "inherit" },
  );
  const code = await new Promise((resolve, reject) => {
    cli.on("error", reject);
    cli.on("exit", resolve);
  });
  if (!existsSync(reportFile))
    throw new Error("Newman did not produce a verification report.");
  const summary = JSON.parse(readFileSync(reportFile, "utf8"));
  const results = {
    verifiedAt: new Date().toISOString(),
    runner: "Newman (Postman collection runner)",
    requests: summary.run.stats.requests,
    assertions: summary.run.stats.assertions,
    failures: summary.run.failures.map((f) => ({
      name: f.source?.name || f.error.name,
      message: f.error.message,
    })),
    cleanup: "Only verification records created by this run are removed.",
  };
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });
    const created = {};
    for (const execution of summary.run.executions) {
      if (execution.response?.code === 201) {
        const stream = execution.response.stream;
        const body = JSON.parse(Buffer.from(stream.data || stream).toString());
        created[execution.item.name] = body.data?.id;
      }
    }
    for (const key of [
      "Create appointment",
      "Create consultation appointment",
    ]) {
      const id = created[key];
      if (id) {
        await connection.execute(
          "DELETE FROM medical_records WHERE appointmentId = ?",
          [id],
        );
        await connection.execute("DELETE FROM appointments WHERE id = ?", [id]);
      }
    }
    for (const [key, table] of [
      ["Create patient", "patients"],
      ["Create doctor", "doctors"],
    ]) {
      const id = created[key];
      if (id) {
        const [rows] = await connection.execute(
          `SELECT userId FROM ${table} WHERE id = ?`,
          [id],
        );
        await connection.execute(`DELETE FROM ${table} WHERE id = ?`, [id]);
        for (const row of rows)
          await connection.execute("DELETE FROM users WHERE id = ?", [
            row.userId,
          ]);
      }
    }
    await connection.end();
  } catch {
    results.cleanup = "Verification cleanup needs attention.";
    process.exitCode = 1;
  }
  writeFileSync(
    `${root}/docs/VERIFICATION.json`,
    JSON.stringify(results, null, 2) + "\n",
  );
  if (results.failures.length || code !== 0) process.exitCode = 1;
} finally {
  for (const file of [environmentFile, reportFile])
    if (existsSync(file)) unlinkSync(file);
}
