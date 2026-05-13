import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Check if announcement exists
    const existing = await db.announcement.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }

    const data: Record<string, unknown> = {}
    if (title !== undefined) data.title = title
    if (content !== undefined) data.content = content
    if (category !== undefined) data.category = category
    if (priority !== undefined) data.priority = priority
    if (type !== undefined) data.type = type
    if (targetRole !== undefined) data.targetRole = targetRole
    if (isActive !== undefined) data.isActive = isActive
    if (scheduledAt !== undefined) data.scheduledAt = scheduledAt ? new Date(scheduledAt) : null
    if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null
    if (createdBy !== undefined) data.createdBy = createdBy
    if (createdById !== undefined) data.createdById = createdById

    const announcement = await db.announcement.update({
      where: { id },
      data,
    })

    return NextResponse.json({ announcement })
  } catch (error) {
    console.error('Update announcement error:', error)
    return NextResponse.json(
      { error: 'Failed to update announcement' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if announcement exists
    const existing = await db.announcement.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }

    await db.announcement.delete({ where: { id } })

    return NextResponse.json({ message: 'Announcement deleted successfully' })
  } catch (error) {
    console.error('Delete announcement error:', error)
    return NextResponse.json(
      { error: 'Failed to delete announcement' },
      { status: 500 }
    )
  }
}
