import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, message, type, category, priority, actionUrl, senderName, targetRole } = body

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: title, message' },
        { status: 400 }
      )
    }

    // Determine which users to broadcast to
    const roleFilter = targetRole && targetRole !== 'all' ? targetRole : undefined
    const users = await db.user.findMany({
      where: roleFilter ? { role: roleFilter } : {},
      select: { id: true },
    })

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'No users found matching the target criteria' },
        { status: 404 }
      )
    }

    const notificationType =
      priority === 'Emergency'
        ? 'error'
        : priority === 'Critical'
          ? 'warning'
          : type || 'info'

    await db.notification.createMany({
      data: users.map((user) => ({
        userId: user.id,
        title,
        message,
        type: notificationType,
        category: category || 'General',
        priority: priority || 'Normal',
        actionUrl: actionUrl || null,
        isBroadcast: true,
        senderName: senderName || null,
      })),
    })

    return NextResponse.json(
      {
        message: 'Broadcast notification sent successfully',
        recipientCount: users.length,
        targetRole: targetRole || 'all',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Broadcast notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send broadcast notification' },
      { status: 500 }
    )
  }
}
