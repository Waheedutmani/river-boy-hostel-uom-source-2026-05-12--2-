import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const now = new Date()
    const currentMonth = now.toLocaleString('en-US', { month: 'long' })
    const currentYear = now.getFullYear()

    const paidFees = await db.fee.findMany({
      where: { status: 'Paid' },
      include: { student: { include: { user: { select: { name: true } } } } },
    })
    const totalRevenue = paidFees.reduce((s, f) => s + f.amount, 0)

    const monthlyPaid = paidFees.filter(f => f.month === currentMonth && f.year === currentYear)
    const monthlyCollection = monthlyPaid.reduce((s, f) => s + f.amount, 0)

    const pendingFees = await db.fee.findMany({ where: { status: 'Pending' } })
    const pendingAmount = pendingFees.reduce((s, f) => s + f.amount, 0)

    const overdueFees = await db.fee.findMany({
      where: {
        status: { in: ['Pending', 'Partially Paid'] },
        dueDate: { lt: now },
      },
    })
    const overdueAmount = overdueFees.reduce((s, f) => s + (f.amount - f.partiallyPaidAmount), 0)

    const totalFineCollected = paidFees.reduce((s, f) => s + f.lateFine, 0)
    const totalFinePending = pendingFees.reduce((s, f) => s + f.lateFine, 0)

    const activeStudents = await db.student.count({ where: { status: 'Active' } })

    const feeTypeBreakdown: Record<string, { count: number; amount: number; paid: number }> = {}
    const allFees = await db.fee.findMany()
    for (const fee of allFees) {
      if (!feeTypeBreakdown[fee.feeType]) {
        feeTypeBreakdown[fee.feeType] = { count: 0, amount: 0, paid: 0 }
      }
      feeTypeBreakdown[fee.feeType].count++
      feeTypeBreakdown[fee.feeType].amount += fee.amount
      if (fee.status === 'Paid') feeTypeBreakdown[fee.feeType].paid += fee.amount
    }

    const monthYears = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      monthYears.push({ label: d.toLocaleString('en-US', { month: 'short', year: '2-digit' }), month: d.toLocaleString('en-US', { month: 'long' }), year: d.getFullYear() })
    }

    const monthlyRevenueTrend = monthYears.map(({ label, month, year }) => {
      const monthPaid = paidFees.filter(f => f.month === month && f.year === year)
      return { month: label, revenue: monthPaid.reduce((s, f) => s + f.amount, 0) }
    })

    const paymentMethods: Record<string, number> = {}
    const verifiedPayments = await db.payment.findMany({ where: { status: 'Verified' } })
    for (const p of verifiedPayments) {
      paymentMethods[p.paymentMethod] = (paymentMethods[p.paymentMethod] || 0) + p.amount
    }
    const paymentMethodDistribution = Object.entries(paymentMethods).map(([name, value]) => ({ name, value }))

    const studentDues: Record<string, { name: string; rollNo: string; department: string; totalDue: number }> = {}
    const unpaidFees = await db.fee.findMany({
      where: { status: { in: ['Pending', 'Overdue', 'Partially Paid'] } },
      include: { student: { include: { user: { select: { name: true } } } } },
    })
    for (const fee of unpaidFees) {
      const key = fee.studentId
      if (!studentDues[key]) {
        studentDues[key] = {
          name: fee.student?.user?.name || 'Unknown',
          rollNo: fee.student?.rollNo || '',
          department: fee.student?.department || '',
          totalDue: 0,
        }
      }
      studentDues[key].totalDue += fee.amount - fee.partiallyPaidAmount + fee.lateFine
    }
    const topDebtors = Object.values(studentDues).sort((a, b) => b.totalDue - a.totalDue).slice(0, 10)

    const recentPayments = await db.payment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        fee: {
          include: {
            student: {
              include: { user: { select: { name: true } }, room: { include: { hostel: true } } },
            },
          },
        },
      },
    })
    const recentPaymentsFlat = recentPayments.map(p => ({
      id: p.id,
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      referenceNo: p.referenceNo,
      status: p.status,
      createdAt: p.createdAt,
      studentName: p.fee?.student?.user?.name || 'Unknown',
      rollNo: p.fee?.student?.rollNo || '',
      feeType: p.fee?.feeType || '',
      month: p.fee?.month || '',
      year: p.fee?.year || 0,
    }))

    return NextResponse.json({
      totalRevenue,
      monthlyCollection,
      pendingAmount,
      overdueAmount,
      totalFineCollected,
      totalFinePending,
      activeStudents,
      overdueCount: overdueFees.length,
      feeTypeBreakdown,
      monthlyRevenueTrend,
      paymentMethodDistribution,
      topDebtors,
      recentPayments: recentPaymentsFlat,
      totalFees: allFees.length,
      paidCount: paidFees.length,
      pendingCount: pendingFees.length,
    })
  } catch (error) {
    console.error('Payment stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch payment stats' }, { status: 500 })
  }
}
