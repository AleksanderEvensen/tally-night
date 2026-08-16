import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: [".env.local", ".env"] });

const databaseUrl = process.env.TURSO_DATABASE_URL;
const databaseToken = process.env.TURSO_DATABASE_TOKEN
  ? process.env.TURSO_DATABASE_TOKEN
  : undefined;

export default defineConfig({
  out: "./drizzle",
  schema: "./src/drizzle/schema.ts",
  dialect: "turso",
  dbCredentials: {
    url: databaseUrl,
    authToken: databaseToken,
  },
});
