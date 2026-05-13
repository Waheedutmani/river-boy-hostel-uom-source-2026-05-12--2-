import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const complaint = await db.complaint.findUnique({
      where: { id },
      include: {
        student: { include: { user: true, room: { include: { hostel: true } } } },
      },
    })

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    return NextResponse.json({ complaint })
  } catch (error) {
    console.error('Get complaint error:', error)
    return NextResponse.json({ error: 'Failed to fetch complaint' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, adminReply, title, description, category, priority } = body

    const complaint = await db.complaint.update({
      where: { id },
      data: { status, adminReply, title, description, category, priority },
      include: { student: { include: { user: { select: { id: true, name: true, email: true } } } } },
    })

    return NextResponse.json({ complaint })
  } catch (error) {
    console.error('Update complaint error:', error)
    return NextResponse.json({ error: 'Failed to update complaint' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.complaint.delete({ where: { id } })
    return NextResponse.json({ message: 'Complaint deleted successfully' })
  } catch (error) {
    console.error('Delete complaint error:', error)
    return NextResponse.json({ error: 'Failed to delete complaint' }, { status: 500 })
  }
}
