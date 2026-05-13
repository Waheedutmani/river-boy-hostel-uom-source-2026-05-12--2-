import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      password,
      role = 'student',
      phone,
      rollNo,
      department,
      semester,
      guardianName,
      guardianPhone,
      address,
      bloodGroup,
      emergencyContact,
    } = body

    if (!name || !email || !password || !rollNo || !department || !semester) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, password, rollNo, department, semester' },
        { status: 400 }
      )
    }

    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const existingStudent = await db.student.findUnique({ where: { rollNo } })
    if (existingStudent) {
      return NextResponse.json({ error: 'Roll number already exists' }, { status: 409 })
    }

    const hashedPassword = Buffer.from(password).toString('base64')

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        phone,
        student: role === 'student' ? {
          create: {
            rollNo,
            department,
            semester,
            guardianName,
            guardianPhone,
            address,
            bloodGroup,
            emergencyContact,
          },
        } : undefined,
      },
      include: { student: true },
    })

    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, student: user.student } }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Failed to register user' }, { status: 500 })
  }
}
