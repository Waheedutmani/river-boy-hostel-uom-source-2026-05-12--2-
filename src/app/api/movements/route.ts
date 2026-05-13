import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const studentId = searchParams.get('studentId')
    const reason = searchParams.get('reason')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (studentId) where.studentId = studentId
    if (reason) where.reason = reason

    const movements = await db.studentMovement.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
            room: { include: { hostel: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Flatten student data for easier frontend consumption
    const flatMovements = movements.map(m => ({
      ...m,
      student: m.student ? {
        id: m.student.id,
        name: m.student.user?.name || '',
        email: m.student.user?.email || '',
        rollNo: m.student.rollNo,
        department: m.student.department,
        semester: m.student.semester,
        room: m.student.room ? {
          number: m.student.room.number,
          hostel: m.student.room.hostel?.name || '',
        } : null,
      } : null,
    }))

    // Calculate stats
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const returnedToday = flatMovements.filter(m =>
      m.status === 'Returned' && m.actualReturnDate && new Date(m.actualReturnDate) >= todayStart
    ).length
    const pendingApprovals = flatMovements.filter(m => m.status === 'Pending').length
    const lateReturns = flatMovements.filter(m => m.status === 'Late Return').length
    const totalRecords = flatMovements.length

    // Check for overdue movements (Out status and past expectedReturnDate)
    const overdueIds: string[] = []
    for (const m of flatMovements) {
      if (m.status === 'Out' && new Date(m.expectedReturnDate) < now) {
        overdueIds.push(m.id)
      }
    }

    // Auto-mark overdue movements as 'Late Return'
    if (overdueIds.length > 0) {
      await db.studentMovement.updateMany({
        where: { id: { in: overdueIds } },
        data: { status: 'Late Return' },
      })
      // Update the flat data to reflect changes
      for (const m of flatMovements) {
        if (overdueIds.includes(m.id)) {
          m.status = 'Late Return'
        }
      }
    }

    // Compute currentlyOutside AFTER the overdue update loop so the count is accurate
    const currentlyOutside = flatMovements.filter(m => m.status === 'Out').length

    return NextResponse.json({
      movements: flatMovements,
      stats: {
        currentlyOutside,
        returnedToday,
        pendingApprovals,
        lateReturns: lateReturns + overdueIds.length,
        totalRecords,
      },
    })
  } catch (error) {
    console.error('Get movements error:', error)
    return NextResponse.json({ error: 'Failed to fetch movements' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      studentId, reason, departureDate, expectedReturnDate,
      destination, guardianContact, notes, departureSignature,
    } = body

    if (!studentId || !reason || !departureDate || !expectedReturnDate) {
      return NextResponse.json(
        { error: 'Missing required fields: studentId, reason, departureDate, expectedReturnDate' },
        { status: 400 }
      )
    }

    // Validate that expectedReturnDate is after departureDate
    if (new Date(expectedReturnDate) <= new Date(departureDate)) {
      return NextResponse.json(
        { error: 'Expected return date must be after departure date' },
        { status: 400 }
      )
    }

    // Check if student already has an active movement (Pending/Out/Late Return)
    const activeMovement = await db.studentMovement.findFirst({
      where: {
        studentId,
        status: { in: ['Pending', 'Out', 'Late Return'] },
      },
    })

    if (activeMovement) {
      return NextResponse.json(
        { error: 'Student already has an active leave request. Please resolve it first.' },
        { status: 400 }
      )
    }

    const movement = await db.studentMovement.create({
      data: {
        studentId,
        reason,
        departureDate: new Date(departureDate),
        expectedReturnDate: new Date(expectedReturnDate),
        destination: destination || null,
        guardianContact: guardianContact || null,
        notes: notes || null,
        departureSignature: departureSignature || null,
        status: 'Pending',
      },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
            room: { include: { hostel: { select: { name: true } } } },
          },
        },
      },
    })

    // Create notification for admin
    const admins = await db.user.findMany({ where: { role: 'admin' } })
    for (const admin of admins) {
      await db.notification.create({
        data: {
          userId: admin.id,
          title: 'New Leave Request',
          message: `${movement.student?.user?.name || 'A student'} has submitted a leave request (${reason}).`,
          type: 'info',
        },
      })
    }

    // Flatten the response for consistency
    const flatMovement = {
      ...movement,
      student: movement.student ? {
        id: movement.student.id,
        name: movement.student.user?.name || '',
        email: movement.student.user?.email || '',
        rollNo: movement.student.rollNo,
        department: movement.student.department,
        semester: movement.student.semester,
        room: movement.student.room ? {
          number: movement.student.room.number,
          hostel: movement.student.room.hostel?.name || '',
        } : null,
      } : null,
    }

    return NextResponse.json({ movement: flatMovement }, { status: 201 })
  } catch (error) {
    console.error('Create movement error:', error)
    return NextResponse.json({ error: 'Failed to create movement record' }, { status: 500 })
  }
}
