import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { drizzle as drizzleLibSql } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "@/db/schema";
import path from "path";

let localDbInstance: ReturnType<typeof drizzleLibSql<typeof schema>> | null = null;

/**
 * Obtain Drizzle database instance.
 * In Cloudflare runtime, `d1Binding` is passed (e.g. env.DB).
 * In Node.js / local dev / tests, `@libsql/client` is used with a local file or in-memory sqlite.
 */
export function getDb(d1Binding?: any) {
  if (d1Binding) {
    return drizzleD1(d1Binding, { schema });
  }

  if (!localDbInstance) {
    const tursoUrl = process.env.TURSO_DATABASE_URL;
    const tursoToken = process.env.TURSO_AUTH_TOKEN;

    if (tursoUrl) {
      const client = createClient({
        url: tursoUrl,
        authToken: tursoToken,
      });
      localDbInstance = drizzleLibSql(client, { schema });
    } else {
      const rawPath = process.env.LOCAL_DB_PATH || path.join(process.cwd(), "local.sqlite");
      const normalizedPath = rawPath.replace(/\\/g, "/");
      const url = normalizedPath.startsWith("file:") ? normalizedPath : `file:${normalizedPath}`;
      const client = createClient({ url });
      localDbInstance = drizzleLibSql(client, { schema });
    }
  }

  return localDbInstance;
}

/**
 * Creates an isolated in-memory database instance for testing.
 */
export function createTestDb(url = ":memory:") {
  const client = createClient({ url });
  return drizzleLibSql(client, { schema });
}
