import "reflect-metadata";
import { config } from "dotenv";
import { resolve } from "node:path";
import { DataSource } from "typeorm";
import { entities } from "./entities";
config({ path: resolve(__dirname, "../../../.env"), quiet: true });
export const dataSource = new DataSource({
  type: "mysql",
  host: process.env.MYSQL_HOST || "127.0.0.1",
  port: Number(process.env.MYSQL_PORT || 3306),
  username: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "mediconnect",
  entities,
  synchronize: false,
  logging: false,
  timezone: "Z",
  charset: "utf8mb4",
});
