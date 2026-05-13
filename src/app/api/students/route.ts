import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const department = searchParams.get('department')
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')

    const where: Record<string, unknown> = {}
    if (department) where.department = department
    if (status) where.status = status
    if (userId) where.userId = userId

    const students = await db.student.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        room: { include: { hostel: true } },
        _count: { select: { fees: true, complaints: true, applications: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ students })
  } catch (error) {
    console.error('Get students error:', error)
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name, email, password, phone,
      rollNo, department, semester,
      guardianName, guardianPhone, address, bloodGroup, emergencyContact,
      roomId,
    } = body

    if (!name || !email || !password || !rollNo || !department || !semester) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const hashedPassword = Buffer.from(password).toString('base64')

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'student',
        phone,
        student: {
          create: {
            rollNo,
            department,
            semester,
            guardianName,
            guardianPhone,
            address,
            bloodGroup,
            emergencyContact,
            roomId,
          },
        },
      },
      include: { student: { include: { room: { include: { hostel: true } } } } },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('Create student error:', error)
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 })
  }
}
