import { config } from "dotenv";
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import mysql from "mysql2/promise";
import { root, startLocalMysql, run } from "./local-mysql.mjs";
if (!existsSync(`${root}/.env`))
  copyFileSync(`${root}/.env.example`, `${root}/.env`);
config({ path: `${root}/.env`, quiet: true });
function save(values) {
  let env = readFileSync(`${root}/.env`, "utf8");
  for (const [key, value] of Object.entries(values)) {
    const line = `${key}=${JSON.stringify(value)}`;
    const regex = new RegExp(`^${key}=.*$`, "m");
    env = regex.test(env)
      ? env.replace(regex, () => line)
      : env + `\n${line}\n`;
    process.env[key] = value;
  }
  writeFileSync(`${root}/.env`, env);
}
if (!process.env.MYSQL_DATABASE) {
  save({
    MYSQL_MANAGED_LOCAL: "true",
    MYSQL_HOST: "127.0.0.1",
    MYSQL_PORT: "3307",
    MYSQL_DATABASE: "mediconnect",
    MYSQL_USER: "mediconnect",
    MYSQL_PASSWORD: randomBytes(24).toString("hex"),
    JWT_SECRET: randomBytes(48).toString("hex"),
    BACKEND_PORT: "4000",
    BACKEND_URL: "http://127.0.0.1:4000/api/v1",
  });
}
if (!process.env.JWT_SECRET)
  save({ JWT_SECRET: randomBytes(48).toString("hex") });
if (process.env.MYSQL_MANAGED_LOCAL === "true" && !process.env.MYSQL_PASSWORD)
  save({ MYSQL_PASSWORD: randomBytes(24).toString("hex") });
let child;
try {
  child = await startLocalMysql();
  if (process.env.MYSQL_MANAGED_LOCAL === "true") {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT),
      user: "root",
      password: process.env.MYSQL_ROOT_PASSWORD || "",
    });
    await connection.query(
      "CREATE DATABASE IF NOT EXISTS mediconnect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    );
    await connection.query(
      "CREATE USER IF NOT EXISTS 'mediconnect'@'localhost' IDENTIFIED BY ?",
      [process.env.MYSQL_PASSWORD],
    );
    await connection.query(
      "GRANT ALL PRIVILEGES ON mediconnect.* TO 'mediconnect'@'localhost'",
    );
    if (!process.env.MYSQL_ROOT_PASSWORD) {
      const password = randomBytes(24).toString("hex");
      await connection.query("ALTER USER 'root'@'localhost' IDENTIFIED BY ?", [
        password,
      ]);
      save({ MYSQL_ROOT_PASSWORD: password });
    }
    await connection.end();
  }
  await run(process.execPath, [
    `${root}/node_modules/typescript/bin/tsc`,
    "-p",
    `${root}/backend/tsconfig.json`,
  ]);
  await run(process.execPath, [`${root}/backend/dist/database/setup.js`]);
  console.log("MySQL schema is ready. Run npm run dev.");
} finally {
  if (child) child.kill();
}
