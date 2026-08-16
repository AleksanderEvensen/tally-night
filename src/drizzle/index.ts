import "@tanstack/react-start/server-only";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { relations } from "./relations";
import { env } from "cloudflare:workers";

const client = createClient({
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_DATABASE_TOKEN || undefined,
});
export const db = drizzle({ client, relations, logger: true });
