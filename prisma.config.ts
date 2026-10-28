import "dotenv/config";
import { defineConfig } from "prisma/config";

const rawUrl =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_q8lPuIyzp3md@ep-gentle-dust-ba57jg0m-pooler.c-8.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const directUrl = rawUrl.replace("-pooler", "");

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: directUrl + (directUrl.includes("schema=") ? "" : "&schema=public"),
  },
});
