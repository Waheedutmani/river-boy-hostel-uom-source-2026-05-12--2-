import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')
    const targetRole = searchParams.get('targetRole')
    const category = searchParams.get('category')

    const where: Record<string, unknown> = {}

    if (isActive === 'true') where.isActive = true
    if (isActive === 'false') where.isActive = false
    if (targetRole) where.targetRole = targetRole
    if (category) where.category = category

    const announcements = await db.announcement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    const totalCount = await db.announcement.count({ where })

    return NextResponse.json({ announcements, totalCount })
  } catch (error) {
    console.error('Get announcements error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      title,
      content,
      category,
      priority,
      type,
      targetRole,
      isActive,
      scheduledAt,
      expiresAt,
      createdBy,
      createdById,
    } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content' },
        { status: 400 }
      )
    }

    // Create the announcement
    const announcement = await db.announcement.create({
      data: {
        title,
        content,
        category: category || 'General',
        priority: priority || 'Normal',
        type: type || 'Notice',
        targetRole: targetRole || 'all',
        isActive: isActive ?? true,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: createdBy || null,
        createdById: createdById || null,
      },
    })

    // Broadcast notification to matching users
    const roleFilter = targetRole && targetRole !== 'all' ? targetRole : undefined
    const users = await db.user.findMany({
      where: roleFilter ? { role: roleFilter } : {},
      select: { id: true },
    })

    if (users.length > 0) {
      const notificationType =
        priority === 'Emergency'
          ? 'error'
          : priority === 'Urgent'
            ? 'warning'
            : 'info'

      await db.notification.createMany({
        data: users.map((user) => ({
          userId: user.id,
          title,
          message: content,
          type: notificationType,
          category: category || 'Announcements',
          priority: priority || 'Normal',
          isBroadcast: true,
          senderName: createdBy || null,
        })),
      })
    }

    return NextResponse.json(
      {
        announcement,
        broadcastCount: users.length,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create announcement error:', error)
    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 }
    )
  }
}
