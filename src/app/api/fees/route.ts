import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const studentId = searchParams.get('studentId')
    const feeType = searchParams.get('feeType')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (studentId) where.studentId = studentId
    if (feeType) where.feeType = feeType

    const fees = await db.fee.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            room: { include: { hostel: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Flatten student data for easier frontend consumption
    const flatFees = fees.map(fee => ({
      ...fee,
      student: fee.student ? {
        id: fee.student.id,
        name: fee.student.user?.name || '',
        rollNo: fee.student.rollNo,
        department: fee.student.department,
        room: fee.student.room ? {
          number: fee.student.room.number,
          hostel: fee.student.room.hostel ? { name: fee.student.room.hostel.name } : null,
        } : null,
      } : null,
    }))

    return NextResponse.json({ fees: flatFees })
  } catch (error) {
    console.error('Get fees error:', error)
    return NextResponse.json({ error: 'Failed to fetch fees' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { studentId, amount, month, year, feeType, status } = body

    if (!studentId || !amount || !month || !year || !feeType) {
      return NextResponse.json({ error: 'Missing required fields: studentId, amount, month, year, feeType' }, { status: 400 })
    }

    const fee = await db.fee.create({
      data: {
        studentId,
        amount,
        month,
        year,
        feeType,
        status: status || 'Pending',
      },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true } },
            room: { include: { hostel: true } },
          },
        },
      },
    })

    const flatFee = {
      ...fee,
      student: fee.student ? {
        id: fee.student.id,
        name: fee.student.user?.name || '',
        rollNo: fee.student.rollNo,
        department: fee.student.department,
        room: fee.student.room ? {
          number: fee.student.room.number,
          hostel: fee.student.room.hostel ? { name: fee.student.room.hostel.name } : null,
        } : null,
      } : null,
    }

    return NextResponse.json({ fee: flatFee }, { status: 201 })
  } catch (error) {
    console.error('Create fee error:', error)
    return NextResponse.json({ error: 'Failed to create fee' }, { status: 500 })
  }
}
