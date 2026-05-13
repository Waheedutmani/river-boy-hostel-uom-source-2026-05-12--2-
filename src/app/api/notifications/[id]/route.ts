import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { read, title, message, type, category, priority, actionUrl, isBroadcast, senderName } = body

    // Check if notification exists
    const existing = await db.notification.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (read !== undefined) data.read = read
    if (title !== undefined) data.title = title
    if (message !== undefined) data.message = message
    if (type !== undefined) data.type = type
    if (category !== undefined) data.category = category
    if (priority !== undefined) data.priority = priority
    if (actionUrl !== undefined) data.actionUrl = actionUrl
    if (isBroadcast !== undefined) data.isBroadcast = isBroadcast
    if (senderName !== undefined) data.senderName = senderName

    const notification = await db.notification.update({
      where: { id },
      data,
    })

    return NextResponse.json({ notification })
  } catch (error) {
    console.error('Update notification error:', error)
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if notification exists
    const existing = await db.notification.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    await db.notification.delete({ where: { id } })

    return NextResponse.json({ message: 'Notification deleted successfully' })
  } catch (error) {
    console.error('Delete notification error:', error)
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
  }
}
