import { PrismaClient } from '@prisma/client';

// Helper to allow JSON.stringify to handle BigInt
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

// Global singleton pattern to prevent connection pool exhaustion in serverless environments
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

globalForPrisma.prisma = prisma;
