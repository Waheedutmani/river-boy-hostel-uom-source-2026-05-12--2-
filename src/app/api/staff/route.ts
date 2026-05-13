import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const hostelId = searchParams.get('hostelId')
    const role = searchParams.get('role')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (hostelId) where.hostelId = hostelId
    if (role) where.role = role
    if (status) where.status = status

    const staff = await db.staff.findMany({
      where,
      include: { hostel: true },
      orderBy: { createdAt: 'desc' },
    })

    // Flatten hostel data
    const flatStaff = staff.map(s => ({
      ...s,
      hostel: s.hostel ? { id: s.hostel.id, name: s.hostel.name } : null,
    }))

    return NextResponse.json({ staff: flatStaff })
  } catch (error) {
    console.error('Get staff error:', error)
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, role, phone, hostelId, salary, joinDate, status } = body

    if (!name || !role || !phone || !hostelId) {
      return NextResponse.json({ error: 'Missing required fields: name, role, phone, hostelId' }, { status: 400 })
    }

    const staff = await db.staff.create({
      data: {
        name,
        role,
        phone,
        hostelId,
        salary,
        joinDate: joinDate ? new Date(joinDate) : null,
        status: status || 'Active',
      },
      include: { hostel: true },
    })

    return NextResponse.json({ staff }, { status: 201 })
  } catch (error) {
    console.error('Create staff error:', error)
    return NextResponse.json({ error: 'Failed to create staff' }, { status: 500 })
  }
}
