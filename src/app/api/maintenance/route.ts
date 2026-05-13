import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const roomId = searchParams.get('roomId')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (roomId) where.roomId = roomId

    const maintenanceRequests = await db.maintenanceRequest.findMany({
      where,
      include: {
        room: { include: { hostel: true } },
        student: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Flatten data
    const flatRequests = maintenanceRequests.map(r => ({
      ...r,
      room: r.room ? { id: r.room.id, number: r.room.number, hostel: r.room.hostel ? { name: r.room.hostel.name } : null } : null,
      student: r.student ? { id: r.student.id, name: r.student.user?.name || '', rollNo: r.student.rollNo } : null,
    }))

    return NextResponse.json({ maintenanceRequests: flatRequests })
  } catch (error) {
    console.error('Get maintenance requests error:', error)
    return NextResponse.json({ error: 'Failed to fetch maintenance requests' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { roomId, studentId, title, description, category, priority } = body

    if (!roomId || !studentId || !title || !description || !category) {
      return NextResponse.json({ error: 'Missing required fields: roomId, studentId, title, description, category' }, { status: 400 })
    }

    const maintenanceRequest = await db.maintenanceRequest.create({
      data: {
        roomId,
        studentId,
        title,
        description,
        category,
        priority: priority || 'Medium',
      },
      include: {
        room: { include: { hostel: true } },
        student: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    })

    return NextResponse.json({ maintenanceRequest }, { status: 201 })
  } catch (error) {
    console.error('Create maintenance request error:', error)
    return NextResponse.json({ error: 'Failed to create maintenance request' }, { status: 500 })
  }
}
