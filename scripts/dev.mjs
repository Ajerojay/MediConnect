import { config } from "dotenv";
import { spawn } from "node:child_process";
import { root, startLocalMysql } from "./local-mysql.mjs";
config({ path: `${root}/.env`, quiet: true });
let database, server;
try {
  database = await startLocalMysql();
  server = spawn(
    process.execPath,
    [
      `${root}/node_modules/concurrently/dist/bin/concurrently.js`,
      "-k",
      "--names",
      "api,web",
      `npm run start:dev --workspace backend`,
      `next dev --turbopack --port ${process.env.FRONTEND_PORT || 3000}`,
    ],
    { cwd: root, windowsHide: true, stdio: "inherit", shell: false },
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () => {
      server?.kill(signal);
      database?.kill();
    });
  server.on("exit", (code) => {
    database?.kill();
    process.exitCode = code ?? 0;
  });
} catch (error) {
  console.error(error.message);
  database?.kill();
  process.exitCode = 1;
}
