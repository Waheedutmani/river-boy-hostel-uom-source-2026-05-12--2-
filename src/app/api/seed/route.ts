import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Clear ALL existing data in correct order (respecting foreign keys)
    await db.notification.deleteMany()
    await db.announcement.deleteMany()
    await db.visitor.deleteMany()
    await db.studentMovement.deleteMany()
    await db.maintenanceRequest.deleteMany()
    await db.application.deleteMany()
    await db.complaint.deleteMany()
    await db.payment.deleteMany()
    await db.feeStructure.deleteMany()
    await db.lateFineConfig.deleteMany()
    await db.fee.deleteMany()
    await db.student.deleteMany()
    await db.staff.deleteMany()
    await db.room.deleteMany()
    await db.hostel.deleteMany()
    await db.user.deleteMany()

    // ==========================================
    // CREATE USERS
    // ==========================================
    const adminUser = await db.user.create({
      data: {
        name: 'Admin Warden',
        email: 'admin@riverboyuom.edu.pk',
        password: Buffer.from('admin123').toString('base64'),
        role: 'admin',
        phone: '0300-1234567',
      },
    })

    const wardenUser = await db.user.create({
      data: {
        name: 'Head Warden',
        email: 'warden@riverboyuom.edu.pk',
        password: Buffer.from('warden123').toString('base64'),
        role: 'admin',
        phone: '0301-2345678',
      },
    })

    const studentData = [
      { name: 'Ahmed Ali Khan', email: 'ahmed.ali@uom.edu.pk', rollNo: 'CS-2024-001', department: 'Computer Science', semester: 1 },
      { name: 'Muhammad Usman', email: 'usman@uom.edu.pk', rollNo: 'CS-2024-002', department: 'Computer Science', semester: 2 },
      { name: 'Bilal Ahmed', email: 'bilal.ahmed@uom.edu.pk', rollNo: 'CS-2024-003', department: 'Computer Science', semester: 3 },
      { name: 'Hassan Raza', email: 'hassan.raza@uom.edu.pk', rollNo: 'CS-2024-004', department: 'Computer Science', semester: 4 },
      { name: 'Omar Farooq', email: 'omar.farooq@uom.edu.pk', rollNo: 'EE-2024-001', department: 'Electrical Engineering', semester: 1 },
      { name: 'Ali Hassan', email: 'ali.hassan@uom.edu.pk', rollNo: 'EE-2024-002', department: 'Electrical Engineering', semester: 2 },
      { name: 'Zain Malik', email: 'zain.malik@uom.edu.pk', rollNo: 'EE-2024-003', department: 'Electrical Engineering', semester: 3 },
      { name: 'Hamza Sheikh', email: 'hamza.sheikh@uom.edu.pk', rollNo: 'ME-2024-001', department: 'Mechanical Engineering', semester: 1 },
      { name: 'Faisal Nawaz', email: 'faisal.nawaz@uom.edu.pk', rollNo: 'ME-2024-002', department: 'Mechanical Engineering', semester: 2 },
      { name: 'Imran Hussain', email: 'imran.hussain@uom.edu.pk', rollNo: 'ME-2024-003', department: 'Mechanical Engineering', semester: 4 },
      { name: 'Tariq Mahmood', email: 'tariq.mahmood@uom.edu.pk', rollNo: 'CE-2024-001', department: 'Civil Engineering', semester: 1 },
      { name: 'Kamran Yousuf', email: 'kamran.yousuf@uom.edu.pk', rollNo: 'CE-2024-002', department: 'Civil Engineering', semester: 3 },
      { name: 'Shahid Iqbal', email: 'shahid.iqbal@uom.edu.pk', rollNo: 'BBA-2024-001', department: 'Business Administration', semester: 2 },
      { name: 'Rashid Khan', email: 'rashid.khan@uom.edu.pk', rollNo: 'BBA-2024-002', department: 'Business Administration', semester: 4 },
      { name: 'Naveed Akhtar', email: 'naveed.akhtar@uom.edu.pk', rollNo: 'BBA-2024-003', department: 'Business Administration', semester: 6 },
      { name: 'Sajid Mehmood', email: 'sajid.mehmood@uom.edu.pk', rollNo: 'PHY-2024-001', department: 'Physics', semester: 1 },
      { name: 'Waqar Ahmed', email: 'waqar.ahmed@uom.edu.pk', rollNo: 'MATH-2024-001', department: 'Mathematics', semester: 2 },
      { name: 'Aslam Javed', email: 'aslam.javed@uom.edu.pk', rollNo: 'CHEM-2024-001', department: 'Chemistry', semester: 3 },
      { name: 'Farhan Ali', email: 'farhan.ali@uom.edu.pk', rollNo: 'CS-2024-005', department: 'Computer Science', semester: 5 },
      { name: 'Khurram Shahzad', email: 'khurram.shahzad@uom.edu.pk', rollNo: 'EE-2024-004', department: 'Electrical Engineering', semester: 5 },
      { name: 'Adeel Rauf', email: 'adeel.rauf@uom.edu.pk', rollNo: 'ME-2024-004', department: 'Mechanical Engineering', semester: 6 },
      { name: 'Zeeshan Abbasi', email: 'zeeshan.abbasi@uom.edu.pk', rollNo: 'CE-2024-003', department: 'Civil Engineering', semester: 5 },
      { name: 'Rizwan Ahmed', email: 'rizwan.ahmed@uom.edu.pk', rollNo: 'CS-2024-006', department: 'Computer Science', semester: 6 },
      { name: 'Amir Sultan', email: 'amir.sultan@uom.edu.pk', rollNo: 'EE-2024-005', department: 'Electrical Engineering', semester: 7 },
      { name: 'Danish Aziz', email: 'danish.aziz@uom.edu.pk', rollNo: 'BBA-2024-004', department: 'Business Administration', semester: 8 },
    ]

    const studentUsers = []
    for (let i = 0; i < studentData.length; i++) {
      const s = studentData[i]
      const user = await db.user.create({
        data: {
          name: s.name,
          email: s.email,
          password: Buffer.from('student123').toString('base64'),
          role: 'student',
          phone: `03${Math.floor(Math.random() * 4) + 1}${Math.floor(Math.random() * 10000000).toString().padStart(8, '0')}`,
        },
      })
      studentUsers.push({ ...s, userId: user.id, index: i })
    }

    // ==========================================
    // CREATE HOSTELS
    // ==========================================
    const hostelA = await db.hostel.create({
      data: {
        name: 'River Boy Hostel Block A',
        type: 'Boys',
        totalRooms: 15,
        address: 'University of Malakand, Chakdara, Lower Dir, KPK',
        description: 'Main hostel block for undergraduate students. Equipped with common room, mess hall, and study area.',
      },
    })

    const hostelB = await db.hostel.create({
      data: {
        name: 'River Boy Hostel Block B',
        type: 'Boys',
        totalRooms: 15,
        address: 'University of Malakand, Chakdara, Lower Dir, KPK',
        description: 'Secondary hostel block with renovated rooms and improved facilities.',
      },
    })

    const hostelC = await db.hostel.create({
      data: {
        name: 'River Boy Hostel Block C',
        type: 'Boys',
        totalRooms: 10,
        address: 'University of Malakand, Chakdara, Lower Dir, KPK',
        description: 'Premium block with enhanced amenities for senior students.',
      },
    })

    // ==========================================
    // CREATE ROOMS
    // ==========================================
    const roomsData: { id: string; hostelId: string; number: string; floor: number; capacity: number }[] = []

    // Block A: 15 rooms (floors 0-2, 5 rooms each)
    for (let floor = 0; floor < 3; floor++) {
      for (let room = 1; room <= 5; room++) {
        const capacity = room <= 2 ? 4 : room <= 4 ? 3 : 2
        const r = await db.room.create({
          data: {
            number: `A-${floor + 1}${room.toString().padStart(2, '0')}`,
            floor,
            capacity,
            hostelId: hostelA.id,
            status: 'Available',
          },
        })
        roomsData.push(r)
      }
    }

    // Block B: 15 rooms (floors 0-2, 5 rooms each)
    for (let floor = 0; floor < 3; floor++) {
      for (let room = 1; room <= 5; room++) {
        const capacity = room <= 2 ? 4 : room <= 4 ? 3 : 2
        const r = await db.room.create({
          data: {
            number: `B-${floor + 1}${room.toString().padStart(2, '0')}`,
            floor,
            capacity,
            hostelId: hostelB.id,
            status: 'Available',
          },
        })
        roomsData.push(r)
      }
    }

    // Block C: 10 rooms (floors 0-1, 5 rooms each)
    for (let floor = 0; floor < 2; floor++) {
      for (let room = 1; room <= 5; room++) {
        const capacity = room <= 2 ? 2 : room <= 4 ? 3 : 1
        const r = await db.room.create({
          data: {
            number: `C-${floor + 1}${room.toString().padStart(2, '0')}`,
            floor,
            capacity,
            hostelId: hostelC.id,
            status: 'Available',
          },
        })
        roomsData.push(r)
      }
    }

    // ==========================================
    // CREATE STUDENTS (assign some to rooms)
    // ==========================================
    const createdStudents = []
    for (let i = 0; i < studentUsers.length; i++) {
      const s = studentUsers[i]
      const assignRoom = i < 20 // First 20 students get rooms
      const roomId = assignRoom ? roomsData[i].id : null

      if (assignRoom && roomId) {
        // Update room occupancy
        const room = roomsData.find((r) => r.id === roomId)
        if (room) {
          const currentOccupants = createdStudents.filter((cs) => cs.roomId === roomId).length
          if (currentOccupants + 1 >= room.capacity) {
            await db.room.update({ where: { id: roomId }, data: { status: 'Occupied' } })
          }
        }
      }

      const student = await db.student.create({
        data: {
          userId: s.userId,
          rollNo: s.rollNo,
          department: s.department,
          semester: s.semester,
          roomId,
          guardianName: `Guardian of ${s.name.split(' ')[0]}`,
          guardianPhone: `0945-${Math.floor(Math.random() * 900000 + 100000)}`,
          address: i % 3 === 0 ? 'Swat, KPK' : i % 3 === 1 ? 'Dir Upper, KPK' : 'Chitral, KPK',
          bloodGroup: ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-'][i % 6],
          emergencyContact: `0945-${Math.floor(Math.random() * 900000 + 100000)}`,
          status: i < 22 ? 'Active' : i < 24 ? 'Inactive' : 'Graduated',
        },
      })
      createdStudents.push(student)
    }

    // ==========================================
    // CREATE STUDENT MOVEMENTS (5 sample records)
    // ==========================================
    const movementStatuses = ['Pending', 'Approved', 'Out', 'Returned', 'Late Return']
    const movementReasons = ['Going Home', 'Emergency Leave', 'University Work', 'Vacation', 'Medical Appointment']
    const movementDestinations = ['Swat, KPK', 'Dir Upper, KPK', 'Peshawar, KPK', 'Islamabad', 'Lahore, Punjab']

    for (let i = 0; i < 5; i++) {
      const student = createdStudents[i % createdStudents.length]
      const depDate = new Date()
      depDate.setDate(depDate.getDate() - (5 - i)) // past dates for most
      const retDate = new Date(depDate)
      retDate.setDate(retDate.getDate() + 2)
      retDate.setHours(retDate.getHours() + 4)

      const movementData: Record<string, unknown> = {
        studentId: student.id,
        reason: movementReasons[i],
        departureDate: depDate,
        expectedReturnDate: retDate,
        destination: movementDestinations[i],
        guardianContact: student.guardianPhone || `0945-${Math.floor(Math.random() * 900000 + 100000)}`,
        notes: i === 1 ? 'Family emergency, need to leave urgently.' : null,
        status: movementStatuses[i],
        approvedBy: movementStatuses[i] !== 'Pending' ? adminUser.name : null,
      }

      // Set additional fields based on status
      if (movementStatuses[i] === 'Returned') {
        const actualRet = new Date(retDate)
        actualRet.setHours(actualRet.getHours() - 2)
        movementData.actualReturnDate = actualRet
      } else if (movementStatuses[i] === 'Late Return') {
        const actualRet = new Date(retDate)
        actualRet.setDate(actualRet.getDate() + 1) // 1 day late
        actualRet.setHours(actualRet.getHours() + 3)
        movementData.actualReturnDate = actualRet
      }

      await db.studentMovement.create({ data: movementData })
    }

    // ==========================================
    // CREATE FEES (100+ records in PKR with 6 fee types)
    // ==========================================
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const feeTypes = ['Monthly Hostel Fee', 'Security Fee', 'Mess Fee', 'Maintenance Charges', 'Electricity Charges', 'Internet/WiFi Charges']
    const feeAmounts: Record<string, number[]> = {
      'Monthly Hostel Fee': [5000, 7000, 8000, 10000, 12000],
      'Security Fee': [3000, 5000],
      'Mess Fee': [4000, 5000, 5500, 6000],
      'Maintenance Charges': [1500, 2000, 2500],
      'Electricity Charges': [1000, 1500, 2000, 2500, 3000],
      'Internet/WiFi Charges': [500, 800, 1000],
    }
    const feeStatuses = ['Paid', 'Pending', 'Overdue', 'Partially Paid']
    const paymentMethods = ['Cash', 'Bank Transfer', 'EasyPaisa', 'JazzCash']

    const createdFees: { id: string; studentId: string; amount: number; status: string; feeType: string; month: string; year: number; lateFine: number; partiallyPaidAmount: number; paymentMethod: string | null }[] = []
    let feeCount = 0

    for (let i = 0; i < createdStudents.length && feeCount < 110; i++) {
      const student = createdStudents[i]
      if (student.status === 'Graduated') continue

      // Each active/inactive student gets 4-6 fee records
      const numFees = i < 12 ? 6 : i < 18 ? 5 : 4
      for (let j = 0; j < numFees && feeCount < 110; j++) {
        const feeType = feeTypes[j % feeTypes.length]
        const amounts = feeAmounts[feeType]
        const amount = amounts[Math.floor(Math.random() * amounts.length)]
        const monthIdx = (i + j) % 12
        const month = months[monthIdx]
        const year = j < 3 ? 2025 : 2024

        // Due date is 5th of the month
        const dueDate = new Date(year, monthIdx, 5)

        // Determine status with a realistic distribution
        let status: string
        if (j === 0) {
          status = 'Paid' // First fee is always paid
        } else if (j === 1) {
          status = i % 3 === 0 ? 'Pending' : 'Paid'
        } else if (j === 2) {
          status = i % 4 === 0 ? 'Overdue' : i % 3 === 0 ? 'Partially Paid' : 'Paid'
        } else if (j === 3) {
          status = i % 5 === 0 ? 'Overdue' : i % 3 === 0 ? 'Pending' : 'Paid'
        } else if (j === 4) {
          status = i % 2 === 0 ? 'Pending' : i % 3 === 0 ? 'Overdue' : 'Partially Paid'
        } else {
          status = i % 4 === 0 ? 'Paid' : i % 3 === 0 ? 'Overdue' : 'Pending'
        }

        // Late fine for overdue fees (50-500 PKR range, in multiples of 50)
        const lateFine = status === 'Overdue' ? (Math.floor(Math.random() * 10) + 1) * 50 : 0

        // Payment method for paid or partially paid
        const payMethod = (status === 'Paid' || status === 'Partially Paid') ? paymentMethods[Math.floor(Math.random() * paymentMethods.length)] : null

        // Partially paid amount
        const partiallyPaidAmount = status === 'Partially Paid' ? Math.floor(amount * (0.3 + Math.random() * 0.4)) : 0 // 30-70% of total

        // Paid date for paid fees
        const paidDate = status === 'Paid' ? new Date(year, monthIdx, Math.floor(Math.random() * 10) + 5) : status === 'Partially Paid' ? new Date(year, monthIdx, Math.floor(Math.random() * 10) + 8) : null

        // Receipt number for paid fees
        const receiptNo = status === 'Paid' ? `RCP-${year}${String(monthIdx + 1).padStart(2, '0')}-${Math.floor(Math.random() * 9000 + 1000)}` : null

        // Next due date for partially paid fees
        const nextDueDate = status === 'Partially Paid' ? new Date(year, monthIdx + 1, 5) : null

        const fee = await db.fee.create({
          data: {
            studentId: student.id,
            amount,
            month,
            year,
            feeType,
            status,
            dueDate,
            lateFine,
            paidDate,
            receiptNo,
            paymentMethod: payMethod,
            partiallyPaidAmount,
            nextDueDate,
          },
        })
        createdFees.push({
          id: fee.id,
          studentId: student.id,
          amount,
          status,
          feeType,
          month,
          year,
          lateFine,
          partiallyPaidAmount,
          paymentMethod: payMethod,
        })
        feeCount++
      }
    }

    // ==========================================
    // CREATE FEE STRUCTURES (7 records)
    // ==========================================
    const feeStructuresData = [
      { name: 'Monthly Hostel Fee - Standard', amount: 8000, feeType: 'Monthly Hostel Fee', description: 'Standard monthly hostel accommodation fee' },
      { name: 'Monthly Hostel Fee - Premium', amount: 12000, feeType: 'Monthly Hostel Fee', description: 'Premium room monthly hostel accommodation fee' },
      { name: 'Security Deposit', amount: 5000, feeType: 'Security Fee', description: 'One-time refundable security deposit' },
      { name: 'Mess Fee - Standard', amount: 5000, feeType: 'Mess Fee', description: 'Monthly mess/hall food charges' },
      { name: 'Maintenance Charges', amount: 2000, feeType: 'Maintenance Charges', description: 'Monthly building and facility maintenance' },
      { name: 'Electricity Charges', amount: 1500, feeType: 'Electricity Charges', description: 'Monthly electricity usage charges' },
      { name: 'Internet/WiFi', amount: 800, feeType: 'Internet/WiFi Charges', description: 'Monthly internet and WiFi access charges' },
    ]

    let feeStructureCount = 0
    for (const fs of feeStructuresData) {
      await db.feeStructure.create({
        data: {
          name: fs.name,
          amount: fs.amount,
          feeType: fs.feeType,
          description: fs.description,
          isActive: true,
        },
      })
      feeStructureCount++
    }

    // ==========================================
    // CREATE LATE FINE CONFIG (1 default record)
    // ==========================================
    await db.lateFineConfig.create({
      data: {
        gracePeriodDays: 5,
        finePerDay: 50,
        maxFine: 2000,
        isActive: true,
      },
    })
    const lateFineConfigCount = 1

    // ==========================================
    // CREATE PAYMENTS (30-40 records for paid/partially paid fees)
    // ==========================================
    const paidFees = createdFees.filter(f => f.status === 'Paid' || f.status === 'Partially Paid')
    let paymentCount = 0

    for (let i = 0; i < paidFees.length && paymentCount < 40; i++) {
      const fee = paidFees[i]
      const isPaid = fee.status === 'Paid'

      if (isPaid) {
        // Single full payment for paid fees
        const isVerified = i % 5 !== 0 // 80% verified
        await db.payment.create({
          data: {
            feeId: fee.id,
            amount: fee.amount + fee.lateFine,
            paymentMethod: fee.paymentMethod!,
            referenceNo: fee.paymentMethod !== 'Cash' ? `TXN-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}` : null,
            paidBy: `Self`,
            verifiedBy: isVerified ? adminUser.name : null,
            verifiedAt: isVerified ? new Date(fee.year, months.indexOf(fee.month), Math.floor(Math.random() * 10) + 6) : null,
            status: isVerified ? 'Verified' : 'Pending',
            notes: null,
          },
        })
        paymentCount++
      } else {
        // Partial payment for partially paid fees
        const isVerified = i % 3 === 0
        await db.payment.create({
          data: {
            feeId: fee.id,
            amount: fee.partiallyPaidAmount,
            paymentMethod: fee.paymentMethod!,
            referenceNo: fee.paymentMethod !== 'Cash' ? `TXN-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}` : null,
            paidBy: `Self`,
            verifiedBy: isVerified ? adminUser.name : null,
            verifiedAt: isVerified ? new Date(fee.year, months.indexOf(fee.month), Math.floor(Math.random() * 10) + 10) : null,
            status: isVerified ? 'Verified' : 'Pending',
            notes: 'Partial payment - first installment',
          },
        })
        paymentCount++
      }
    }

    // ==========================================
    // CREATE APPLICATIONS (5-8 pending)
    // ==========================================
    const applicationMessages = [
      'I need accommodation near my department for the upcoming semester.',
      'I am a new student and require hostel accommodation.',
      'My current room has maintenance issues, requesting transfer.',
      'I would like to move to a block closer to the library.',
      'Requesting hostel accommodation as my current lease is ending.',
      'I am a transferred student from another campus and need housing.',
      'Please consider my application for the premium block.',
      'I need a room with better study facilities.',
    ]

    for (let i = 0; i < 8; i++) {
      const studentIdx = 20 + (i % 5) // Use students without rooms + some with
      if (studentIdx >= createdStudents.length) continue
      const student = createdStudents[studentIdx]
      const hostels = [hostelA, hostelB, hostelC]
      const hostel = hostels[i % 3]
      const statuses = ['Pending', 'Pending', 'Pending', 'Pending', 'Pending', 'Approved', 'Rejected', 'Pending']

      await db.application.create({
        data: {
          studentId: student.id,
          hostelId: hostel.id,
          preferredRoom: i % 2 === 0 ? `${hostel.name.charAt(0)}-${Math.floor(Math.random() * 3) + 1}${String(Math.floor(Math.random() * 5) + 1).padStart(2, '0')}` : null,
          message: applicationMessages[i],
          status: statuses[i],
          adminRemark: statuses[i] === 'Approved' ? 'Approved by admin. Room allocated.' : statuses[i] === 'Rejected' ? 'No rooms available currently.' : null,
        },
      })
    }

    // ==========================================
    // CREATE COMPLAINTS (8-10)
    // ==========================================
    const complaintsData = [
      { title: 'Water supply interruption', description: 'No water supply in the bathroom since 2 days. Please fix urgently.', category: 'Plumbing', priority: 'High' },
      { title: 'AC not working', description: 'The air conditioner in room is not functioning properly. It makes loud noise.', category: 'Electrical', priority: 'High' },
      { title: 'Unclean corridor', description: 'The corridor on the second floor has not been cleaned for a week.', category: 'Cleaning', priority: 'Medium' },
      { title: 'WiFi connectivity issues', description: 'Internet is very slow and keeps disconnecting, especially during evening hours.', category: 'Internet', priority: 'Medium' },
      { title: 'Broken window', description: 'The window in my room is cracked and needs replacement.', category: 'Other', priority: 'Low' },
      { title: 'Hot water not available', description: 'Geyser is not working, no hot water for morning prayers.', category: 'Plumbing', priority: 'High' },
      { title: 'Ceiling leak during rain', description: 'Water leaks from the ceiling whenever it rains. Damaging my books.', category: 'Plumbing', priority: 'High' },
      { title: 'Noisy neighbors', description: 'Students in adjacent room play loud music late at night disturbing studies.', category: 'Other', priority: 'Medium' },
      { title: 'Electrical socket sparking', description: 'One of the wall sockets sparks when plugging in devices. Safety hazard.', category: 'Electrical', priority: 'High' },
      { title: 'Pest problem in room', description: 'There are cockroaches and ants in the room. Need pest control.', category: 'Cleaning', priority: 'Medium' },
    ]

    const complaintStatuses = ['Open', 'In Progress', 'Resolved', 'Open', 'In Progress', 'Open', 'Resolved', 'Open', 'In Progress', 'Open']
    const adminReplies = [null, 'Maintenance team assigned. Will be fixed within 2 days.', 'Issue resolved. Plumbing fixed.', null, 'Electrician scheduled for tomorrow.', null, 'Ceiling repaired and waterproofed.', null, 'Electrician visiting today.', null]

    for (let i = 0; i < complaintsData.length; i++) {
      const c = complaintsData[i]
      await db.complaint.create({
        data: {
          studentId: createdStudents[i % createdStudents.length].id,
          title: c.title,
          description: c.description,
          category: c.category,
          priority: c.priority,
          status: complaintStatuses[i],
          adminReply: adminReplies[i],
        },
      })
    }

    // ==========================================
    // CREATE NOTICES (8)
    // ==========================================
    const noticesData = [
      { title: 'Hostel Registration 2025-26', content: 'All students are required to complete their hostel registration for the academic year 2025-26 by March 15, 2025. Late registrations will not be entertained. Please submit your forms to the hostel office.', category: 'General', priority: 'Important' },
      { title: 'Water Supply Maintenance', content: 'Water supply will be temporarily suspended on February 20, 2025 from 8:00 AM to 2:00 PM for tank cleaning and maintenance. Please store water accordingly.', category: 'Maintenance', priority: 'Urgent' },
      { title: 'Annual Sports Week', content: 'Annual Sports Week will be held from March 1-7, 2025. All hostel residents are encouraged to participate. Registration forms available at the common room.', category: 'Event', priority: 'Normal' },
      { title: 'Fee Payment Deadline', content: 'Last date for fee payment for the current semester is February 28, 2025. Students with outstanding dues will not be allowed to sit in exams. Contact the accounts office for details.', category: 'General', priority: 'Important' },
      { title: 'Emergency Fire Drill', content: 'An emergency fire drill will be conducted on February 25, 2025 at 10:00 AM. All residents must evacuate the building when the alarm sounds. This is mandatory for all students.', category: 'Emergency', priority: 'Urgent' },
      { title: 'Mess Menu Update', content: 'The mess committee has updated the weekly menu effective from March 1, 2025. New items have been added based on student feedback. Check the notice board for details.', category: 'General', priority: 'Normal' },
      { title: 'Room Inspection Schedule', content: 'Quarterly room inspection will be conducted from March 10-15, 2025. All rooms must be clean and tidy. Students will be penalized for unsatisfactory conditions.', category: 'Maintenance', priority: 'Important' },
      { title: 'Eid Holidays Notice', content: 'Hostel will remain open during Eid holidays. Students staying back must inform the warden office by March 20, 2025. Mess timings will be adjusted during the holiday period.', category: 'Event', priority: 'Normal' },
    ]

    for (const n of noticesData) {
      await db.notice.create({
        data: {
          title: n.title,
          content: n.content,
          category: n.category,
          priority: n.priority,
          createdBy: adminUser.name,
        },
      })
    }

    // ==========================================
    // CREATE STAFF (8-10)
    // ==========================================
    const staffData = [
      { name: 'Malik Abdul Rashid', role: 'Warden', phone: '0300-5551234', hostelId: hostelA.id, salary: 45000, status: 'Active' },
      { name: 'Ghulam Mustafa', role: 'Warden', phone: '0301-5552345', hostelId: hostelB.id, salary: 45000, status: 'Active' },
      { name: 'Sirajuddin', role: 'Warden', phone: '0302-5553456', hostelId: hostelC.id, salary: 42000, status: 'Active' },
      { name: 'Nasir Khan', role: 'Clerk', phone: '0303-5554567', hostelId: hostelA.id, salary: 30000, status: 'Active' },
      { name: 'Zahid Hussain', role: 'Security', phone: '0304-5555678', hostelId: hostelA.id, salary: 25000, status: 'Active' },
      { name: 'Mukhtiar Ahmad', role: 'Security', phone: '0305-5556789', hostelId: hostelB.id, salary: 25000, status: 'Active' },
      { name: 'Rahim Dad', role: 'Cleaner', phone: '0306-5557890', hostelId: hostelA.id, salary: 20000, status: 'Active' },
      { name: 'Fazal Wahab', role: 'Cleaner', phone: '0307-5558901', hostelId: hostelB.id, salary: 20000, status: 'On Leave' },
      { name: 'Irfan Ullah', role: 'Electrician', phone: '0308-5559012', hostelId: hostelA.id, salary: 28000, status: 'Active' },
      { name: 'Sadiq Ali', role: 'Plumber', phone: '0309-5550123', hostelId: hostelB.id, salary: 27000, status: 'Active' },
    ]

    for (const s of staffData) {
      await db.staff.create({
        data: {
          name: s.name,
          role: s.role,
          phone: s.phone,
          hostelId: s.hostelId,
          salary: s.salary,
          joinDate: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          status: s.status,
        },
      })
    }

    // ==========================================
    // CREATE MAINTENANCE REQUESTS (5-8)
    // ==========================================
    const maintenanceData = [
      { title: 'Broken ceiling fan', description: 'Ceiling fan in room is not working and making rattling noise. Needs immediate replacement.', category: 'Electrical', priority: 'High', roomIdx: 0 },
      { title: 'Leaking tap in bathroom', description: 'The bathroom tap has been leaking continuously. Wasting a lot of water.', category: 'Plumbing', priority: 'Medium', roomIdx: 5 },
      { title: 'Broken bed frame', description: 'The wooden bed frame is broken and sagging in the middle. Difficult to sleep.', category: 'Furniture', priority: 'Medium', roomIdx: 10 },
      { title: 'AC gas refilling needed', description: 'Air conditioner needs gas refilling. Room gets very hot during afternoon.', category: 'AC', priority: 'High', roomIdx: 15 },
      { title: 'Bathroom cleaning required', description: 'Common bathroom on the floor needs deep cleaning and disinfection.', category: 'Cleaning', priority: 'Low', roomIdx: 20 },
      { title: 'Window latch broken', description: 'Window latch is broken and window cannot be closed properly. Security concern.', category: 'Furniture', priority: 'Medium', roomIdx: 8 },
      { title: 'Electrical wiring issue', description: 'Lights flicker when using multiple appliances. Possible wiring issue.', category: 'Electrical', priority: 'High', roomIdx: 25 },
      { title: 'Hot water geyser repair', description: 'Geyser is not heating water. Needs repair before winter gets severe.', category: 'Plumbing', priority: 'High', roomIdx: 30 },
    ]

    const maintenanceStatuses = ['In Progress', 'Pending', 'Completed', 'Pending', 'In Progress', 'Pending', 'Completed', 'Pending']

    for (let i = 0; i < maintenanceData.length; i++) {
      const m = maintenanceData[i]
      const roomIdx = Math.min(m.roomIdx, roomsData.length - 1)
      await db.maintenanceRequest.create({
        data: {
          roomId: roomsData[roomIdx].id,
          studentId: createdStudents[i % createdStudents.length].id,
          title: m.title,
          description: m.description,
          category: m.category,
          priority: m.priority,
          status: maintenanceStatuses[i],
        },
      })
    }

    // ==========================================
    // CREATE NOTIFICATIONS (Enhanced with categories & priorities)
    // ==========================================
    const studentNotificationTemplates = [
      { title: 'Fee Payment Due', message: 'Your monthly hostel fee of Rs. 5,000 is due by March 15, 2025. Please pay before the deadline to avoid late charges of Rs. 500.', type: 'warning', category: 'Payments', priority: 'Important' },
      { title: 'Fee Payment Successful', message: 'Your fee payment of Rs. 7,500 for Room Rent has been received successfully. Receipt: RCP-202503-4521.', type: 'success', category: 'Payments', priority: 'Normal' },
      { title: 'Leave Request Approved', message: 'Your leave request for March 10-12 has been approved by the warden. Please ensure timely return.', type: 'info', category: 'Leave', priority: 'Normal' },
      { title: 'Leave Request Rejected', message: 'Your leave request has been rejected due to pending fee dues. Please clear your dues before applying for leave.', type: 'error', category: 'Leave', priority: 'Important' },
      { title: 'Complaint Update', message: 'Your complaint "Water supply interruption" has been assigned to the maintenance team. Expected resolution: 2 days.', type: 'info', category: 'Complaints', priority: 'Normal' },
      { title: 'Emergency Fire Drill', message: 'EMERGENCY: Fire drill scheduled for February 25 at 10:00 AM. All students must evacuate immediately when alarm sounds. This is mandatory.', type: 'error', category: 'Announcements', priority: 'Emergency' },
      { title: 'Room Allocation Update', message: 'Your room has been changed from A-101 to B-201 due to maintenance in Block A. Please collect new keys from the office.', type: 'info', category: 'Announcements', priority: 'Important' },
      { title: 'Late Return Warning', message: 'Your expected return date was March 8. You are now 2 days overdue. Please mark your return immediately to avoid penalties.', type: 'warning', category: 'Leave', priority: 'Critical' },
      { title: 'Maintenance Scheduled', message: 'Plumbing maintenance in your block scheduled for March 5, 9 AM - 2 PM. Water supply will be temporarily unavailable.', type: 'info', category: 'Maintenance', priority: 'Important' },
      { title: 'Maintenance Completed', message: 'The electrical repair in your block has been completed. All power outlets are now functional.', type: 'success', category: 'Maintenance', priority: 'Normal' },
      { title: 'Hostel Announcement', message: 'Mess timing has been changed starting next week. Breakfast: 7-9 AM, Lunch: 12-2 PM, Dinner: 7-9 PM.', type: 'info', category: 'Announcements', priority: 'Normal' },
      { title: 'Fee Overdue Alert', message: 'Your fee of Rs. 10,000 is overdue by 15 days. Late fee of Rs. 1,000 has been applied. Please pay immediately.', type: 'error', category: 'Payments', priority: 'Critical' },
    ]

    const adminNotificationTemplates = [
      { title: 'New Student Registration', message: 'A new student Ahmed Ali Khan (CS-2024-001) has registered and is awaiting room allocation.', type: 'info', category: 'Announcements', priority: 'Important' },
      { title: 'Pending Leave Approvals', message: 'You have 3 pending leave requests awaiting your approval. Please review them at the earliest.', type: 'warning', category: 'Leave', priority: 'Important' },
      { title: 'Late Fee Alert', message: '5 students have overdue fees totaling Rs. 45,000. Follow-up actions may be required.', type: 'warning', category: 'Payments', priority: 'Critical' },
      { title: 'Emergency Complaint', message: 'Emergency complaint received: "Electrical socket sparking" in Room A-101. Immediate attention required.', type: 'error', category: 'Complaints', priority: 'Emergency' },
      { title: 'Student Late Return', message: 'Student Hassan Raza (CS-2024-004) has not returned from leave. Expected return was 2 days ago.', type: 'warning', category: 'Leave', priority: 'Critical' },
      { title: 'New Maintenance Request', message: 'New maintenance request submitted for Room B-202: "AC not working". Priority: High.', type: 'info', category: 'Maintenance', priority: 'Important' },
      { title: 'New Complaint Submitted', message: 'A new complaint has been submitted by Muhammad Usman regarding WiFi connectivity issues.', type: 'info', category: 'Complaints', priority: 'Normal' },
      { title: 'Room Occupancy Change', message: 'Room A-101 has reached full occupancy (4/4 students). Room status updated to Occupied.', type: 'info', category: 'Announcements', priority: 'Normal' },
    ]

    // Notifications for admin
    for (const template of adminNotificationTemplates) {
      const daysAgo = Math.floor(Math.random() * 7)
      const createdAt = new Date()
      createdAt.setDate(createdAt.getDate() - daysAgo)
      createdAt.setHours(createdAt.getHours() - Math.floor(Math.random() * 12))
      await db.notification.create({
        data: {
          userId: adminUser.id,
          title: template.title,
          message: template.message,
          type: template.type,
          category: template.category,
          priority: template.priority,
          read: daysAgo > 2,
          senderName: 'System',
          createdAt,
        },
      })
    }

    // Notifications for warden
    for (const template of adminNotificationTemplates.slice(0, 4)) {
      await db.notification.create({
        data: {
          userId: wardenUser.id,
          title: template.title,
          message: template.message,
          type: template.type,
          category: template.category,
          priority: template.priority,
          read: true,
          senderName: 'System',
        },
      })
    }

    // Notifications for students (rich variety)
    for (let i = 0; i < studentUsers.length; i++) {
      const numNotifs = i < 10 ? 4 : i < 20 ? 3 : 2
      for (let j = 0; j < numNotifs; j++) {
        const template = studentNotificationTemplates[(i + j) % studentNotificationTemplates.length]
        const daysAgo = Math.floor(Math.random() * 7)
        const createdAt = new Date()
        createdAt.setDate(createdAt.getDate() - daysAgo)
        createdAt.setHours(createdAt.getHours() - Math.floor(Math.random() * 12))
        await db.notification.create({
          data: {
            userId: studentUsers[i].userId,
            title: template.title,
            message: template.message,
            type: template.type,
            category: template.category,
            priority: template.priority,
            read: j === 0 || daysAgo > 3,
            senderName: j === numNotifs - 1 ? 'Admin Warden' : 'System',
            createdAt,
          },
        })
      }
    }

    // ==========================================
    // CREATE ANNOUNCEMENTS
    // ==========================================
    const announcementsData = [
      { title: 'Hostel Registration 2025-26', content: 'All students are required to complete their hostel registration for the academic year 2025-26 by March 15, 2025. Late registrations will not be entertained. Please submit your forms to the hostel office.', category: 'General', priority: 'Important', type: 'Notice', targetRole: 'student' },
      { title: 'Emergency Fire Drill', content: 'An emergency fire drill will be conducted on February 25, 2025 at 10:00 AM. All residents must evacuate the building when the alarm sounds. This is mandatory for all students.', category: 'Emergency', priority: 'Emergency', type: 'Emergency Broadcast', targetRole: 'all' },
      { title: 'Water Supply Maintenance', content: 'Water supply will be temporarily suspended on February 20, 2025 from 8:00 AM to 2:00 PM for tank cleaning and maintenance. Please store water accordingly.', category: 'Maintenance', priority: 'Urgent', type: 'Maintenance Alert', targetRole: 'all' },
      { title: 'Annual Sports Week', content: 'Annual Sports Week will be held from March 1-7, 2025. All hostel residents are encouraged to participate. Registration forms available at the common room.', category: 'Event', priority: 'Normal', type: 'Notice', targetRole: 'student' },
      { title: 'Fee Payment Deadline', content: 'Last date for fee payment for the current semester is February 28, 2025. Students with outstanding dues will not be allowed to sit in exams. Contact the accounts office for details.', category: 'General', priority: 'Important', type: 'Notice', targetRole: 'student' },
    ]

    for (const a of announcementsData) {
      await db.announcement.create({
        data: {
          title: a.title,
          content: a.content,
          category: a.category,
          priority: a.priority,
          type: a.type,
          targetRole: a.targetRole,
          isActive: true,
          createdBy: adminUser.name,
          createdById: adminUser.id,
        },
      })
    }

    // ==========================================
    // CREATE VISITORS (8 sample records)
    // ==========================================
    const visitorsData = [
      { visitorName: 'Abdul Wahab Khan', cnic: '15602-1234567-1', contactNumber: '0300-9876543', relationWithStudent: 'Father', visitPurpose: 'Personal Visit', status: 'Checked Out', studentIdx: 0 },
      { visitorName: 'Fatima Bibi', cnic: '15602-2345678-2', contactNumber: '0301-8765432', relationWithStudent: 'Mother', visitPurpose: 'Family Gathering', status: 'Checked In', studentIdx: 1 },
      { visitorName: 'Imran Ali', cnic: '15602-3456789-3', contactNumber: '0302-7654321', relationWithStudent: 'Brother', visitPurpose: 'Academic Discussion', status: 'Approved', studentIdx: 2 },
      { visitorName: 'Dr. Sarah Ahmed', cnic: '15602-4567890-4', contactNumber: '0303-6543210', relationWithStudent: 'Friend', visitPurpose: 'Medical Emergency', status: 'Pending', studentIdx: 3 },
      { visitorName: 'Ghulam Nabi', cnic: '15602-5678901-5', contactNumber: '0304-5432109', relationWithStudent: 'Uncle', visitPurpose: 'Document Delivery', status: 'Pending', studentIdx: 4 },
      { visitorName: 'Zainab Khatoon', cnic: '15602-6789012-6', contactNumber: '0305-4321098', relationWithStudent: 'Aunt', visitPurpose: 'Personal Visit', status: 'Rejected', studentIdx: 5 },
      { visitorName: 'Muhammad Aslam', cnic: '15602-7890123-7', contactNumber: '0306-3210987', relationWithStudent: 'Father', visitPurpose: 'Family Gathering', status: 'Checked Out', studentIdx: 6 },
      { visitorName: 'Khalid Mehmood', cnic: '15602-8901234-8', contactNumber: '0307-2109876', relationWithStudent: 'Cousin', visitPurpose: 'Personal Visit', status: 'Pending', studentIdx: 7 },
    ]

    for (let i = 0; i < visitorsData.length; i++) {
      const v = visitorsData[i]
      const student = createdStudents[v.studentIdx]
      const visitDate = new Date()
      visitDate.setDate(visitDate.getDate() - Math.floor(Math.random() * 3))

      const visitorRecord: Record<string, unknown> = {
        visitorName: v.visitorName,
        cnic: v.cnic,
        contactNumber: v.contactNumber,
        relationWithStudent: v.relationWithStudent,
        studentId: student.id,
        roomId: student.roomId,
        visitPurpose: v.visitPurpose,
        visitDate: visitDate,
        status: v.status,
        approvedBy: v.status !== 'Pending' ? adminUser.name : null,
        adminRemark: v.status === 'Rejected' ? 'Visitor policy violation. No visitors allowed during exam period.' : v.status === 'Approved' ? 'Approved. Valid ID required at entry.' : null,
      }

      // Set entry/exit times based on status
      if (v.status === 'Checked In') {
        const entryTime = new Date(visitDate)
        entryTime.setHours(10, 30)
        visitorRecord.entryTime = entryTime
      } else if (v.status === 'Checked Out') {
        const entryTime = new Date(visitDate)
        entryTime.setHours(10, 0)
        const exitTime = new Date(visitDate)
        exitTime.setHours(16, 30)
        visitorRecord.entryTime = entryTime
        visitorRecord.exitTime = exitTime
      }

      await db.visitor.create({ data: visitorRecord })
    }

    return NextResponse.json({
      message: 'Database seeded successfully!',
      data: {
        users: 2 + studentUsers.length,
        hostels: 3,
        rooms: roomsData.length,
        students: createdStudents.length,
        movements: 5,
        fees: feeCount,
        feeStructures: feeStructureCount,
        lateFineConfig: lateFineConfigCount,
        payments: paymentCount,
        complaints: complaintsData.length,
        notices: noticesData.length,
        staff: staffData.length,
        maintenanceRequests: maintenanceData.length,
        visitors: visitorsData.length,
      },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Failed to seed database', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
