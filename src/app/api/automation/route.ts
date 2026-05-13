import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // ===================== SMART DASHBOARD STATS =====================
    if (action === 'dashboard-stats') {
      const totalStudents = await db.student.count({ where: { status: 'Active' } })
      const totalRooms = await db.room.count()
      const occupiedRooms = await db.room.count({ where: { status: 'Occupied' } })
      const availableRooms = await db.room.count({ where: { status: 'Available' } })
      const maintenanceRooms = await db.room.count({ where: { status: 'Maintenance' } })

      // Fee analytics
      const paidFees = await db.fee.findMany({ where: { status: 'Paid' } })
      const pendingFees = await db.fee.findMany({ where: { status: 'Pending' } })
      const overdueFees = await db.fee.findMany({ where: { status: 'Overdue' } })
      const totalCollected = paidFees.reduce((s, f) => s + f.amount, 0)
      const totalPending = pendingFees.reduce((s, f) => s + f.amount, 0)
      const totalOverdue = overdueFees.reduce((s, f) => s + f.amount, 0)

      // Students outside / late returns
      const studentsOutside = await db.studentMovement.count({ where: { status: 'Out' } })
      const lateReturns = await db.studentMovement.count({ where: { status: 'Late Return' } })
      const pendingLeave = await db.studentMovement.count({ where: { status: 'Pending' } })

      // Pending visitor approvals
      const pendingVisitors = await db.visitor.count({ where: { status: 'Pending' } })
      const activeVisitors = await db.visitor.count({ where: { status: 'Checked In' } })

      // Open complaints
      const openComplaints = await db.complaint.count({ where: { status: { in: ['Open', 'In Progress'] } } })
      const pendingMaintenance = await db.maintenanceRequest.count({ where: { status: 'Pending' } })
      const pendingApplications = await db.application.count({ where: { status: 'Pending' } })

      // Occupancy rate
      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0

      // Collection rate
      const totalFees = totalCollected + totalPending + totalOverdue
      const collectionRate = totalFees > 0 ? Math.round((totalCollected / totalFees) * 100) : 0

      return NextResponse.json({
        totalStudents,
        totalRooms,
        occupiedRooms,
        availableRooms,
        maintenanceRooms,
        occupancyRate,
        totalCollected,
        totalPending,
        totalOverdue,
        collectionRate,
        studentsOutside,
        lateReturns,
        pendingLeave,
        pendingVisitors,
        activeVisitors,
        openComplaints,
        pendingMaintenance,
        pendingApplications,
        paidCount: paidFees.length,
        pendingCount: pendingFees.length,
        overdueCount: overdueFees.length,
      })
    }

    // ===================== SMART SEARCH =====================
    if (action === 'smart-search') {
      const query = searchParams.get('q') || ''
      const category = searchParams.get('category') || 'all'

      if (!query || query.length < 1) {
        return NextResponse.json({ results: [] })
      }

      const results: { type: string; id: string; title: string; subtitle: string; badge?: string; badgeColor?: string }[] = []
      const q = query.toLowerCase()

      // Search students
      if (category === 'all' || category === 'students') {
        const students = await db.student.findMany({
          where: {
            OR: [
              { rollNo: { contains: q } },
              { department: { contains: q } },
              { user: { name: { contains: q } } },
              { user: { email: { contains: q } } },
            ],
          },
          include: { user: true, room: { include: { hostel: true } } },
          take: 8,
        })
        students.forEach(s => {
          results.push({
            type: 'Student',
            id: s.id,
            title: s.user?.name || s.rollNo,
            subtitle: `${s.rollNo} · ${s.department} · Sem ${s.semester}${s.room ? ` · Room ${s.room.number}` : ''}`,
            badge: s.status,
            badgeColor: s.status === 'Active' ? 'green' : s.status === 'Inactive' ? 'red' : 'blue',
          })
        })
      }

      // Search rooms
      if (category === 'all' || category === 'rooms') {
        const rooms = await db.room.findMany({
          where: {
            OR: [
              { number: { contains: q } },
              { hostel: { name: { contains: q } } },
              { status: { contains: q } },
            ],
          },
          include: { hostel: true, students: { include: { user: true } } },
          take: 8,
        })
        rooms.forEach(r => {
          const occupants = r.students.map(s => s.user?.name).join(', ')
          results.push({
            type: 'Room',
            id: r.id,
            title: `Room ${r.number}`,
            subtitle: `${r.hostel?.name || ''} · Floor ${r.floor} · ${r.students.length}/${r.capacity} occupied`,
            badge: r.status,
            badgeColor: r.status === 'Available' ? 'green' : r.status === 'Occupied' ? 'amber' : 'red',
          })
        })
      }

      // Search payments
      if (category === 'all' || category === 'payments') {
        const fees = await db.fee.findMany({
          where: {
            OR: [
              { feeType: { contains: q } },
              { status: { contains: q } },
              { student: { user: { name: { contains: q } } } },
              { student: { rollNo: { contains: q } } },
            ],
          },
          include: { student: { include: { user: true } } },
          take: 8,
          orderBy: { createdAt: 'desc' },
        })
        fees.forEach(f => {
          results.push({
            type: 'Payment',
            id: f.id,
            title: `${f.feeType} - Rs. ${Math.round(f.amount).toLocaleString()}`,
            subtitle: `${f.student?.user?.name || ''} · ${f.month} ${f.year}`,
            badge: f.status,
            badgeColor: f.status === 'Paid' ? 'green' : f.status === 'Pending' ? 'amber' : 'red',
          })
        })
      }

      // Search complaints
      if (category === 'all' || category === 'complaints') {
        const complaints = await db.complaint.findMany({
          where: {
            OR: [
              { title: { contains: q } },
              { category: { contains: q } },
              { status: { contains: q } },
              { student: { user: { name: { contains: q } } } },
            ],
          },
          include: { student: { include: { user: true } } },
          take: 8,
          orderBy: { createdAt: 'desc' },
        })
        complaints.forEach(c => {
          results.push({
            type: 'Complaint',
            id: c.id,
            title: c.title,
            subtitle: `${c.student?.user?.name || ''} · ${c.category} · ${c.priority}`,
            badge: c.status,
            badgeColor: c.status === 'Open' ? 'blue' : c.status === 'In Progress' ? 'amber' : 'green',
          })
        })
      }

      return NextResponse.json({ results })
    }

    // ===================== AUTO ROOM SUGGESTION =====================
    if (action === 'room-suggestion') {
      const hostelId = searchParams.get('hostelId') || ''
      const preferredFloor = searchParams.get('floor') || ''

      const where: Record<string, unknown> = { status: 'Available' }
      if (hostelId) where.hostelId = hostelId
      if (preferredFloor) where.floor = parseInt(preferredFloor)

      const availableRooms = await db.room.findMany({
        where,
        include: {
          hostel: true,
          students: { include: { user: true } },
          maintenanceRequests: { where: { status: { in: ['Pending', 'In Progress'] } } },
        },
        orderBy: [{ floor: 'asc' }, { number: 'asc' }],
      })

      // Score each room for smart suggestion
      const scored = availableRooms.map(room => {
        let score = 100
        // Prefer rooms with fewer occupants (more space)
        const remainingCapacity = room.capacity - room.students.length
        score += remainingCapacity * 10
        // Prefer rooms with no pending maintenance
        if (room.maintenanceRequests.length > 0) score -= 30
        // Prefer ground/first floor
        if (room.floor === 0) score += 15
        else if (room.floor === 1) score += 10
        else if (room.floor === 2) score += 5
        // Prefer rooms that are completely empty
        if (room.students.length === 0) score += 20

        return {
          id: room.id,
          number: room.number,
          floor: room.floor,
          capacity: room.capacity,
          currentOccupancy: room.students.length,
          remainingCapacity,
          hostel: room.hostel?.name || '',
          hostelType: room.hostel?.type || '',
          hasMaintenance: room.maintenanceRequests.length > 0,
          score: Math.max(score, 0),
          reason: generateRoomReason(room, remainingCapacity, room.maintenanceRequests.length),
          occupants: room.students.map(s => s.user?.name || ''),
        }
      }).sort((a, b) => b.score - a.score)

      return NextResponse.json({ suggestions: scored.slice(0, 10) })
    }

    // ===================== AUTO LATE FEE CALCULATION =====================
    if (action === 'calculate-late-fees') {
      const now = new Date()
      const currentMonth = now.toLocaleString('en', { month: 'long' })
      const currentYear = now.getFullYear()

      // Find all pending fees that are overdue (month has passed)
      const pendingFees = await db.fee.findMany({
        where: {
          status: { in: ['Pending', 'Overdue'] },
        },
        include: {
          student: { include: { user: true, room: { include: { hostel: true } } } },
        },
        orderBy: { createdAt: 'asc' },
      })

      const LATE_FEE_PER_MONTH = 500 // Rs. 500 per month late fee
      const results: {
        id: string; studentName: string; rollNo: string; feeType: string;
        originalAmount: number; monthsOverdue: number; lateFee: number;
        totalDue: number; feeMonth: string; feeYear: number; currentStatus: string;
        room: string | null; hostel: string | null;
      }[] = []

      pendingFees.forEach(fee => {
        const feeDate = new Date(fee.year, MONTHS.indexOf(fee.month) + 1, 1) // First day of next month
        const monthsDiff = (currentYear - fee.year) * 12 + (now.getMonth() - MONTHS.indexOf(fee.month))
        const monthsOverdue = Math.max(monthsDiff, 0)

        if (monthsOverdue > 0) {
          const lateFee = Math.min(monthsOverdue * LATE_FEE_PER_MONTH, fee.amount * 0.5) // Cap at 50% of original
          results.push({
            id: fee.id,
            studentName: fee.student?.user?.name || 'Unknown',
            rollNo: fee.student?.rollNo || '',
            feeType: fee.feeType,
            originalAmount: fee.amount,
            monthsOverdue,
            lateFee: Math.round(lateFee),
            totalDue: Math.round(fee.amount + lateFee),
            feeMonth: fee.month,
            feeYear: fee.year,
            currentStatus: fee.status,
            room: fee.student?.room?.number || null,
            hostel: fee.student?.room?.hostel?.name || null,
          })
        }
      })

      return NextResponse.json({
        lateFees: results,
        totalLateFee: results.reduce((s, r) => s + r.lateFee, 0),
        totalOriginal: results.reduce((s, r) => s + r.originalAmount, 0),
        totalDue: results.reduce((s, r) => s + r.totalDue, 0),
        affectedStudents: new Set(results.map(r => r.rollNo)).size,
        lateFeeRate: LATE_FEE_PER_MONTH,
      })
    }

    // ===================== APPLY LATE FEES =====================
    if (action === 'apply-late-fees') {
      const now = new Date()
      const pendingFees = await db.fee.findMany({
        where: { status: { in: ['Pending', 'Overdue'] } },
      })

      const LATE_FEE_PER_MONTH = 500
      let updated = 0
      let totalLateFeeApplied = 0

      for (const fee of pendingFees) {
        const monthsDiff = (now.getFullYear() - fee.year) * 12 + (now.getMonth() - MONTHS.indexOf(fee.month))
        if (monthsDiff > 0) {
          const lateFee = Math.min(monthsDiff * LATE_FEE_PER_MONTH, fee.amount * 0.5)
          await db.fee.update({
            where: { id: fee.id },
            data: {
              status: 'Overdue',
              amount: fee.amount + Math.round(lateFee), // Add late fee to the amount
            },
          })
          totalLateFeeApplied += Math.round(lateFee)
          updated++
        }
      }

      return NextResponse.json({
        success: true,
        updated,
        totalLateFeeApplied,
        message: `Applied late fees to ${updated} records. Total: Rs. ${totalLateFeeApplied.toLocaleString()}`,
      })
    }

    // ===================== AUTO LEAVE STATUS UPDATE =====================
    if (action === 'update-leave-status') {
      const now = new Date()

      // Find movements that are "Out" and expected return date has passed
      const overdueMovements = await db.studentMovement.findMany({
        where: {
          status: 'Out',
          expectedReturnDate: { lt: now },
        },
        include: { student: { include: { user: true } } },
      })

      let updated = 0
      for (const movement of overdueMovements) {
        await db.studentMovement.update({
          where: { id: movement.id },
          data: { status: 'Late Return' },
        })
        updated++
      }

      return NextResponse.json({
        success: true,
        updated,
        message: updated > 0 ? `${updated} movement(s) marked as Late Return` : 'All movements are up to date',
      })
    }

    // ===================== SMART REPORTS =====================
    if (action === 'report') {
      const reportType = searchParams.get('type') || 'students'

      if (reportType === 'students') {
        const students = await db.student.findMany({
          include: {
            user: true,
            room: { include: { hostel: true } },
            fees: true,
            complaints: true,
            movements: { orderBy: { createdAt: 'desc' }, take: 3 },
          },
          orderBy: { createdAt: 'desc' },
        })

        const report = students.map(s => ({
          id: s.id,
          name: s.user?.name || '',
          email: s.user?.email || '',
          rollNo: s.rollNo,
          department: s.department,
          semester: s.semester,
          status: s.status,
          room: s.room?.number || 'Not Assigned',
          hostel: s.room?.hostel?.name || '',
          totalFees: s.fees.length,
          paidFees: s.fees.filter(f => f.status === 'Paid').length,
          pendingFees: s.fees.filter(f => f.status === 'Pending' || f.status === 'Overdue').length,
          totalDue: s.fees.filter(f => f.status !== 'Paid').reduce((sum, f) => sum + f.amount, 0),
          openComplaints: s.complaints.filter(c => c.status !== 'Resolved').length,
          lastMovement: s.movements[0]?.reason || 'None',
        }))

        return NextResponse.json({
          report,
          generatedAt: new Date().toISOString(),
          totalStudents: report.length,
          activeStudents: report.filter(s => s.status === 'Active').length,
          withRoom: report.filter(s => s.room !== 'Not Assigned').length,
          withDues: report.filter(s => s.totalDue > 0).length,
        })
      }

      if (reportType === 'rooms') {
        const rooms = await db.room.findMany({
          include: {
            hostel: true,
            students: { include: { user: true, fees: true } },
            maintenanceRequests: { where: { status: { in: ['Pending', 'In Progress'] } } },
          },
          orderBy: [{ hostel: { name: 'asc' } }, { floor: 'asc' }, { number: 'asc' }],
        })

        const report = rooms.map(r => ({
          id: r.id,
          number: r.number,
          floor: r.floor,
          capacity: r.capacity,
          status: r.status,
          hostel: r.hostel?.name || '',
          hostelType: r.hostel?.type || '',
          currentOccupancy: r.students.length,
          remainingCapacity: r.capacity - r.students.length,
          occupancyPercent: r.capacity > 0 ? Math.round((r.students.length / r.capacity) * 100) : 0,
          occupants: r.students.map(s => ({ name: s.user?.name, rollNo: s.rollNo, department: s.department })),
          pendingMaintenance: r.maintenanceRequests.length,
          totalDueFromOccupants: r.students.flatMap(s => s.fees.filter(f => f.status !== 'Paid')).reduce((sum, f) => sum + f.amount, 0),
        }))

        return NextResponse.json({
          report,
          generatedAt: new Date().toISOString(),
          totalRooms: report.length,
          availableRooms: report.filter(r => r.status === 'Available').length,
          occupiedRooms: report.filter(r => r.status === 'Occupied').length,
          maintenanceRooms: report.filter(r => r.status === 'Maintenance').length,
          overallOccupancy: Math.round((report.filter(r => r.status === 'Occupied').length / report.length) * 100),
        })
      }

      if (reportType === 'payments') {
        const fees = await db.fee.findMany({
          include: { student: { include: { user: true, room: { include: { hostel: true } } } } },
          orderBy: { createdAt: 'desc' },
        })

        const byType: Record<string, { count: number; total: number; paid: number; pending: number; overdue: number }> = {}
        const byMonth: Record<string, { collected: number; pending: number; overdue: number }> = {}

        fees.forEach(f => {
          // By type
          if (!byType[f.feeType]) byType[f.feeType] = { count: 0, total: 0, paid: 0, pending: 0, overdue: 0 }
          byType[f.feeType].count++
          byType[f.feeType].total += f.amount
          if (f.status === 'Paid') byType[f.feeType].paid += f.amount
          else if (f.status === 'Pending') byType[f.feeType].pending += f.amount
          else byType[f.feeType].overdue += f.amount

          // By month
          const key = `${f.month} ${f.year}`
          if (!byMonth[key]) byMonth[key] = { collected: 0, pending: 0, overdue: 0 }
          if (f.status === 'Paid') byMonth[key].collected += f.amount
          else if (f.status === 'Pending') byMonth[key].pending += f.amount
          else byMonth[key].overdue += f.amount
        })

        return NextResponse.json({
          generatedAt: new Date().toISOString(),
          totalFees: fees.length,
          totalAmount: fees.reduce((s, f) => s + f.amount, 0),
          totalCollected: fees.filter(f => f.status === 'Paid').reduce((s, f) => s + f.amount, 0),
          totalPending: fees.filter(f => f.status === 'Pending').reduce((s, f) => s + f.amount, 0),
          totalOverdue: fees.filter(f => f.status === 'Overdue').reduce((s, f) => s + f.amount, 0),
          byType,
          byMonth,
          recentPayments: fees.filter(f => f.status === 'Paid').slice(0, 20).map(f => ({
            id: f.id,
            student: f.student?.user?.name || '',
            rollNo: f.student?.rollNo || '',
            amount: f.amount,
            feeType: f.feeType,
            month: f.month,
            year: f.year,
            paidDate: f.paidDate,
            room: f.student?.room?.number || '',
            hostel: f.student?.room?.hostel?.name || '',
          })),
        })
      }

      if (reportType === 'leaves') {
        const movements = await db.studentMovement.findMany({
          include: { student: { include: { user: true, room: { include: { hostel: true } } } } },
          orderBy: { createdAt: 'desc' },
        })

        const byReason: Record<string, number> = {}
        const byStatus: Record<string, number> = {}
        let avgDuration = 0
        let completedTrips = 0

        movements.forEach(m => {
          byReason[m.reason] = (byReason[m.reason] || 0) + 1
          byStatus[m.status] = (byStatus[m.status] || 0) + 1
          if (m.actualReturnDate && m.departureDate) {
            const days = Math.ceil((new Date(m.actualReturnDate).getTime() - new Date(m.departureDate).getTime()) / 86400000)
            avgDuration += days
            completedTrips++
          }
        })

        return NextResponse.json({
          generatedAt: new Date().toISOString(),
          totalMovements: movements.length,
          byReason,
          byStatus,
          avgDurationDays: completedTrips > 0 ? Math.round(avgDuration / completedTrips) : 0,
          currentlyOutside: movements.filter(m => m.status === 'Out').length,
          pendingApprovals: movements.filter(m => m.status === 'Pending').length,
          lateReturns: movements.filter(m => m.status === 'Late Return').length,
          recentMovements: movements.slice(0, 20).map(m => ({
            id: m.id,
            student: m.student?.user?.name || '',
            rollNo: m.student?.rollNo || '',
            reason: m.reason,
            destination: m.destination || '',
            departureDate: m.departureDate,
            expectedReturnDate: m.expectedReturnDate,
            actualReturnDate: m.actualReturnDate,
            status: m.status,
            room: m.student?.room?.number || '',
            hostel: m.student?.room?.hostel?.name || '',
          })),
        })
      }

      return NextResponse.json({ error: 'Unknown report type' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Automation API error:', error)
    return NextResponse.json({ error: 'Automation operation failed' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    // ===================== MARK FEES AS PAID (BULK) =====================
    if (action === 'mark-fees-paid') {
      const { feeIds } = body as { feeIds: string[] }
      if (!feeIds || !Array.isArray(feeIds)) {
        return NextResponse.json({ error: 'feeIds array required' }, { status: 400 })
      }

      const now = new Date()
      let updated = 0
      for (const id of feeIds) {
        try {
          await db.fee.update({
            where: { id },
            data: { status: 'Paid', paidDate: now },
          })
          updated++
        } catch { /* skip invalid ids */ }
      }

      return NextResponse.json({ success: true, updated, message: `${updated} fee(s) marked as Paid` })
    }

    // ===================== UPDATE OVERDUE STATUS =====================
    if (action === 'mark-overdue') {
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      // Find all pending fees from previous months
      const pendingFees = await db.fee.findMany({
        where: { status: 'Pending' },
      })

      let updated = 0
      for (const fee of pendingFees) {
        const feeMonthIndex = MONTHS.indexOf(fee.month)
        const isOverdue = (fee.year < currentYear) || (fee.year === currentYear && feeMonthIndex < currentMonth)
        if (isOverdue) {
          await db.fee.update({
            where: { id: fee.id },
            data: { status: 'Overdue' },
          })
          updated++
        }
      }

      return NextResponse.json({
        success: true,
        updated,
        message: `${updated} fee(s) marked as Overdue`,
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Automation POST error:', error)
    return NextResponse.json({ error: 'Automation operation failed' }, { status: 500 })
  }
}

// Helper constants
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

// Helper: generate room suggestion reason
function generateRoomReason(room: { students: { length: number }; capacity: number; floor: number; maintenanceRequests: { length: number }[] }, remaining: number, maintCount: number): string {
  const reasons: string[] = []
  if (room.students.length === 0) reasons.push('Empty room — full privacy')
  else if (remaining >= 2) reasons.push(`${remaining} beds available`)
  else reasons.push('Only 1 bed left')

  if (room.floor === 0) reasons.push('Ground floor — easy access')
  else if (room.floor === 1) reasons.push('First floor — convenient')

  if (maintCount === 0) reasons.push('No maintenance issues')
  else reasons.push(`${maintCount} pending maintenance request(s)`)

  return reasons.join(' · ')
}
