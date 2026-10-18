import { config } from "dotenv";
import { spawn } from "node:child_process";
import { root, startLocalMysql } from "./local-mysql.mjs";
config({ path: `${root}/.env`, quiet: true });
const database = await startLocalMysql();
const options = { cwd: root, windowsHide: true, stdio: "inherit" };
const api = spawn(process.execPath, [`${root}/backend/dist/main.js`], options);
const web = spawn(
  process.execPath,
  [
    `${root}/node_modules/next/dist/bin/next`,
    "start",
    "--port",
    process.env.FRONTEND_PORT || "3000",
  ],
  options,
);
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  api.kill();
  web.kill();
  database?.kill();
  process.exitCode = code;
}
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    stop();
  });
api.on("exit", (code) => stop(code ?? 0));
web.on("exit", (code) => stop(code ?? 0));
