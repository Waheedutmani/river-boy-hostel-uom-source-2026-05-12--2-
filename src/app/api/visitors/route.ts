import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// Helper to map visitor with student name from user relation
function mapVisitor(v: any) {
  return {
    ...v,
    student: v.student ? {
      id: v.student.id,
      name: v.student.user?.name || '',
      rollNo: v.student.rollNo,
      department: v.student.department,
      room: v.student.room || null,
    } : null,
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const status = searchParams.get('status')
    const roomId = searchParams.get('roomId')
    const search = searchParams.get('search')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const stats = searchParams.get('stats')

    // Return visitor stats
    if (stats === 'true') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const [
        totalToday,
        activeVisitors,
        pendingApprovals,
        totalAll,
      ] = await Promise.all([
        db.visitor.count({ where: { visitDate: { gte: today, lt: tomorrow } } }),
        db.visitor.count({ where: { status: 'Checked In' } }),
        db.visitor.count({ where: { status: 'Pending' } }),
        db.visitor.count(),
      ])

      // Status breakdown
      const statusBreakdown: Record<string, number> = {}
      const statuses = ['Pending', 'Approved', 'Rejected', 'Checked In', 'Checked Out']
      for (const s of statuses) {
        const count = await db.visitor.count({ where: { status: s } })
        if (count > 0) statusBreakdown[s] = count
      }

      // Recent visitors
      const rawVisitors = await db.visitor.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            include: {
              user: { select: { name: true } },
              room: { select: { number: true, hostel: { select: { name: true } } } },
            },
          },
          room: { select: { number: true, hostel: { select: { name: true } } } },
        },
      })

      const recentVisitors = rawVisitors.map(mapVisitor)

      return NextResponse.json({
        totalToday,
        activeVisitors,
        pendingApprovals,
        totalAll,
        statusBreakdown,
        recentVisitors,
      })
    }

    // Build where clause
    const where: Record<string, unknown> = {}

    if (studentId) where.studentId = studentId
    if (status) where.status = status
    if (roomId) where.roomId = roomId

    if (search) {
      where.OR = [
        { visitorName: { contains: search } },
        { cnic: { contains: search } },
        { contactNumber: { contains: search } },
        { visitPurpose: { contains: search } },
      ]
    }

    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lt = new Date(new Date(dateTo).getTime() + 86400000) // include end date
      where.visitDate = dateFilter
    }

    const rawVisitors = await db.visitor.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            room: { select: { number: true, hostel: { select: { name: true } } } },
          },
        },
        room: { select: { number: true, hostel: { select: { name: true } } } },
      },
    })

    const visitors = rawVisitors.map(mapVisitor)

    return NextResponse.json({ visitors })
  } catch (error) {
    console.error('Get visitors error:', error)
    return NextResponse.json({ error: 'Failed to fetch visitors' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      visitorName,
      cnic,
      contactNumber,
      relationWithStudent,
      studentId,
      roomId,
      visitPurpose,
      visitDate,
      entryTime,
    } = body

    if (!visitorName || !cnic || !contactNumber || !studentId || !visitPurpose || !visitDate) {
      return NextResponse.json(
        { error: 'Missing required fields: visitorName, cnic, contactNumber, studentId, visitPurpose, visitDate' },
        { status: 400 }
      )
    }

    const visitor = await db.visitor.create({
      data: {
        visitorName,
        cnic,
        contactNumber,
        relationWithStudent: relationWithStudent || 'Other',
        studentId,
        roomId: roomId || null,
        visitPurpose,
        visitDate: new Date(visitDate),
        entryTime: entryTime ? new Date(entryTime) : null,
        status: 'Pending',
      },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            room: { select: { number: true, hostel: { select: { name: true } } } },
          },
        },
        room: { select: { number: true, hostel: { select: { name: true } } } },
      },
    })

    const mappedVisitor = mapVisitor(visitor)

    // Create notification for admin about new visitor request
    const admins = await db.user.findMany({ where: { role: 'admin' } })
    for (const admin of admins) {
      await db.notification.create({
        data: {
          userId: admin.id,
          title: 'New Visitor Request',
          message: `${visitorName} wants to visit ${mappedVisitor.student?.name || 'a student'}`,
          type: 'info',
          category: 'Visitor Logs',
          priority: 'Normal',
        },
      })
    }

    // Create notification for the student
    const studentUser = await db.student.findUnique({ where: { id: studentId }, include: { user: true } })
    if (studentUser?.userId) {
      await db.notification.create({
        data: {
          userId: studentUser.userId,
          title: 'Visitor Request Submitted',
          message: `Your visitor request for ${visitorName} has been submitted and is pending approval.`,
          type: 'info',
          category: 'Visitor Logs',
          priority: 'Normal',
        },
      })
    }

    return NextResponse.json({ visitor: mappedVisitor }, { status: 201 })
  } catch (error) {
    console.error('Create visitor error:', error)
    return NextResponse.json({ error: 'Failed to create visitor' }, { status: 500 })
  }
}
