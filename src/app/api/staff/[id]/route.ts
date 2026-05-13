import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const staff = await db.staff.findUnique({
      where: { id },
      include: { hostel: true },
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    return NextResponse.json({ staff })
  } catch (error) {
    console.error('Get staff error:', error)
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, role, phone, hostelId, salary, joinDate, status } = body

    const staff = await db.staff.update({
      where: { id },
      data: {
        name,
        role,
        phone,
        hostelId,
        salary,
        joinDate: joinDate ? new Date(joinDate) : undefined,
        status,
      },
      include: { hostel: true },
    })

    return NextResponse.json({ staff })
  } catch (error) {
    console.error('Update staff error:', error)
    return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.staff.delete({ where: { id } })
    return NextResponse.json({ message: 'Staff deleted successfully' })
  } catch (error) {
    console.error('Delete staff error:', error)
    return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 })
  }
}
