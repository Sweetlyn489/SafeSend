import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const isLocal = !connectionString || /localhost|127\.0\.0\.1/.test(connectionString);

export const pool = new Pool({
  ...(connectionString ? { connectionString } : {
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || "safesend",
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "postgres",
  }),
  ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
});

pool.on("error", (err) => console.error("Unexpected error on idle PostgreSQL client", err));

export async function query<T = any>(text: string, params?: any[]) {
  const result = await pool.query(text, params);
  return result.rows as T[];
}
