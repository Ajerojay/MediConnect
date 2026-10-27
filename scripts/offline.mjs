import { config } from "dotenv";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { root, startLocalMysql, run } from "./local-mysql.mjs";
config({ path: resolve(root, ".env"), quiet: true });
const mode = process.argv[2] || "dev";
if (!["dev", "start", "api", "test"].includes(mode))
  throw new Error("Unknown offline command.");
const local = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
if (!local.has(process.env.MYSQL_HOST || "127.0.0.1"))
  throw new Error("Offline mode requires a local MYSQL_HOST.");
const base = new URL(process.env.BACKEND_URL || "http://127.0.0.1:4000/api/v1");
if (!local.has(base.hostname))
  throw new Error("Offline mode requires a localhost BACKEND_URL.");
for (const key of ["MYSQL_DATABASE", "MYSQL_USER", "JWT_SECRET"])
  if (!process.env[key])
    throw new Error(
      `Missing ${key}. Complete npm run setup before the school demo.`,
    );
if (!existsSync(resolve(root, "node_modules/typescript/bin/tsc")))
  throw new Error(
    "Install dependencies with npm ci while internet is available before the demo.",
  );
if (
  process.env.MYSQL_MANAGED_LOCAL === "true" &&
  !existsSync(resolve(root, ".local/mysql/data/auto.cnf"))
)
  throw new Error(
    "Local database is missing. Run npm run setup before the demo.",
  );
if (mode === "start" && !existsSync(resolve(root, ".next/BUILD_ID")))
  throw new Error(
    "Production build missing. Run npm run build first, or use npm run dev:offline.",
  );
const guard = resolve(root, "scripts/local-network-only.cjs").replaceAll(
  "\\",
  "/",
);
const env = {
  ...process.env,
  NODE_OPTIONS: `${process.env.NODE_OPTIONS || ""} --require="${guard}"`.trim(),
  NEXT_TELEMETRY_DISABLED: "1",
  NPM_CONFIG_OFFLINE: "true",
  NO_PROXY: "localhost,127.0.0.1,::1",
  no_proxy: "localhost,127.0.0.1,::1",
};
console.log(
  `Offline ${mode}: local connections only; no npm downloads. Database port ${process.env.MYSQL_PORT || 3306}.`,
);
let database, child;
try {
  let entry;
  if (mode === "api") {
    database = await startLocalMysql();
    await run(
      process.execPath,
      [
        resolve(root, "node_modules/typescript/bin/tsc"),
        "-p",
        resolve(root, "backend/tsconfig.json"),
      ],
      { env },
    );
    entry = resolve(root, "backend/dist/main.js");
  } else {
    entry = resolve(
      root,
      mode === "test" ? "scripts/test-api.mjs" : `scripts/${mode}.mjs`,
    );
  }
  child = spawn(process.execPath, [entry], {
    cwd: root,
    env,
    windowsHide: true,
    stdio: "inherit",
  });
  const stop = () => child?.kill();
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  const code = await new Promise((resolvePromise, reject) => {
    child.on("error", reject);
    child.on("exit", resolvePromise);
  });
  process.off("SIGINT", stop);
  process.off("SIGTERM", stop);
  process.exitCode = code ?? 0;
} finally {
  if (database) database.kill();
}
