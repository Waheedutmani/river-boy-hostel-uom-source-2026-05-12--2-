import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const hostels = await db.hostel.findMany({
      include: {
        rooms: {
          include: {
            _count: { select: { students: true } },
          },
        },
        staff: true,
        _count: { select: { rooms: true, staff: true, applications: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const hostelsWithData = hostels.map((hostel) => {
      const totalCapacity = hostel.rooms.reduce((sum, room) => sum + room.capacity, 0)
      const totalOccupancy = hostel.rooms.reduce((sum, room) => sum + (room._count?.students || 0), 0)
      const availableBeds = totalCapacity - totalOccupancy
      return {
        ...hostel,
        roomCount: hostel._count.rooms,
        staffCount: hostel._count.staff,
        totalCapacity,
        totalOccupancy,
        availableBeds,
        occupancyRate: totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0,
        rooms: hostel.rooms.map(r => ({
          ...r,
          _count: { students: r._count?.students || 0, maintenanceRequests: 0 },
          hostel: { name: hostel.name, type: hostel.type },
        })),
      }
    })

    return NextResponse.json({ hostels: hostelsWithData })
  } catch (error) {
    console.error('Get hostels error:', error)
    return NextResponse.json({ error: 'Failed to fetch hostels' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, type, totalRooms, address, description } = body

    if (!name || !type || !totalRooms) {
      return NextResponse.json({ error: 'Missing required fields: name, type, totalRooms' }, { status: 400 })
    }

    const hostel = await db.hostel.create({
      data: { name, type, totalRooms, address, description },
      include: { rooms: true, staff: true },
    })

    return NextResponse.json({ hostel }, { status: 201 })
  } catch (error) {
    console.error('Create hostel error:', error)
    return NextResponse.json({ error: 'Failed to create hostel' }, { status: 500 })
  }
}
