import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const hostel = await db.hostel.findUnique({
      where: { id },
      include: {
        rooms: { include: { students: { include: { user: true } } } },
        staff: true,
        applications: { include: { student: { include: { user: true } } } },
      },
    })

    if (!hostel) {
      return NextResponse.json({ error: 'Hostel not found' }, { status: 404 })
    }

    const totalCapacity = hostel.rooms.reduce((sum, room) => sum + room.capacity, 0)
    const occupiedBeds = hostel.rooms.reduce((sum, room) => sum + room.students.length, 0)

    return NextResponse.json({
      hostel: {
        ...hostel,
        totalCapacity,
        occupiedBeds,
        availableBeds: totalCapacity - occupiedBeds,
        occupancyRate: totalCapacity > 0 ? Math.round((occupiedBeds / totalCapacity) * 100) : 0,
      },
    })
  } catch (error) {
    console.error('Get hostel error:', error)
    return NextResponse.json({ error: 'Failed to fetch hostel' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, type, totalRooms, address, description } = body

    const hostel = await db.hostel.update({
      where: { id },
      data: { name, type, totalRooms, address, description },
      include: { rooms: true, staff: true },
    })

    return NextResponse.json({ hostel })
  } catch (error) {
    console.error('Update hostel error:', error)
    return NextResponse.json({ error: 'Failed to update hostel' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.hostel.delete({ where: { id } })
    return NextResponse.json({ message: 'Hostel deleted successfully' })
  } catch (error) {
    console.error('Delete hostel error:', error)
    return NextResponse.json({ error: 'Failed to delete hostel' }, { status: 500 })
  }
}
