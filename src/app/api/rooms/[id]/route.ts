import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const room = await db.room.findUnique({
      where: { id },
      include: {
        hostel: true,
        students: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
        maintenanceRequests: true,
      },
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    return NextResponse.json({ room })
  } catch (error) {
    console.error('Get room error:', error)
    return NextResponse.json({ error: 'Failed to fetch room' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { number, floor, capacity, hostelId, status } = body

    const room = await db.room.update({
      where: { id },
      data: { number, floor, capacity, hostelId, status },
      include: { hostel: true, students: true },
    })

    return NextResponse.json({ room })
  } catch (error) {
    console.error('Update room error:', error)
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.room.delete({ where: { id } })
    return NextResponse.json({ message: 'Room deleted successfully' })
  } catch (error) {
    console.error('Delete room error:', error)
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 })
  }
}
