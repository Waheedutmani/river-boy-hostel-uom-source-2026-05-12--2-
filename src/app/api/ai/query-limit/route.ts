import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DAILY_LIMIT = 15

// Helper: get today's date as YYYY-MM-DD
function getTodayDate(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

// Helper: calculate time until next midnight (reset time)
function getTimeUntilReset(): { hours: number; minutes: number; totalMinutes: number } {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  const diffMs = tomorrow.getTime() - now.getTime()
  const totalMinutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return { hours, minutes, totalMinutes }
}

// GET: Check query limit status for a user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const today = getTodayDate()

    // Find or create the query limit record
    let queryLimit = await prisma.aiQueryLimit.findUnique({
      where: { userId }
    })

    if (!queryLimit) {
      // Create new record
      queryLimit = await prisma.aiQueryLimit.create({
        data: {
          userId,
          queryCount: 0,
          lastResetDate: today,
          isDisabled: false,
        }
      })
    }

    // Check if we need to reset (new day)
    if (queryLimit.lastResetDate !== today) {
      queryLimit = await prisma.aiQueryLimit.update({
        where: { userId },
        data: {
          queryCount: 0,
          lastResetDate: today,
        }
      })
    }

    const remaining = Math.max(0, DAILY_LIMIT - queryLimit.queryCount)
    const isLimitReached = queryLimit.queryCount >= DAILY_LIMIT
    const timeUntilReset = getTimeUntilReset()

    return NextResponse.json({
      userId,
      queryCount: queryLimit.queryCount,
      dailyLimit: DAILY_LIMIT,
      remaining,
      isLimitReached,
      isDisabled: queryLimit.isDisabled,
      disabledReason: queryLimit.disabledReason,
      lastResetDate: queryLimit.lastResetDate,
      timeUntilReset,
      usagePercentage: Math.round((queryLimit.queryCount / DAILY_LIMIT) * 100),
    })
  } catch (error: any) {
    console.error('Query Limit GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch query limit' }, { status: 500 })
  }
}

// POST: Increment query count (called when a query is made)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, userName, userRole, query, intent, mode, responseTime } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const today = getTodayDate()

    // Find or create the query limit record
    let queryLimit = await prisma.aiQueryLimit.findUnique({
      where: { userId }
    })

    if (!queryLimit) {
      queryLimit = await prisma.aiQueryLimit.create({
        data: {
          userId,
          queryCount: 0,
          lastResetDate: today,
          isDisabled: false,
        }
      })
    }

    // Check if we need to reset (new day)
    if (queryLimit.lastResetDate !== today) {
      queryLimit = await prisma.aiQueryLimit.update({
        where: { userId },
        data: {
          queryCount: 0,
          lastResetDate: today,
        }
      })
    }

    // Check if AI is disabled for this user
    if (queryLimit.isDisabled) {
      return NextResponse.json({
        allowed: false,
        reason: 'disabled',
        message: 'Your AI access has been disabled by the administrator. Please contact the warden.',
        queryCount: queryLimit.queryCount,
        dailyLimit: DAILY_LIMIT,
        remaining: 0,
      })
    }

    // Check if limit is reached
    if (queryLimit.queryCount >= DAILY_LIMIT) {
      const timeUntilReset = getTimeUntilReset()
      return NextResponse.json({
        allowed: false,
        reason: 'limit_reached',
        message: `You have reached your daily limit of ${DAILY_LIMIT} AI queries. Please try again tomorrow after reset.`,
        queryCount: queryLimit.queryCount,
        dailyLimit: DAILY_LIMIT,
        remaining: 0,
        timeUntilReset,
      })
    }

    // Increment the counter
    queryLimit = await prisma.aiQueryLimit.update({
      where: { userId },
      data: {
        queryCount: { increment: 1 },
      }
    })

    // Log the query
    if (query) {
      await prisma.aiQueryLog.create({
        data: {
          userId,
          userName: userName || 'Unknown',
          userRole: userRole || 'student',
          query: query.substring(0, 500),
          intent: intent || null,
          mode: mode || null,
          responseTime: responseTime || null,
        }
      })
    }

    const remaining = Math.max(0, DAILY_LIMIT - queryLimit.queryCount)

    return NextResponse.json({
      allowed: true,
      queryCount: queryLimit.queryCount,
      dailyLimit: DAILY_LIMIT,
      remaining,
      usagePercentage: Math.round((queryLimit.queryCount / DAILY_LIMIT) * 100),
    })
  } catch (error: any) {
    console.error('Query Limit POST Error:', error)
    return NextResponse.json({ error: 'Failed to update query limit' }, { status: 500 })
  }
}

// PUT: Admin actions (reset limit, disable/enable AI access)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, userId, adminUserId, reason } = body

    if (!action || !userId) {
      return NextResponse.json({ error: 'action and userId are required' }, { status: 400 })
    }

    const today = getTodayDate()

    switch (action) {
      case 'reset': {
        // Reset a specific user's limit
        const updated = await prisma.aiQueryLimit.upsert({
          where: { userId },
          update: {
            queryCount: 0,
            lastResetDate: today,
          },
          create: {
            userId,
            queryCount: 0,
            lastResetDate: today,
            isDisabled: false,
          }
        })
        return NextResponse.json({ success: true, message: 'Query limit reset successfully', data: updated })
      }

      case 'disable': {
        // Disable AI access for a user
        const updated = await prisma.aiQueryLimit.upsert({
          where: { userId },
          update: {
            isDisabled: true,
            disabledBy: adminUserId || null,
            disabledReason: reason || 'Disabled by admin',
          },
          create: {
            userId,
            queryCount: 0,
            lastResetDate: today,
            isDisabled: true,
            disabledBy: adminUserId || null,
            disabledReason: reason || 'Disabled by admin',
          }
        })
        return NextResponse.json({ success: true, message: 'AI access disabled for user', data: updated })
      }

      case 'enable': {
        // Enable AI access for a user
        const updated = await prisma.aiQueryLimit.upsert({
          where: { userId },
          update: {
            isDisabled: false,
            disabledBy: null,
            disabledReason: null,
          },
          create: {
            userId,
            queryCount: 0,
            lastResetDate: today,
            isDisabled: false,
          }
        })
        return NextResponse.json({ success: true, message: 'AI access enabled for user', data: updated })
      }

      case 'reset_all': {
        // Reset ALL users' limits (admin bulk action)
        const result = await prisma.aiQueryLimit.updateMany({
          data: {
            queryCount: 0,
            lastResetDate: today,
          }
        })
        return NextResponse.json({ success: true, message: `Reset ${result.count} users' limits`, count: result.count })
      }

      default:
        return NextResponse.json({ error: 'Invalid action. Use: reset, disable, enable, reset_all' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Query Limit PUT Error:', error)
    return NextResponse.json({ error: 'Failed to perform admin action' }, { status: 500 })
  }
}
