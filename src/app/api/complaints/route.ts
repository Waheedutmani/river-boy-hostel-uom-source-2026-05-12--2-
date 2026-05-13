import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const studentId = searchParams.get('studentId')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (category) where.category = category
    if (studentId) where.studentId = studentId

    const complaints = await db.complaint.findMany({
      where,
      include: {
        student: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Flatten student data
    const flatComplaints = complaints.map(c => ({
      ...c,
      student: c.student ? {
        id: c.student.id,
        name: c.student.user?.name || '',
        rollNo: c.student.rollNo,
        department: c.student.department,
      } : null,
    }))

    return NextResponse.json({ complaints: flatComplaints })
  } catch (error) {
    console.error('Get complaints error:', error)
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { studentId, title, description, category, priority } = body

    if (!studentId || !title || !description || !category) {
      return NextResponse.json({ error: 'Missing required fields: studentId, title, description, category' }, { status: 400 })
    }

    const complaint = await db.complaint.create({
      data: {
        studentId,
        title,
        description,
        category,
        priority: priority || 'Medium',
      },
      include: { student: { include: { user: { select: { id: true, name: true, email: true } } } } },
    })

    return NextResponse.json({ complaint }, { status: 201 })
  } catch (error) {
    console.error('Create complaint error:', error)
    return NextResponse.json({ error: 'Failed to create complaint' }, { status: 500 })
  }
}
