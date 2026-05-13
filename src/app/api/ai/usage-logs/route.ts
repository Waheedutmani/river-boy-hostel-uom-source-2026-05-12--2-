import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET: Fetch AI usage logs and stats (admin only)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action') || 'overview'

    switch (action) {
      case 'overview': {
        // Get overall AI usage stats
        const today = new Date()
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

        const [totalUsers, activeToday, totalQueriesToday, disabledUsers, highUsageUsers] = await Promise.all([
          prisma.aiQueryLimit.count(),
          prisma.aiQueryLimit.count({ where: { lastResetDate: todayStr, queryCount: { gt: 0 } } }),
          prisma.aiQueryLog.count({ where: { createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()) } } }),
          prisma.aiQueryLimit.count({ where: { isDisabled: true } }),
          prisma.aiQueryLimit.count({ where: { queryCount: { gte: 12 }, lastResetDate: todayStr } }),
        ])

        // Get recent logs
        const recentLogs = await prisma.aiQueryLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 20,
        })

        // Get high usage users
        const highUsage = await prisma.aiQueryLimit.findMany({
          where: { queryCount: { gte: 10 }, lastResetDate: todayStr },
          include: { user: { select: { name: true, email: true, role: true } } },
          orderBy: { queryCount: 'desc' },
        })

        // Get all usage limits with user info
        const allUsers = await prisma.aiQueryLimit.findMany({
          include: { user: { select: { name: true, email: true, role: true } } },
          orderBy: { queryCount: 'desc' },
        })

        return NextResponse.json({
          stats: {
            totalUsers,
            activeToday,
            totalQueriesToday,
            disabledUsers,
            highUsageUsers,
          },
          recentLogs,
          highUsage: highUsage.map(u => ({
            id: u.id,
            userId: u.userId,
            userName: u.user?.name || 'Unknown',
            userEmail: u.user?.email || '',
            userRole: u.user?.role || 'student',
            queryCount: u.queryCount,
            isDisabled: u.isDisabled,
            lastResetDate: u.lastResetDate,
          })),
          allUsers: allUsers.map(u => ({
            id: u.id,
            userId: u.userId,
            userName: u.user?.name || 'Unknown',
            userEmail: u.user?.email || '',
            userRole: u.user?.role || 'student',
            queryCount: u.queryCount,
            isDisabled: u.isDisabled,
            disabledReason: u.disabledReason,
            lastResetDate: u.lastResetDate,
          })),
        })
      }

      case 'user_logs': {
        // Get logs for a specific user
        const userId = searchParams.get('userId')
        if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

        const logs = await prisma.aiQueryLog.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 50,
        })

        const limitInfo = await prisma.aiQueryLimit.findUnique({ where: { userId } })

        return NextResponse.json({ logs, limitInfo })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Usage Logs GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 })
  }
}
