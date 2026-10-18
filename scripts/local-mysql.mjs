import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import mysql from "mysql2/promise";
export const root = resolve(import.meta.dirname, "..");
export async function startLocalMysql() {
  if (process.env.MYSQL_MANAGED_LOCAL !== "true") return null;
  try {
    const c = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      connectTimeout: 1000,
    });
    await c.end();
    return null;
  } catch (e) {
    if (e.code !== "ECONNREFUSED") throw e;
  }
  const binary =
    process.env.MYSQL_SERVER_BINARY ||
    "C:/Program Files/MySQL/MySQL Server 8.0/bin/mysqld.exe";
  if (!existsSync(binary))
    throw new Error(
      "MySQL server binary was not found. Configure MYSQL_SERVER_BINARY or use an existing MySQL instance.",
    );
  const data = resolve(root, ".local/mysql/data");
  mkdirSync(data, { recursive: true });
  if (!existsSync(resolve(data, "auto.cnf"))) {
    console.log("Initializing the isolated local MySQL database...");
    await run(binary, [
      "--no-defaults",
      "--initialize-insecure",
      `--basedir=${dirname(dirname(binary))}`,
      `--datadir=${data}`,
      `--log-error=${resolve(root, ".local/mysql/initialize.log")}`,
    ]);
  }
  const child = spawn(
    binary,
    [
      "--no-defaults",
      `--basedir=${dirname(dirname(binary))}`,
      `--datadir=${data}`,
      `--port=${process.env.MYSQL_PORT || 3307}`,
      "--bind-address=127.0.0.1",
      "--mysqlx=OFF",
      `--log-error=${resolve(root, ".local/mysql/server.log")}`,
    ],
    { cwd: root, windowsHide: true, stdio: "ignore" },
  );
  child.on("error", (e) => console.error("MySQL process:", e.message));
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      const c = await mysql.createConnection({
        host: "127.0.0.1",
        port: Number(process.env.MYSQL_PORT || 3307),
        user: "root",
        password: process.env.MYSQL_ROOT_PASSWORD || "",
        connectTimeout: 1000,
      });
      await c.end();
      return child;
    } catch (e) {
      if (child.exitCode !== null)
        throw new Error("Local MySQL stopped; see .local/mysql/server.log.");
    }
  }
  child.kill();
  throw new Error("MySQL did not become ready.");
}
export function run(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      windowsHide: true,
      stdio: "inherit",
      ...options,
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolvePromise()
        : reject(new Error(`${command} exited with ${code}`)),
    );
  });
}
