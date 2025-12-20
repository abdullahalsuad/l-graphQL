import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

// Create the LibSQL database client
// In Prisma 7, the database URL is no longer in schema.prisma
const libsql = createClient({
  url: process.env.DATABASE_URL || "file:./prisma/dev.db",
});

// Initialize PrismaClient with the adapter
// This is the required pattern in Prisma 7
const prisma = new PrismaClient({
  adapter: new PrismaLibSQL(libsql),
});

export default prisma;
