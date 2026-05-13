import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'bulkAssignFees') {
      const { feeStructureId, targetBy, targetValue, month, year, dueDate } = body

      const feeStructure = await db.feeStructure.findUnique({ where: { id: feeStructureId } })
      if (!feeStructure) {
        return NextResponse.json({ error: 'Fee structure not found' }, { status: 404 })
      }

      const studentWhere: Record<string, unknown> = { status: 'Active' }
      if (targetBy === 'department' && targetValue) {
        studentWhere.department = targetValue
      } else if (targetBy === 'room' && targetValue) {
        studentWhere.roomId = targetValue
      }

      const students = await db.student.findMany({ where: studentWhere })

      if (students.length === 0) {
        return NextResponse.json({ error: 'No active students found matching criteria' }, { status: 400 })
      }

      const fees = []
      for (const student of students) {
        const existing = await db.fee.findFirst({
          where: { studentId: student.id, month, year, feeType: feeStructure.feeType },
        })
        if (!existing) {
          const fee = await db.fee.create({
            data: {
              studentId: student.id,
              amount: feeStructure.amount,
              month,
              year,
              feeType: feeStructure.feeType,
              status: 'Pending',
              dueDate: dueDate ? new Date(dueDate) : null,
            },
          })
          fees.push(fee)
        }
      }

      return NextResponse.json({ message: `Fees assigned to ${fees.length} students`, count: fees.length, fees })
    }

    if (action === 'applyLateFines') {
      const now = new Date()

      const config = await db.lateFineConfig.findFirst({ where: { isActive: true } })
      if (!config) {
        return NextResponse.json({ error: 'No active late fine configuration found' }, { status: 400 })
      }

      const overdueFees = await db.fee.findMany({
        where: {
          status: { in: ['Pending', 'Partially Paid'] },
          dueDate: { lt: now, not: null },
        },
      })

      let updated = 0
      for (const fee of overdueFees) {
        if (!fee.dueDate) continue
        const daysOverdue = Math.floor((now.getTime() - new Date(fee.dueDate).getTime()) / (1000 * 60 * 60 * 24))
        const graceDays = config.gracePeriodDays

        if (daysOverdue > graceDays) {
          const fineDays = daysOverdue - graceDays
          const calculatedFine = Math.min(fineDays * config.finePerDay, config.maxFine)
          const currentFine = fee.lateFine || 0

          if (calculatedFine > currentFine) {
            await db.fee.update({
              where: { id: fee.id },
              data: {
                lateFine: calculatedFine,
                status: fee.status === 'Pending' ? 'Overdue' : fee.status,
              },
            })
            updated++
          }
        }
      }

      return NextResponse.json({ message: `Late fines applied to ${updated} fees`, count: updated })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Bulk payment action error:', error)
    return NextResponse.json({ error: 'Failed to process bulk action' }, { status: 500 })
  }
}
