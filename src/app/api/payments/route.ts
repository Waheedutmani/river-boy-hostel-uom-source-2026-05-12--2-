import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const paymentMethod = searchParams.get('paymentMethod')
    const feeId = searchParams.get('feeId')
    const studentId = searchParams.get('studentId')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (paymentMethod) where.paymentMethod = paymentMethod
    if (feeId) where.feeId = feeId
    if (studentId) where.fee = { studentId }

    const payments = await db.payment.findMany({
      where,
      include: {
        fee: {
          include: {
            student: {
              include: {
                user: { select: { id: true, name: true, email: true } },
                room: { include: { hostel: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const flatPayments = payments.map(p => ({
      ...p,
      fee: p.fee ? {
        ...p.fee,
        student: p.fee.student ? {
          id: p.fee.student.id,
          name: p.fee.student.user?.name || '',
          rollNo: p.fee.student.rollNo,
          department: p.fee.student.department,
          room: p.fee.student.room ? {
            number: p.fee.student.room.number,
            hostel: p.fee.student.room.hostel ? { name: p.fee.student.room.hostel.name } : null,
          } : null,
        } : null,
      } : null,
    }))

    return NextResponse.json({ payments: flatPayments })
  } catch (error) {
    console.error('Get payments error:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { feeId, amount, paymentMethod, referenceNo, paidBy } = body

    if (!feeId || !amount || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields: feeId, amount, paymentMethod' }, { status: 400 })
    }

    const fee = await db.fee.findUnique({ where: { id: feeId } })
    if (!fee) {
      return NextResponse.json({ error: 'Fee not found' }, { status: 404 })
    }

    const payment = await db.payment.create({
      data: { feeId, amount, paymentMethod, referenceNo: referenceNo || null, paidBy: paidBy || null, status: 'Pending' },
      include: {
        fee: {
          include: {
            student: {
              include: {
                user: { select: { id: true, name: true, email: true } },
                room: { include: { hostel: true } },
              },
            },
          },
        },
      },
    })

    const newPartiallyPaid = fee.partiallyPaidAmount + amount
    const updateData: Record<string, unknown> = {
      paymentMethod,
      partiallyPaidAmount: newPartiallyPaid,
    }

    if (newPartiallyPaid >= fee.amount + fee.lateFine) {
      updateData.status = 'Paid'
      updateData.paidDate = new Date()
      updateData.receiptNo = `RCP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
    } else if (newPartiallyPaid > 0) {
      updateData.status = 'Partially Paid'
    }

    await db.fee.update({ where: { id: feeId }, data: updateData })

    return NextResponse.json({ payment }, { status: 201 })
  } catch (error) {
    console.error('Create payment error:', error)
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}
