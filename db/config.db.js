import { createPool } from "mysql2/promise";

export const pool = createPool({
  host: "localhost",
  user: "root",
  password: "@bulMysql18",
  port: 3306,
  database: "tomistadb",
  namedPlaceholders: true,
});
