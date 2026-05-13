import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || 'admin'
    const userId = searchParams.get('userId')

    if (role === 'admin') {
      const totalStudents = await db.student.count()
      const totalRooms = await db.room.count()
      const occupiedRooms = await db.room.count({ where: { status: 'Occupied' } })
      const availableRooms = await db.room.count({ where: { status: 'Available' } })
      const maintenanceRooms = await db.room.count({ where: { status: 'Maintenance' } })
      const pendingApplications = await db.application.count({ where: { status: 'Pending' } })
      const openComplaints = await db.complaint.count({ where: { status: { in: ['Open', 'In Progress'] } } })
      const totalHostels = await db.hostel.count()
      const totalStaff = await db.staff.count({ where: { status: 'Active' } })

      // Fee breakdown by status count
      const paidFees = await db.fee.count({ where: { status: 'Paid' } })
      const pendingFees = await db.fee.count({ where: { status: 'Pending' } })
      const overdueFees = await db.fee.count({ where: { status: 'Overdue' } })

      // Fee amounts
      const paidFeeRecords = await db.fee.findMany({ where: { status: 'Paid' } })
      const pendingFeeRecords = await db.fee.findMany({ where: { status: 'Pending' } })
      const overdueFeeRecords = await db.fee.findMany({ where: { status: 'Overdue' } })
      const monthlyRevenue = paidFeeRecords.reduce((sum, fee) => sum + fee.amount, 0)
      const pendingRevenue = pendingFeeRecords.reduce((sum, fee) => sum + fee.amount, 0)
      const overdueRevenue = overdueFeeRecords.reduce((sum, fee) => sum + fee.amount, 0)

      // Monthly revenue trend (last 6 months)
      const now = new Date()
      const monthlyRevenueTrend: { month: string; revenue: number }[] = []
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthName = monthDate.toLocaleString('en', { month: 'short' })
        const monthFees = paidFeeRecords.filter(f => {
          const paidDate = f.paidDate ? new Date(f.paidDate) : new Date(f.createdAt)
          return paidDate.getMonth() === monthDate.getMonth() && paidDate.getFullYear() === monthDate.getFullYear()
        })
        monthlyRevenueTrend.push({
          month: monthName,
          revenue: monthFees.reduce((sum, f) => sum + f.amount, 0)
        })
      }

      // Student movement stats
      const studentsOutside = await db.studentMovement.count({ where: { status: 'Out' } })
      const pendingLeaveRequests = await db.studentMovement.count({ where: { status: 'Pending' } })
      const lateReturns = await db.studentMovement.count({ where: { status: 'Late Return' } })
      const returnedToday = await db.studentMovement.count({
        where: {
          status: 'Returned',
          actualReturnDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      })

      // Recent movements
      const recentMovements = await db.studentMovement.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { student: { include: { user: true, room: { include: { hostel: true } } } } },
      })

      // Complaint categories breakdown
      const complaints = await db.complaint.findMany()
      const complaintCategories: Record<string, number> = {}
      complaints.forEach(c => {
        complaintCategories[c.category] = (complaintCategories[c.category] || 0) + 1
      })

      // Room status breakdown
      const roomStatusBreakdown = [
        { name: 'Available', value: availableRooms, color: '#22c55e' },
        { name: 'Occupied', value: occupiedRooms, color: '#1e3a5f' },
        { name: 'Maintenance', value: maintenanceRooms, color: '#f59e0b' },
      ].filter(r => r.value > 0)

      // Hostel occupancy
      const hostelOccupancy = await db.hostel.findMany({
        include: {
          rooms: {
            include: { students: true },
          },
        },
      })

      const hostelOccupancyData = hostelOccupancy.map((hostel) => {
        const totalCapacity = hostel.rooms.reduce((sum, room) => sum + room.capacity, 0)
        const totalOccupancy = hostel.rooms.reduce((sum, room) => sum + room.students.length, 0)
        return {
          name: hostel.name,
          type: hostel.type,
          totalRooms: hostel.rooms.length,
          totalCapacity,
          totalOccupancy,
          occupancyRate: totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0,
        }
      })

      // Recent activities
      const recentComplaints = await db.complaint.findMany({
        take: 4,
        orderBy: { createdAt: 'desc' },
        include: { student: { include: { user: true } } },
      })

      const recentApps = await db.application.findMany({
        take: 4,
        orderBy: { createdAt: 'desc' },
        include: { student: { include: { user: true } }, hostel: true },
      })

      const recentFees = await db.fee.findMany({
        take: 4,
        where: { status: 'Paid' },
        orderBy: { paidDate: 'desc' },
        include: { student: { include: { user: true } } },
      })

      const recentActivities = [
        ...recentComplaints.map((c) => ({
          id: c.id,
          type: 'complaint',
          message: `New complaint: ${c.title} by ${c.student.user.name}`,
          time: c.createdAt,
        })),
        ...recentApps.map((a) => ({
          id: a.id,
          type: 'application',
          message: `Application for ${a.hostel.name} by ${a.student.user.name}`,
          time: a.createdAt,
        })),
        ...recentFees.map((f) => ({
          id: f.id,
          type: 'payment',
          message: `Payment of Rs. ${f.amount.toLocaleString()} received from ${f.student.user.name}`,
          time: f.paidDate || f.createdAt,
        })),
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10)

      // Student growth by department
      const students = await db.student.findMany()
      const departmentBreakdown: Record<string, number> = {}
      students.forEach(s => {
        departmentBreakdown[s.department] = (departmentBreakdown[s.department] || 0) + 1
      })

      // Recent payments for widget
      const recentPayments = await db.fee.findMany({
        take: 6,
        where: { status: 'Paid' },
        orderBy: { paidDate: 'desc' },
        include: { student: { include: { user: true } } },
      })

      // Complaint stats
      const complaintStats = {
        open: complaints.filter(c => c.status === 'Open').length,
        inProgress: complaints.filter(c => c.status === 'In Progress').length,
        resolved: complaints.filter(c => c.status === 'Resolved').length,
      }

      return NextResponse.json({
        totalStudents,
        totalRooms,
        occupiedRooms,
        availableRooms,
        maintenanceRooms,
        pendingApplications,
        monthlyRevenue,
        pendingRevenue,
        overdueRevenue,
        openComplaints,
        totalHostels,
        totalStaff,
        studentsOutside,
        pendingLeaveRequests,
        lateReturns,
        returnedToday,
        feeBreakdown: {
          paid: paidFees,
          pending: pendingFees,
          overdue: overdueFees,
          paidAmount: monthlyRevenue,
          pendingAmount: pendingRevenue,
          overdueAmount: overdueRevenue,
        },
        monthlyRevenueTrend,
        roomStatusBreakdown,
        hostelOccupancy: hostelOccupancyData,
        complaintCategories,
        complaintStats,
        latestComplaints: recentComplaints.map(c => ({
          id: c.id,
          title: c.title,
          studentName: c.student?.user?.name || 'Unknown',
          category: c.category,
          priority: c.priority,
          status: c.status,
          createdAt: c.createdAt,
        })),
        recentActivities,
        recentMovements: recentMovements.map(m => ({
          id: m.id,
          reason: m.reason,
          status: m.status,
          departureDate: m.departureDate,
          expectedReturnDate: m.expectedReturnDate,
          destination: m.destination,
          studentName: m.student?.user?.name || 'Unknown',
          rollNo: m.student?.rollNo || '',
          roomNumber: m.student?.room?.number || '',
          hostelName: m.student?.room?.hostel?.name || '',
          createdAt: m.createdAt,
        })),
        departmentBreakdown,
        recentPayments: recentPayments.map(p => ({
          id: p.id,
          amount: p.amount,
          feeType: p.feeType,
          studentName: p.student?.user?.name || 'Unknown',
          paidDate: p.paidDate,
        })),
      })
    }

    if (role === 'student' && userId) {
      const student = await db.student.findFirst({
        where: { userId },
        include: {
          user: true,
          room: { include: { hostel: true } },
          fees: { orderBy: { createdAt: 'desc' } },
          complaints: { orderBy: { createdAt: 'desc' } },
          applications: { include: { hostel: true }, orderBy: { createdAt: 'desc' } },
        },
      })

      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 })
      }

      const totalFees = student.fees.reduce((sum, fee) => sum + fee.amount, 0)
      const pendingFeeAmount = student.fees
        .filter((fee) => fee.status === 'Pending' || fee.status === 'Overdue')
        .reduce((sum, fee) => sum + fee.amount, 0)
      const paidFeeAmount = student.fees
        .filter((fee) => fee.status === 'Paid')
        .reduce((sum, fee) => sum + fee.amount, 0)
      const overdueFeeAmount = student.fees
        .filter((fee) => fee.status === 'Overdue')
        .reduce((sum, fee) => sum + fee.amount, 0)

      // Get student movement records
      const movements = await db.studentMovement.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })

      // Current movement status
      const activeMovement = movements.find(m => m.status === 'Out' || m.status === 'Approved')
      const isPresent = !activeMovement
      const presenceStatus: 'Present' | 'Outside' | 'Late Return' = movements.find(m => m.status === 'Late Return')
        ? 'Late Return'
        : isPresent ? 'Present' : 'Outside'

      // Get recent notices
      const notices = await db.notice.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      })

      // Notifications for the student
      const notifications = await db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })

      // Activity timeline
      const activityTimeline = [
        ...student.fees.filter(f => f.status === 'Paid').map(f => ({
          id: `fee-${f.id}`,
          type: 'payment' as const,
          title: `Fee Payment - ${f.feeType}`,
          description: `${f.month} ${f.year} - Rs. ${f.amount.toLocaleString()}`,
          date: f.paidDate || f.createdAt,
          icon: 'receipt',
        })),
        ...student.complaints.map(c => ({
          id: `complaint-${c.id}`,
          type: 'complaint' as const,
          title: `Complaint: ${c.title}`,
          description: `Status: ${c.status} - ${c.category}`,
          date: c.createdAt,
          icon: 'complaint',
        })),
        ...movements.map(m => ({
          id: `movement-${m.id}`,
          type: 'movement' as const,
          title: `${m.reason} - ${m.status}`,
          description: m.destination || 'Departure registered',
          date: m.createdAt,
          icon: 'movement',
        })),
        ...student.applications.map(a => ({
          id: `app-${a.id}`,
          type: 'application' as const,
          title: `Room Application - ${a.hostel?.name || 'Hostel'}`,
          description: `Status: ${a.status}`,
          date: a.createdAt,
          icon: 'application',
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 12)

      return NextResponse.json({
        student: {
          id: student.id,
          name: student.user.name,
          email: student.user.email,
          rollNo: student.rollNo,
          department: student.department,
          semester: student.semester,
          status: student.status,
          phone: student.user.phone,
          avatar: student.user.avatar,
        },
        myRoom: student.room ? {
          id: student.room.id,
          number: student.room.number,
          floor: student.room.floor,
          capacity: student.room.capacity,
          hostel: student.room.hostel.name,
        } : null,
        myFees: {
          total: totalFees,
          paid: paidFeeAmount,
          pending: pendingFeeAmount,
          overdue: overdueFeeAmount,
          breakdown: student.fees,
        },
        myComplaints: student.complaints,
        myApplications: student.applications,
        pendingFees: pendingFeeAmount,
        movements,
        presenceStatus,
        activeMovement,
        notices,
        notifications,
        activityTimeline,
        leaveRequestCount: movements.filter(m => m.status === 'Pending' || m.status === 'Approved').length,
        complaintStats: {
          total: student.complaints.length,
          open: student.complaints.filter(c => c.status === 'Open').length,
          inProgress: student.complaints.filter(c => c.status === 'In Progress').length,
          resolved: student.complaints.filter(c => c.status === 'Resolved').length,
        },
      })
    }

    return NextResponse.json({ error: 'Invalid role or missing userId' }, { status: 400 })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}
