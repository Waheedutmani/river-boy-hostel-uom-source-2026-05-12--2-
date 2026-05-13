import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const category = searchParams.get('category')
    const priority = searchParams.get('priority')
    const unread = searchParams.get('unread')
    const search = searchParams.get('search')
    const isBroadcast = searchParams.get('isBroadcast')
    const limitParam = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')
    const analytics = searchParams.get('analytics')

    const where: Record<string, unknown> = {}

    if (userId) where.userId = userId
    if (category) where.category = category
    if (priority) where.priority = priority
    if (unread === 'true') where.read = false
    if (unread === 'false') where.read = true
    if (isBroadcast === 'true') where.isBroadcast = true
    if (isBroadcast === 'false') where.isBroadcast = false

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { message: { contains: search } },
        { senderName: { contains: search } },
      ]
    }

    const limit = limitParam ? parseInt(limitParam, 10) : undefined
    const offset = offsetParam ? parseInt(offsetParam, 10) : undefined

    const [notifications, totalCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...(limit && { take: limit }),
        ...(offset && { skip: offset }),
      }),
      db.notification.count({ where }),
    ])

    // Always compute unreadCount when userId is provided
    let unreadCount = 0
    if (userId) {
      unreadCount = await db.notification.count({ where: { userId, read: false } })
    }

    // Compute analytics when requested
    let analyticsData = undefined
    if (analytics === 'true' && userId) {
      const total = await db.notification.count({ where: { userId } })
      const readCount = await db.notification.count({ where: { userId, read: true } })
      const unreadCount = await db.notification.count({ where: { userId, read: false } })

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
        const count = await db.notification.count({ where: { userId, category: cat } })
        if (count > 0) categoryBreakdown[cat] = count
      }

      // Priority breakdown
      const priorityBreakdown: Record<string, number> = {}
      const priorities = ['Normal', 'Important', 'Critical', 'Emergency']
      for (const pri of priorities) {
        const count = await db.notification.count({ where: { userId, priority: pri } })
        if (count > 0) priorityBreakdown[pri] = count
      }

      // Recent notifications (last 24 hours)
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)
      const recentCount = await db.notification.count({
        where: { userId, createdAt: { gte: oneDayAgo } },
      })

      analyticsData = {
        total,
        readCount,
        unreadCount,
        readRate: total > 0 ? Math.round((readCount / total) * 100) : 0,
        categoryBreakdown,
        priorityBreakdown,
        recentCount,
      }
    }

    return NextResponse.json({
      notifications,
      totalCount,
      unreadCount,
      ...(analyticsData && { analytics: analyticsData }),
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      userId,
      title,
      message,
      type,
      category,
      priority,
      actionUrl,
      isBroadcast,
      senderName,
    } = body

    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, message' },
        { status: 400 }
      )
    }

    const notification = await db.notification.create({
      data: {
        userId,
        title,
        message,
        type: type || 'info',
        category: category || 'General',
        priority: priority || 'Normal',
        actionUrl: actionUrl || null,
        isBroadcast: isBroadcast ?? false,
        senderName: senderName || null,
      },
    })

    return NextResponse.json({ notification }, { status: 201 })
  } catch (error) {
    console.error('Create notification error:', error)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}
