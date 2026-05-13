import { PrismaClient } from '@prisma/client'

// Ensure fresh PrismaClient with all models including new ones
// The globalThis cache can hold stale models after schema changes
const globalForPrisma = globalThis as unknown as {
  __rbh_prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient()
}

// Check if cached client has all required models
const cachedClient = globalForPrisma.__rbh_prisma
const hasAllModels = cachedClient && typeof (cachedClient as Record<string, unknown>).feeStructure === 'object'

export const db = hasAllModels ? cachedClient! : createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__rbh_prisma = db
}
