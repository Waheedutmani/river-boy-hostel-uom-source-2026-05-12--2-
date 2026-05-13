import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('Clearing existing data...')
  await db.notification.deleteMany()
  await db.studentMovement.deleteMany()
  await db.maintenanceRequest.deleteMany()
  await db.application.deleteMany()
  await db.complaint.deleteMany()
  await db.fee.deleteMany()
  await db.student.deleteMany()
  await db.staff.deleteMany()
  await db.room.deleteMany()
  await db.hostel.deleteMany()
  await db.user.deleteMany()

  console.log('Creating admin user...')
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

  console.log('Creating student users...')
  const studentUsers: { name: string; email: string; rollNo: string; department: string; semester: number; userId: string; index: number }[] = []
  for (let i = 0; i < studentData.length; i++) {
    const s = studentData[i]
    const user = await db.user.create({
      data: {
        name: s.name,
        email: s.email,
        password: Buffer.from('student123').toString('base64'),
        role: 'student',
        phone: '03' + (Math.floor(Math.random() * 4) + 1) + Math.floor(Math.random() * 10000000).toString().padStart(8, '0'),
      },
    })
    studentUsers.push({ ...s, userId: user.id, index: i })
  }
  console.log('Created', studentUsers.length, 'student users')

  console.log('Creating hostels...')
  const hostelA = await db.hostel.create({
    data: { name: 'River Boy Hostel Block A', type: 'Boys', totalRooms: 15, address: 'University of Malakand, Chakdara, Lower Dir, KPK', description: 'Main hostel block for undergraduate students.' },
  })
  const hostelB = await db.hostel.create({
    data: { name: 'River Boy Hostel Block B', type: 'Boys', totalRooms: 15, address: 'University of Malakand, Chakdara, Lower Dir, KPK', description: 'Secondary hostel block with renovated rooms.' },
  })
  const hostelC = await db.hostel.create({
    data: { name: 'River Boy Hostel Block C', type: 'Boys', totalRooms: 10, address: 'University of Malakand, Chakdara, Lower Dir, KPK', description: 'Premium block with enhanced amenities.' },
  })

  console.log('Creating rooms...')
  const roomsData: { id: string; hostelId: string; number: string; floor: number; capacity: number }[] = []
  for (let floor = 0; floor < 3; floor++) {
    for (let room = 1; room <= 5; room++) {
      const capacity = room <= 2 ? 4 : room <= 4 ? 3 : 2
      const r = await db.room.create({ data: { number: `A-${floor + 1}${room.toString().padStart(2, '0')}`, floor, capacity, hostelId: hostelA.id, status: 'Available' } })
      roomsData.push(r)
    }
  }
  for (let floor = 0; floor < 3; floor++) {
    for (let room = 1; room <= 5; room++) {
      const capacity = room <= 2 ? 4 : room <= 4 ? 3 : 2
      const r = await db.room.create({ data: { number: `B-${floor + 1}${room.toString().padStart(2, '0')}`, floor, capacity, hostelId: hostelB.id, status: 'Available' } })
      roomsData.push(r)
    }
  }
  for (let floor = 0; floor < 2; floor++) {
    for (let room = 1; room <= 5; room++) {
      const capacity = room <= 2 ? 2 : room <= 4 ? 3 : 1
      const r = await db.room.create({ data: { number: `C-${floor + 1}${room.toString().padStart(2, '0')}`, floor, capacity, hostelId: hostelC.id, status: 'Available' } })
      roomsData.push(r)
    }
  }

  console.log('Creating students...')
  const createdStudents: { id: string; roomId: string | null; status: string }[] = []
  for (let i = 0; i < studentUsers.length; i++) {
    const s = studentUsers[i]
    const assignRoom = i < 20
    const roomId = assignRoom ? roomsData[i].id : null
    if (assignRoom && roomId) {
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
        userId: s.userId, rollNo: s.rollNo, department: s.department, semester: s.semester, roomId,
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

  console.log('Creating fees...')
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const feeTypes = ['Room Rent', 'Mess Fee', 'Electricity']
  const feeAmounts: Record<string, number[]> = { 'Room Rent': [5000, 7500, 10000, 12500, 15000], 'Mess Fee': [4000, 5000, 5500, 6000], 'Electricity': [1000, 1500, 2000, 2500, 3000] }
  const feeStatuses = ['Paid', 'Pending', 'Overdue']
  let feeCount = 0
  for (let i = 0; i < createdStudents.length && feeCount < 80; i++) {
    const student = createdStudents[i]
    if (student.status === 'Graduated') continue
    const numFees = i < 15 ? 4 : 3
    for (let j = 0; j < numFees && feeCount < 80; j++) {
      const feeType = feeTypes[j % feeTypes.length]
      const amounts = feeAmounts[feeType]
      const amount = amounts[Math.floor(Math.random() * amounts.length)]
      const month = months[(i + j) % 12]
      const year = j < 2 ? 2025 : 2024
      const statusIndex = j === 0 ? 0 : j === 1 ? (i % 3 === 0 ? 1 : 0) : (i % 4 === 0 ? 2 : i % 2 === 0 ? 1 : 0)
      const status = feeStatuses[statusIndex]
      await db.fee.create({
        data: {
          studentId: student.id, amount, month, year, feeType, status,
          paidDate: status === 'Paid' ? new Date(year, (i + j) % 12, Math.floor(Math.random() * 28) + 1) : null,
          receiptNo: status === 'Paid' ? `RCP-${year}${String((i + j) % 12 + 1).padStart(2, '0')}-${Math.floor(Math.random() * 9000 + 1000)}` : null,
        },
      })
      feeCount++
    }
  }

  console.log('Creating applications...')
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
    const studentIdx = 20 + (i % 5)
    if (studentIdx >= createdStudents.length) continue
    const student = createdStudents[studentIdx]
    const hostels = [hostelA, hostelB, hostelC]
    const hostel = hostels[i % 3]
    const statuses = ['Pending', 'Pending', 'Pending', 'Pending', 'Pending', 'Approved', 'Rejected', 'Pending']
    await db.application.create({
      data: {
        studentId: student.id, hostelId: hostel.id,
        preferredRoom: i % 2 === 0 ? `${hostel.name.charAt(0)}-${Math.floor(Math.random() * 3) + 1}${String(Math.floor(Math.random() * 5) + 1).padStart(2, '0')}` : null,
        message: applicationMessages[i], status: statuses[i],
        adminRemark: statuses[i] === 'Approved' ? 'Approved by admin.' : statuses[i] === 'Rejected' ? 'No rooms available.' : null,
      },
    })
  }

  console.log('Creating complaints...')
  const complaintsData = [
    { title: 'Water supply interruption', description: 'No water supply in the bathroom since 2 days.', category: 'Plumbing', priority: 'High' },
    { title: 'AC not working', description: 'The air conditioner is not functioning properly.', category: 'Electrical', priority: 'High' },
    { title: 'Unclean corridor', description: 'The corridor has not been cleaned for a week.', category: 'Cleaning', priority: 'Medium' },
    { title: 'WiFi connectivity issues', description: 'Internet is very slow and keeps disconnecting.', category: 'Internet', priority: 'Medium' },
    { title: 'Broken window', description: 'The window in my room is cracked.', category: 'Other', priority: 'Low' },
    { title: 'Hot water not available', description: 'Geyser is not working, no hot water.', category: 'Plumbing', priority: 'High' },
    { title: 'Ceiling leak during rain', description: 'Water leaks from the ceiling when it rains.', category: 'Plumbing', priority: 'High' },
    { title: 'Noisy neighbors', description: 'Students play loud music late at night.', category: 'Other', priority: 'Medium' },
    { title: 'Electrical socket sparking', description: 'Wall sockets spark when plugging in devices.', category: 'Electrical', priority: 'High' },
    { title: 'Pest problem in room', description: 'Cockroaches and ants in the room.', category: 'Cleaning', priority: 'Medium' },
  ]
  const complaintStatuses = ['Open', 'In Progress', 'Resolved', 'Open', 'In Progress', 'Open', 'Resolved', 'Open', 'In Progress', 'Open']
  const adminReplies: (string | null)[] = [null, 'Maintenance team assigned.', 'Issue resolved.', null, 'Electrician scheduled.', null, 'Ceiling repaired.', null, 'Electrician visiting today.', null]
  for (let i = 0; i < complaintsData.length; i++) {
    await db.complaint.create({
      data: { studentId: createdStudents[i % createdStudents.length].id, ...complaintsData[i], status: complaintStatuses[i], adminReply: adminReplies[i] },
    })
  }

  console.log('Creating notices...')
  const noticesData = [
    { title: 'Hostel Registration 2025-26', content: 'All students are required to complete their hostel registration for the academic year 2025-26 by March 15, 2025.', category: 'General', priority: 'Important' },
    { title: 'Water Supply Maintenance', content: 'Water supply will be temporarily suspended on February 20, 2025 from 8:00 AM to 2:00 PM.', category: 'Maintenance', priority: 'Urgent' },
    { title: 'Annual Sports Week', content: 'Annual Sports Week will be held from March 1-7, 2025. All hostel residents are encouraged to participate.', category: 'Event', priority: 'Normal' },
    { title: 'Fee Payment Deadline', content: 'Last date for fee payment for the current semester is February 28, 2025.', category: 'General', priority: 'Important' },
    { title: 'Emergency Fire Drill', content: 'An emergency fire drill will be conducted on February 25, 2025 at 10:00 AM.', category: 'Emergency', priority: 'Urgent' },
    { title: 'Mess Menu Update', content: 'The mess committee has updated the weekly menu effective from March 1, 2025.', category: 'General', priority: 'Normal' },
    { title: 'Room Inspection Schedule', content: 'Quarterly room inspection will be conducted from March 10-15, 2025.', category: 'Maintenance', priority: 'Important' },
    { title: 'Eid Holidays Notice', content: 'Hostel will remain open during Eid holidays. Students staying back must inform the warden office.', category: 'Event', priority: 'Normal' },
  ]
  for (const n of noticesData) {
    await db.notice.create({ data: { title: n.title, content: n.content, category: n.category, priority: n.priority, createdBy: adminUser.name } })
  }

  console.log('Creating staff...')
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
    await db.staff.create({ data: { name: s.name, role: s.role, phone: s.phone, hostelId: s.hostelId, salary: s.salary, joinDate: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1), status: s.status } })
  }

  console.log('Creating maintenance requests...')
  const maintenanceData = [
    { title: 'Broken ceiling fan', description: 'Ceiling fan not working and making rattling noise.', category: 'Electrical', priority: 'High', roomIdx: 0 },
    { title: 'Leaking tap in bathroom', description: 'Bathroom tap has been leaking continuously.', category: 'Plumbing', priority: 'Medium', roomIdx: 5 },
    { title: 'Broken bed frame', description: 'Wooden bed frame is broken and sagging.', category: 'Furniture', priority: 'Medium', roomIdx: 10 },
    { title: 'AC gas refilling needed', description: 'Air conditioner needs gas refilling.', category: 'AC', priority: 'High', roomIdx: 15 },
    { title: 'Bathroom cleaning required', description: 'Common bathroom needs deep cleaning.', category: 'Cleaning', priority: 'Low', roomIdx: 20 },
    { title: 'Window latch broken', description: 'Window latch broken, cannot close properly.', category: 'Furniture', priority: 'Medium', roomIdx: 8 },
    { title: 'Electrical wiring issue', description: 'Lights flicker when using multiple appliances.', category: 'Electrical', priority: 'High', roomIdx: 25 },
    { title: 'Hot water geyser repair', description: 'Geyser not heating water.', category: 'Plumbing', priority: 'High', roomIdx: 30 },
  ]
  const maintenanceStatuses = ['In Progress', 'Pending', 'Completed', 'Pending', 'In Progress', 'Pending', 'Completed', 'Pending']
  for (let i = 0; i < maintenanceData.length; i++) {
    const m = maintenanceData[i]
    const roomIdx = Math.min(m.roomIdx, roomsData.length - 1)
    await db.maintenanceRequest.create({
      data: { roomId: roomsData[roomIdx].id, studentId: createdStudents[i % createdStudents.length].id, title: m.title, description: m.description, category: m.category, priority: m.priority, status: maintenanceStatuses[i] },
    })
  }

  console.log('Creating notifications...')
  const notificationTemplates = [
    { title: 'Welcome to River Boy Hostel', message: 'Your hostel registration has been completed successfully.', type: 'success' },
    { title: 'Fee Payment Reminder', message: 'Your fee payment for the current month is due.', type: 'warning' },
    { title: 'Complaint Resolved', message: 'Your complaint has been resolved.', type: 'success' },
    { title: 'Room Allocation Update', message: 'Your room allocation has been updated.', type: 'info' },
    { title: 'Maintenance Scheduled', message: 'Maintenance work has been scheduled in your block.', type: 'info' },
    { title: 'Payment Received', message: 'Your fee payment has been received successfully.', type: 'success' },
  ]
  for (const template of notificationTemplates.slice(0, 3)) {
    await db.notification.create({ data: { userId: adminUser.id, title: `[Admin] ${template.title}`, message: template.message, type: template.type } })
  }
  for (const template of notificationTemplates.slice(0, 3)) {
    await db.notification.create({ data: { userId: wardenUser.id, title: `[Warden] ${template.title}`, message: template.message, type: template.type, read: true } })
  }
  for (let i = 0; i < createdStudents.length; i++) {
    const numNotifs = i < 10 ? 3 : 2
    for (let j = 0; j < numNotifs; j++) {
      const template = notificationTemplates[(i + j) % notificationTemplates.length]
      await db.notification.create({ data: { userId: studentUsers[i].userId, title: template.title, message: template.message, type: template.type, read: j === 0 } })
    }
  }

  console.log('Creating student movements...')
  const now = new Date()
  const movementsData = [
    { studentIdx: 0, reason: 'Going Home', daysAgo: 5, returnDaysAgo: 3, destination: 'Home - Swat, KPK', guardianContact: '0945-823456', status: 'Returned' },
    { studentIdx: 1, reason: 'Emergency Leave', daysAgo: 2, returnDaysAgo: null, destination: 'Home - Dir Upper, KPK', guardianContact: '0945-912345', status: 'Out' },
    { studentIdx: 2, reason: 'University Work', daysAgo: 1, returnDaysAgo: null, destination: 'UOM Main Campus', guardianContact: null, status: 'Approved' },
    { studentIdx: 3, reason: 'Vacation', daysAgo: 7, returnDaysAgo: 5, destination: 'Home - Chitral, KPK', guardianContact: '0943-412345', status: 'Returned' },
    { studentIdx: 4, reason: 'Going Home', daysAgo: 0, returnDaysAgo: null, destination: 'Home - Peshawar, KPK', guardianContact: '091-5678901', status: 'Pending' },
    { studentIdx: 5, reason: 'Emergency Leave', daysAgo: 4, returnDaysAgo: 1, destination: 'Hospital - Timergara', guardianContact: '0945-678901', status: 'Late Return' },
    { studentIdx: 6, reason: 'University Work', daysAgo: 3, returnDaysAgo: 2, destination: 'UOM Lab Complex', guardianContact: null, status: 'Returned' },
    { studentIdx: 7, reason: 'Going Home', daysAgo: 0, returnDaysAgo: null, destination: 'Home - Mardan, KPK', guardianContact: '0937-234567', status: 'Pending' },
  ]
  for (const m of movementsData) {
    if (m.studentIdx >= createdStudents.length) continue
    const departureDate = new Date(now.getTime() - m.daysAgo * 24 * 60 * 60 * 1000)
    const expectedReturnDate = new Date(departureDate.getTime() + 2 * 24 * 60 * 60 * 1000)
    const actualReturnDate = m.returnDaysAgo ? new Date(now.getTime() - m.returnDaysAgo * 24 * 60 * 60 * 1000) : null
    await db.studentMovement.create({
      data: {
        studentId: createdStudents[m.studentIdx].id,
        reason: m.reason,
        departureDate,
        expectedReturnDate,
        actualReturnDate,
        destination: m.destination,
        guardianContact: m.guardianContact,
        notes: m.reason === 'Emergency Leave' ? 'Family emergency - need to visit home urgently.' : m.reason === 'University Work' ? 'Project submission at main campus.' : null,
        departureSignature: m.status !== 'Pending' ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' : null,
        returnSignature: actualReturnDate ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' : null,
        status: m.status,
        approvedBy: ['Approved', 'Out', 'Returned', 'Late Return'].includes(m.status) ? adminUser.id : null,
        adminRemark: m.status === 'Late Return' ? 'Late return noted. Please ensure timely returns in future.' : null,
      },
    })
  }

  console.log('\n✅ Seed completed successfully!')
  console.log(`Summary: ${2 + studentUsers.length} users, 3 hostels, ${roomsData.length} rooms, ${createdStudents.length} students, ${feeCount} fees, ${complaintsData.length} complaints, ${noticesData.length} notices, ${staffData.length} staff, ${maintenanceData.length} maintenance requests, ${movementsData.length} movements`)

  await db.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
