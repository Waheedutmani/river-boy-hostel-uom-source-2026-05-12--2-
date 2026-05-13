import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payment = await db.payment.findUnique({
      where: { id },
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

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    return NextResponse.json({ payment })
  } catch (error) {
    console.error('Get payment error:', error)
    return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, verifiedBy, notes } = body

    const updateData: Record<string, unknown> = {}
    if (status) {
      updateData.status = status
      if (status === 'Verified' && verifiedBy) {
        updateData.verifiedBy = verifiedBy
        updateData.verifiedAt = new Date()
      }
    }
    if (notes !== undefined) updateData.notes = notes

    const payment = await db.payment.update({
      where: { id },
      data: updateData,
      include: {
        fee: {
          include: {
            student: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ payment })
  } catch (error) {
    console.error('Update payment error:', error)
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.payment.delete({ where: { id } })
    return NextResponse.json({ message: 'Payment deleted successfully' })
  } catch (error) {
    console.error('Delete payment error:', error)
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 })
  }
}
