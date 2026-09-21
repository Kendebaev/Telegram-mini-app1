import { PrismaClient } from '@prisma/client';

// Helper to allow JSON.stringify to handle BigInt
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

export const prisma = new PrismaClient();
