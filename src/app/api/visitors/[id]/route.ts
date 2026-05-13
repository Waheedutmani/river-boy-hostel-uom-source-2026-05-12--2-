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

const visitorInclude = {
  student: {
    include: {
      user: { select: { name: true } },
      room: { select: { number: true, hostel: { select: { name: true } } } },
    },
  },
  room: { select: { number: true, hostel: { select: { name: true } } } },
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, approvedBy, adminRemark, entryTime, exitTime, visitorName, cnic, contactNumber, relationWithStudent, visitPurpose, visitDate, roomId } = body

    // Check if visitor exists
    const existing = await db.visitor.findUnique({
      where: { id },
      include: { student: { include: { user: { select: { name: true, id: true } } } } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}

    // Handle status updates
    if (status !== undefined) {
      data.status = status

      // When approving
      if (status === 'Approved' && approvedBy) {
        data.approvedBy = approvedBy
      }

      // When checking in - record entry time
      if (status === 'Checked In') {
        data.entryTime = entryTime ? new Date(entryTime) : new Date()
      }

      // When checking out - record exit time
      if (status === 'Checked Out') {
        data.exitTime = exitTime ? new Date(exitTime) : new Date()
      }

      // Create notification for student about status change
      if (existing.student?.userId) {
        const statusMessages: Record<string, { title: string; message: string; type: string }> = {
          'Approved': { title: 'Visitor Approved', message: `Your visitor ${existing.visitorName} has been approved.`, type: 'success' },
          'Rejected': { title: 'Visitor Rejected', message: `Your visitor ${existing.visitorName} has been rejected.${adminRemark ? ' Reason: ' + adminRemark : ''}`, type: 'warning' },
          'Checked In': { title: 'Visitor Checked In', message: `${existing.visitorName} has checked in to the hostel.`, type: 'info' },
          'Checked Out': { title: 'Visitor Checked Out', message: `${existing.visitorName} has checked out from the hostel.`, type: 'info' },
        }
        const notif = statusMessages[status]
        if (notif) {
          await db.notification.create({
            data: {
              userId: existing.student.userId,
              title: notif.title,
              message: notif.message,
              type: notif.type,
              category: 'Visitor Logs',
              priority: 'Normal',
            },
          })
        }
      }
    }

    if (adminRemark !== undefined) data.adminRemark = adminRemark
    if (visitorName !== undefined) data.visitorName = visitorName
    if (cnic !== undefined) data.cnic = cnic
    if (contactNumber !== undefined) data.contactNumber = contactNumber
    if (relationWithStudent !== undefined) data.relationWithStudent = relationWithStudent
    if (visitPurpose !== undefined) data.visitPurpose = visitPurpose
    if (visitDate !== undefined) data.visitDate = new Date(visitDate)
    if (roomId !== undefined) data.roomId = roomId
    if (entryTime !== undefined && status !== 'Checked In') data.entryTime = entryTime ? new Date(entryTime) : null
    if (exitTime !== undefined && status !== 'Checked Out') data.exitTime = exitTime ? new Date(exitTime) : null

    const visitor = await db.visitor.update({
      where: { id },
      data,
      include: visitorInclude,
    })

    return NextResponse.json({ visitor: mapVisitor(visitor) })
  } catch (error) {
    console.error('Update visitor error:', error)
    return NextResponse.json({ error: 'Failed to update visitor' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.visitor.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 })
    }

    await db.visitor.delete({ where: { id } })

    return NextResponse.json({ message: 'Visitor record deleted successfully' })
  } catch (error) {
    console.error('Delete visitor error:', error)
    return NextResponse.json({ error: 'Failed to delete visitor' }, { status: 500 })
  }
}
