import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL || "";

let _db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!_db) {
    try {
      const sql = neon(DATABASE_URL);
      _db = drizzle(sql, { schema });
    } catch {
      // If Neon connection fails (e.g., mock URL), create a placeholder
      const sql = neon("postgresql://mock:mock@localhost:5432/mock");
      _db = drizzle(sql, { schema });
    }
  }
  return _db;
}

// Proxy that lazily initializes the DB connection
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) {
    const instance = getDb();
    const value = (instance as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});

export type Database = ReturnType<typeof drizzle>;
