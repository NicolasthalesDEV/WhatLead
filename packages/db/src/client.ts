import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: any };

export const prisma: any =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
