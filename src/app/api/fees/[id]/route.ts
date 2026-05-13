import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const fee = await db.fee.findUnique({
      where: { id },
      include: {
        student: { include: { user: true, room: { include: { hostel: true } } } },
      },
    })

    if (!fee) {
      return NextResponse.json({ error: 'Fee not found' }, { status: 404 })
    }

    return NextResponse.json({ fee })
  } catch (error) {
    console.error('Get fee error:', error)
    return NextResponse.json({ error: 'Failed to fetch fee' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, paidDate, receiptNo, amount, month, year, feeType } = body

    const updateData: Record<string, unknown> = {}
    if (amount !== undefined) updateData.amount = amount
    if (month) updateData.month = month
    if (year !== undefined) updateData.year = year
    if (feeType) updateData.feeType = feeType

    if (status === 'Paid') {
      updateData.status = 'Paid'
      updateData.paidDate = paidDate ? new Date(paidDate) : new Date()
      updateData.receiptNo = receiptNo || `RCP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
    } else if (status) {
      updateData.status = status
    }

    const fee = await db.fee.update({
      where: { id },
      data: updateData,
      include: { student: { include: { user: { select: { id: true, name: true, email: true } } } } },
    })

    return NextResponse.json({ fee })
  } catch (error) {
    console.error('Update fee error:', error)
    return NextResponse.json({ error: 'Failed to update fee' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.fee.delete({ where: { id } })
    return NextResponse.json({ message: 'Fee deleted successfully' })
  } catch (error) {
    console.error('Delete fee error:', error)
    return NextResponse.json({ error: 'Failed to delete fee' }, { status: 500 })
  }
}
