import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let cached: Db | undefined;

function createDb(): Db {
  const connectionString =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.DATABASE_URL_UNPOOLED;

  if (!connectionString) {
    throw new Error(
      "No database connection string was provided. Set DATABASE_URL (or POSTGRES_URL)."
    );
  }

  const sql: NeonQueryFunction<false, false> = neon(connectionString);
  return drizzle(sql, { schema });
}

/** Lazily initialised so Next.js build can import API routes without DATABASE_URL. */
export const db: Db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    if (!cached) cached = createDb();
    const value = Reflect.get(cached, prop, receiver);
    return typeof value === "function" ? value.bind(cached) : value;
  },
});
