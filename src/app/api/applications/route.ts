import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const applications = await db.application.findMany({
      where,
      include: {
        student: { include: { user: { select: { id: true, name: true, email: true } } } },
        hostel: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Flatten student data
    const flatApps = applications.map(app => ({
      ...app,
      student: app.student ? {
        id: app.student.id,
        name: app.student.user?.name || '',
        rollNo: app.student.rollNo,
        department: app.student.department,
      } : null,
      hostel: app.hostel ? { id: app.hostel.id, name: app.hostel.name } : null,
    }))

    return NextResponse.json({ applications: flatApps })
  } catch (error) {
    console.error('Get applications error:', error)
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { studentId, hostelId, preferredRoom, message } = body

    if (!studentId || !hostelId) {
      return NextResponse.json({ error: 'Missing required fields: studentId, hostelId' }, { status: 400 })
    }

    const application = await db.application.create({
      data: {
        studentId,
        hostelId,
        preferredRoom,
        message,
      },
      include: {
        student: { include: { user: { select: { id: true, name: true, email: true } } } },
        hostel: true,
      },
    })

    const flatApp = {
      ...application,
      student: application.student ? {
        id: application.student.id,
        name: application.student.user?.name || '',
        rollNo: application.student.rollNo,
        department: application.student.department,
      } : null,
      hostel: application.hostel ? { id: application.hostel.id, name: application.hostel.name } : null,
    }

    return NextResponse.json({ application: flatApp }, { status: 201 })
  } catch (error) {
    console.error('Create application error:', error)
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 })
  }
}
