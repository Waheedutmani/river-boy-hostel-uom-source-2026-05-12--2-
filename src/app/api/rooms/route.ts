import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const hostelId = searchParams.get('hostelId')
    const floor = searchParams.get('floor')
    const status = searchParams.get('status')
    const detailed = searchParams.get('detailed') === 'true'

    const where: Record<string, any> = {}
    if (hostelId) where.hostelId = hostelId
    if (floor !== null && floor !== undefined) where.floor = parseInt(floor)
    if (status) where.status = status

    if (detailed) {
      // Enhanced query for room visualization - includes students with user data, fees, and movements
      const rooms = await db.room.findMany({
        where,
        include: {
          hostel: true,
          students: {
            include: {
              user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
              fees: { where: { status: { in: ['Pending', 'Overdue'] } }, take: 1, orderBy: { createdAt: 'desc' } },
              movements: { where: { status: { in: ['Out', 'Approved'] } }, take: 1, orderBy: { createdAt: 'desc' } },
            },
          },
          maintenanceRequests: { orderBy: { createdAt: 'desc' }, take: 5 },
          _count: { select: { students: true, maintenanceRequests: true } },
        },
        orderBy: [{ hostelId: 'asc' }, { floor: 'asc' }, { number: 'asc' }],
      })

      const flatRooms = rooms.map(r => {
        // Compute effective status: if room has students but status isn't "Occupied", treat as Occupied
        const studentCount = r.students.length
        let effectiveStatus = r.status
        if (r.status === 'Available' && studentCount > 0) {
          effectiveStatus = studentCount >= r.capacity ? 'Occupied' : 'Occupied'
        } else if (r.status === 'Occupied' && studentCount === 0) {
          effectiveStatus = 'Available'
        }
        return {
          ...r,
          status: effectiveStatus,
          hostel: r.hostel ? { id: r.hostel.id, name: r.hostel.name, type: r.hostel.type } : null,
        students: r.students.map(s => ({
          id: s.id,
          name: s.user.name,
          email: s.user.email,
          phone: s.user.phone,
          avatar: s.user.avatar,
          rollNo: s.rollNo,
          department: s.department,
          semester: s.semester,
          status: s.status,
          hasPendingFees: s.fees.length > 0,
          isOnLeave: s.movements.length > 0,
        })),
        maintenanceHistory: r.maintenanceRequests.map(m => ({
          id: m.id,
          title: m.title,
          category: m.category,
          status: m.status,
          priority: m.priority,
          createdAt: m.createdAt,
        })),
      }
      })

      // Get hostels with floor info (using computed effective statuses from flatRooms)
      const hostels = await db.hostel.findMany({
        include: {
          rooms: { select: { floor: true, capacity: true, hostelId: true, id: true } },
          _count: { select: { rooms: true } },
        },
      })

      const hostelsWithFloors = hostels.map(h => {
        const floors = [...new Set(h.rooms.map(r => r.floor))].sort((a, b) => a - b)
        const totalCapacity = h.rooms.reduce((s, r) => s + r.capacity, 0)
        // Use computed effective statuses from flatRooms
        const hostelRooms = flatRooms.filter(r => r.hostelId === h.id)
        const availableRooms = hostelRooms.filter(r => r.status === 'Available').length
        const occupiedRooms = hostelRooms.filter(r => r.status === 'Occupied').length
        const maintenanceRooms = hostelRooms.filter(r => r.status === 'Maintenance').length
        return {
          id: h.id,
          name: h.name,
          type: h.type,
          totalRooms: h._count.rooms,
          totalCapacity,
          availableRooms,
          occupiedRooms,
          maintenanceRooms,
          floors,
        }
      })

      // Get unassigned students for allocation
      const unassignedStudents = await db.student.findMany({
        where: { roomId: null, status: 'Active' },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { rollNo: 'asc' },
      })

      return NextResponse.json({
        rooms: flatRooms,
        hostels: hostelsWithFloors,
        unassignedStudents: unassignedStudents.map(s => ({
          id: s.id,
          name: s.user.name,
          email: s.user.email,
          rollNo: s.rollNo,
          department: s.department,
          semester: s.semester,
        })),
      })
    }

    // Standard query (existing behavior)
    const rooms = await db.room.findMany({
      where,
      include: {
        hostel: true,
        _count: { select: { students: true, maintenanceRequests: true } },
      },
      orderBy: [{ hostelId: 'asc' }, { floor: 'asc' }, { number: 'asc' }],
    })

    const flatRooms = rooms.map(r => ({
      ...r,
      hostel: r.hostel ? { name: r.hostel.name, type: r.hostel.type } : null,
    }))

    return NextResponse.json({ rooms: flatRooms })
  } catch (error) {
    console.error('Get rooms error:', error)
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { number, floor, capacity, hostelId, status } = body

    if (!number || floor === undefined || !capacity || !hostelId) {
      return NextResponse.json({ error: 'Missing required fields: number, floor, capacity, hostelId' }, { status: 400 })
    }

    const room = await db.room.create({
      data: {
        number,
        floor,
        capacity,
        hostelId,
        status: status || 'Available',
      },
      include: { hostel: true, students: true },
    })

    return NextResponse.json({ room }, { status: 201 })
  } catch (error) {
    console.error('Create room error:', error)
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}
