import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const where: Record<string, unknown> = {}
    if (userId) where.userId = userId

    // Total notifications
    const totalSent = await db.notification.count({ where })

    // Read/unread stats
    const readCount = await db.notification.count({
      where: { ...where, read: true },
    })
    const unreadCount = await db.notification.count({
      where: { ...where, read: false },
    })

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {}
    const categories = [
      'Payments',
      'Complaints',
      'Leave Requests',
      'Emergency Alerts',
      'Maintenance',
      'Visitor Logs',
      'Announcements',
      'Room Management',
      'General',
    ]
    for (const cat of categories) {
      const count = await db.notification.count({
        where: { ...where, category: cat },
      })
      if (count > 0) categoryBreakdown[cat] = count
    }

    // Priority breakdown
    const priorityBreakdown: Record<string, number> = {}
    const priorities = ['Normal', 'Important', 'Critical', 'Emergency']
    for (const pri of priorities) {
      const count = await db.notification.count({
        where: { ...where, priority: pri },
      })
      if (count > 0) priorityBreakdown[pri] = count
    }

    // Emergency count
    const emergencyCount = await db.notification.count({
      where: { ...where, priority: 'Emergency' },
    })

    // Broadcast count
    const broadcastCount = await db.notification.count({
      where: { ...where, isBroadcast: true },
    })

    // Daily trend for last 7 days
    const dailyTrend: Array<{ date: string; count: number; readCount: number }> = []
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date()
      dayStart.setDate(dayStart.getDate() - i)
      dayStart.setHours(0, 0, 0, 0)

      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)

      const [dayCount, dayReadCount] = await Promise.all([
        db.notification.count({
          where: { ...where, createdAt: { gte: dayStart, lt: dayEnd } },
        }),
        db.notification.count({
          where: { ...where, read: true, createdAt: { gte: dayStart, lt: dayEnd } },
        }),
      ])

      dailyTrend.push({
        date: dayStart.toISOString().split('T')[0],
        count: dayCount,
        readCount: dayReadCount,
      })
    }

    const analytics = {
      totalSent,
      readCount,
      unreadCount,
      readRate: totalSent > 0 ? Math.round((readCount / totalSent) * 100) : 0,
      categoryBreakdown,
      priorityBreakdown,
      emergencyCount,
      broadcastCount,
      dailyTrend,
    }

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error('Get notification analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification analytics' },
      { status: 500 }
    )
  }
}
