import { config } from "dotenv";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { root } from "./local-mysql.mjs";
config({ path: `${root}/.env`, quiet: true });
const binary =
  process.env.MYSQL_DUMP_BINARY ||
  join(
    dirname(
      process.env.MYSQL_SERVER_BINARY ||
        "C:/Program Files/MySQL/MySQL Server 8.0/bin/mysqld.exe",
    ),
    "mysqldump.exe",
  );
const sql = execFileSync(
  binary,
  [
    "--host",
    process.env.MYSQL_HOST || "127.0.0.1",
    "--port",
    process.env.MYSQL_PORT || "3306",
    "--user",
    process.env.MYSQL_USER || "root",
    "--no-data",
    "--no-tablespaces",
    "--skip-comments",
    "--set-gtid-purged=OFF",
    process.env.MYSQL_DATABASE || "mediconnect",
  ],
  {
    env: { ...process.env, MYSQL_PWD: process.env.MYSQL_PASSWORD || "" },
    windowsHide: true,
    encoding: "utf8",
  },
);
writeFileSync(`${root}/docs/database.sql`, sql);
console.log(
  "Exported database structure to docs/database.sql (no account data or password hashes).",
);
