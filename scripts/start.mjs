import { config } from "dotenv";
import { spawn } from "node:child_process";
import { root, startLocalMysql } from "./local-mysql.mjs";
config({ path: `${root}/.env`, quiet: true });
const database = await startLocalMysql();
const server = spawn(
  process.execPath,
  [
    `${root}/node_modules/concurrently/dist/bin/concurrently.js`,
    "-k",
    "--names",
    "api,web",
    "node backend/dist/main.js",
    `next start --port ${process.env.FRONTEND_PORT || 3000}`,
  ],
  { cwd: root, windowsHide: true, stdio: "inherit" },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    server.kill(signal);
    database?.kill();
  });
server.on("exit", (code) => {
  database?.kill();
  process.exitCode = code ?? 0;
});
