import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const student = await db.student.findUnique({
      where: { id },
      include: {
        user: true,
        room: { include: { hostel: true } },
        fees: { orderBy: { createdAt: 'desc' } },
        complaints: { orderBy: { createdAt: 'desc' } },
        applications: { include: { hostel: true }, orderBy: { createdAt: 'desc' } },
      },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    return NextResponse.json({ student })
  } catch (error) {
    console.error('Get student error:', error)
    return NextResponse.json({ error: 'Failed to fetch student' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      department, semester, roomId, guardianName, guardianPhone,
      address, bloodGroup, emergencyContact, status,
      name, phone,
    } = body

    const student = await db.student.update({
      where: { id },
      data: {
        department,
        semester,
        roomId,
        guardianName,
        guardianPhone,
        address,
        bloodGroup,
        emergencyContact,
        status,
      },
      include: { user: true, room: { include: { hostel: true } } },
    })

    if (name || phone) {
      await db.user.update({
        where: { id: student.userId },
        data: { name, phone },
      })
    }

    const updatedStudent = await db.student.findUnique({
      where: { id },
      include: { user: true, room: { include: { hostel: true } } },
    })

    return NextResponse.json({ student: updatedStudent })
  } catch (error) {
    console.error('Update student error:', error)
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const student = await db.student.findUnique({ where: { id } })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    await db.student.delete({ where: { id } })
    await db.user.delete({ where: { id: student.userId } })

    return NextResponse.json({ message: 'Student deleted successfully' })
  } catch (error) {
    console.error('Delete student error:', error)
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 })
  }
}
