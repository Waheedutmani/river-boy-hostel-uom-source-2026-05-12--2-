import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

function flattenMovement(movement: any) {
  return {
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
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const movement = await db.studentMovement.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
            room: { include: { hostel: { select: { name: true } } } },
          },
        },
      },
    })

    if (!movement) {
      return NextResponse.json({ error: 'Movement record not found' }, { status: 404 })
    }

    const flatMovement = flattenMovement(movement)
    return NextResponse.json({ movement: flatMovement })
  } catch (error) {
    console.error('Get movement error:', error)
    return NextResponse.json({ error: 'Failed to fetch movement record' }, { status: 500 })
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
      status, adminRemark, approvedBy, actualReturnDate, returnSignature,
      reason, departureDate, expectedReturnDate, destination,
      guardianContact, notes, departureSignature,
    } = body

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (status !== undefined) updateData.status = status
    if (adminRemark !== undefined) updateData.adminRemark = adminRemark
    if (approvedBy !== undefined) updateData.approvedBy = approvedBy
    if (actualReturnDate !== undefined) updateData.actualReturnDate = new Date(actualReturnDate)
    if (returnSignature !== undefined) updateData.returnSignature = returnSignature
    if (reason !== undefined) updateData.reason = reason
    if (departureDate !== undefined) updateData.departureDate = new Date(departureDate)
    if (expectedReturnDate !== undefined) updateData.expectedReturnDate = new Date(expectedReturnDate)
    if (destination !== undefined) updateData.destination = destination
    if (guardianContact !== undefined) updateData.guardianContact = guardianContact
    if (notes !== undefined) updateData.notes = notes
    if (departureSignature !== undefined) updateData.departureSignature = departureSignature

    // Late return detection
    if (status === 'Returned') {
      const existing = await db.studentMovement.findUnique({ where: { id } })
      if (existing && existing.expectedReturnDate) {
        const returnDate = actualReturnDate ? new Date(actualReturnDate) : new Date()
        if (returnDate > new Date(existing.expectedReturnDate)) {
          updateData.status = 'Late Return'
        }
      }
    }

    const movement = await db.studentMovement.update({
      where: { id },
      data: updateData,
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
            room: { include: { hostel: { select: { name: true } } } },
          },
        },
      },
    })

    // Create notification for student based on action
    if (movement.student?.user?.id) {
      if (status === 'Approved') {
        await db.notification.create({
          data: {
            userId: movement.student.user.id,
            title: 'Leave Request Approved',
            message: `Your leave request (${reason || movement.reason}) has been approved. You may depart.`,
            type: 'success',
          },
        })
      } else if (status === 'Rejected') {
        await db.notification.create({
          data: {
            userId: movement.student.user.id,
            title: 'Leave Request Rejected',
            message: `Your leave request (${reason || movement.reason}) has been rejected. ${adminRemark || ''}`,
            type: 'error',
          },
        })
      } else if (status === 'Out') {
        await db.notification.create({
          data: {
            userId: movement.student.user.id,
            title: 'Departure Confirmed',
            message: `Your departure has been recorded. You are now marked as out of the hostel. Please return by ${new Date(movement.expectedReturnDate).toLocaleString()}.`,
            type: 'info',
          },
        })
      } else if (status === 'Returned' || status === 'Late Return') {
        await db.notification.create({
          data: {
            userId: movement.student.user.id,
            title: 'Return Confirmed',
            message: `Your return has been recorded. ${status === 'Late Return' ? 'Note: You returned after the expected time.' : ''}`,
            type: status === 'Late Return' ? 'warning' : 'success',
          },
        })
      }
    }

    const flatMovement = flattenMovement(movement)
    return NextResponse.json({ movement: flatMovement })
  } catch (error) {
    console.error('Update movement error:', error)
    return NextResponse.json({ error: 'Failed to update movement record' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.studentMovement.delete({ where: { id } })
    return NextResponse.json({ message: 'Movement record deleted successfully' })
  } catch (error) {
    console.error('Delete movement error:', error)
    return NextResponse.json({ error: 'Failed to delete movement record' }, { status: 500 })
  }
}
