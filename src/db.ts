import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    `postgres://user123:password123@localhost:5432/db123`,
});

export default pool;
