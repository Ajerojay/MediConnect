import { watch } from "node:fs";
import { spawn } from "node:child_process";
import { root } from "./local-mysql.mjs";
let server,
  timer,
  building = false,
  pending = false;
async function rebuild() {
  if (building) {
    pending = true;
    return;
  }
  building = true;
  server?.kill();
  const compiler = spawn(
    process.execPath,
    [
      `${root}/node_modules/typescript/bin/tsc`,
      "-p",
      `${root}/backend/tsconfig.json`,
    ],
    { cwd: root, stdio: "inherit", windowsHide: true },
  );
  const code = await new Promise((resolve) => compiler.on("exit", resolve));
  building = false;
  if (pending) {
    pending = false;
    return rebuild();
  }
  if (code === 0)
    server = spawn(process.execPath, [`${root}/backend/dist/main.js`], {
      cwd: root,
      stdio: "inherit",
      windowsHide: true,
    });
  else console.error("Backend compilation failed. Waiting for source changes.");
}
const watcher = watch(
  `${root}/backend/src`,
  { recursive: true },
  (_event, file) => {
    if (file?.endsWith(".ts")) {
      clearTimeout(timer);
      timer = setTimeout(rebuild, 500);
    }
  },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    clearTimeout(timer);
    watcher.close();
    server?.kill();
    process.exit();
  });
await rebuild();
