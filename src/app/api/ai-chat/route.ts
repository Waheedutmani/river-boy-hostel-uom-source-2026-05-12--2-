import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ===================== DYNAMIC LLM IMPORT =====================
let ZAI: any = null
async function getLLM() {
  if (!ZAI) {
    try {
      const mod = await import('z-ai-web-dev-sdk')
      const SDK = mod.default || mod
      ZAI = await SDK.create()
    } catch (e) {
      console.warn('z-ai-web-dev-sdk not available, using fallback:', (e as any)?.message)
      ZAI = null
    }
  }
  return ZAI
}

// ===================== INTENT CATEGORIES =====================
type QueryMode = 'hostel' | 'academic' | 'coding' | 'general' | 'unknown'

type Intent =
  // Hostel intents
  | 'fee_query' | 'room_query' | 'leave_request' | 'complaint_status'
  | 'hostel_rules' | 'payment_history' | 'room_availability' | 'visitor_info'
  | 'general_help' | 'student_search' | 'payment_summary' | 'room_status_check'
  | 'complaint_overview' | 'occupancy_report' | 'late_fees_report' | 'generate_report'
  | 'greeting' | 'hostel_info' | 'staff_info' | 'notice_info' | 'maintenance_info'
  | 'profile_info'
  // General/Academic/Coding intents
  | 'academic_query' | 'coding_question' | 'general_knowledge' | 'personal_help'
  | 'math_science' | 'cybersecurity_query' | 'unknown'

interface IntentRule {
  intent: Intent
  keywords: string[]
  role: 'student' | 'admin' | 'both'
  mode: QueryMode
}

const intentRules: IntentRule[] = [
  // ==================== HOSTEL INTENTS ====================
  { intent: 'greeting', keywords: ['hello', 'hi', 'hey', 'salam', 'assalam', 'good morning', 'good afternoon', 'good evening', 'howdy', 'whats up', 'sup', 'kya hal'], role: 'both', mode: 'hostel' },

  // Fee & Payment
  { intent: 'fee_query', keywords: ['fee', 'fees', 'tuition', 'hostel fee', 'mess fee', 'how much fee', 'my fee', 'remaining fee', 'balance', 'due', 'dues', 'outstanding', 'owe'], role: 'student', mode: 'hostel' },
  { intent: 'payment_history', keywords: ['payment history', 'paid', 'payment record', 'payment detail', 'receipt', 'transactions', 'my payments'], role: 'student', mode: 'hostel' },
  { intent: 'payment_summary', keywords: ['payment summary', 'fee collection', 'total collected', 'total pending', 'revenue', 'financial', 'fee report', 'fee stats'], role: 'admin', mode: 'hostel' },
  { intent: 'late_fees_report', keywords: ['late fee', 'overdue', 'fine', 'late fine', 'pending fees', 'unpaid', 'defaulter'], role: 'admin', mode: 'hostel' },

  // Room
  { intent: 'room_query', keywords: ['my room', 'room details', 'room info', 'room number', 'which room', 'room allocation', 'room assignment'], role: 'student', mode: 'hostel' },
  { intent: 'room_availability', keywords: ['room available', 'vacancy', 'empty room', 'free room', 'available room', 'rooms open', 'any room'], role: 'both', mode: 'hostel' },
  { intent: 'room_status_check', keywords: ['room status', 'all rooms', 'room list', 'occupied', 'room occupancy', 'room count'], role: 'admin', mode: 'hostel' },
  { intent: 'occupancy_report', keywords: ['occupancy', 'occupancy rate', 'how many students', 'hostel capacity', 'full', 'vacancy report'], role: 'admin', mode: 'hostel' },

  // Leave & Movement
  { intent: 'leave_request', keywords: ['leave', 'going home', 'want leave', 'apply leave', 'departure', 'exit', 'going out', 'leave request'], role: 'student', mode: 'hostel' },

  // Complaints
  { intent: 'complaint_status', keywords: ['complaint', 'my complaint', 'complaint status', 'issue', 'problem', 'report issue', 'complaint update'], role: 'student', mode: 'hostel' },
  { intent: 'complaint_overview', keywords: ['complaints overview', 'all complaints', 'pending complaints', 'complaint report', 'complaint stats', 'unresolved'], role: 'admin', mode: 'hostel' },

  // Hostel Info
  { intent: 'hostel_info', keywords: ['hostel info', 'hostel details', 'about hostel', 'hostel name', 'hostel address', 'hostel type'], role: 'both', mode: 'hostel' },
  { intent: 'hostel_rules', keywords: ['rules', 'regulations', 'hostel rules', 'timing', 'curfew', 'guidelines', 'policy', 'policies', 'allowed', 'not allowed'], role: 'both', mode: 'hostel' },

  // Staff / Notices / Maintenance / Visitors / Profile
  { intent: 'staff_info', keywords: ['staff', 'warden', 'security guard', 'cleaner', 'electrician', 'plumber', 'clerk', 'employees'], role: 'admin', mode: 'hostel' },
  { intent: 'notice_info', keywords: ['notice', 'notices', 'announcement', 'latest notice', 'news', 'update'], role: 'both', mode: 'hostel' },
  { intent: 'maintenance_info', keywords: ['maintenance', 'repair', 'fix', 'broken', 'not working', 'ac not', 'electricity issue', 'water issue', 'furniture', 'plumbing'], role: 'both', mode: 'hostel' },
  { intent: 'visitor_info', keywords: ['visitor', 'visitors', 'guest', 'family visit', 'meeting', 'parent visit'], role: 'both', mode: 'hostel' },
  { intent: 'profile_info', keywords: ['my profile', 'my details', 'my info', 'who am i', 'my name', 'my department', 'my semester', 'my roll'], role: 'student', mode: 'hostel' },
  { intent: 'student_search', keywords: ['search student', 'find student', 'student list', 'all students', 'student info', 'student detail', 'student name'], role: 'admin', mode: 'hostel' },
  { intent: 'generate_report', keywords: ['report', 'generate report', 'summary report', 'dashboard', 'overview', 'analytics', 'statistics'], role: 'admin', mode: 'hostel' },

  // ==================== ACADEMIC INTENTS ====================
  { intent: 'academic_query', keywords: ['what is', 'explain', 'how does', 'define', 'describe', 'tell me about', 'difference between', 'compare', 'meaning of', 'concept of', 'overview of', 'introduction to'], role: 'both', mode: 'academic' },

  // ==================== CODING INTENTS ====================
  { intent: 'coding_question', keywords: ['python', 'c++', 'javascript', 'java', 'php', 'sql', 'code', 'algorithm', 'program', 'function', 'class', 'object', 'variable', 'loop', 'array', 'linked list', 'stack', 'queue', 'tree', 'sorting', 'recursion', 'debug', 'syntax', 'compile', 'runtime', 'api', 'database design', 'html', 'css', 'react', 'node', 'typescript', 'git', 'oop', 'object oriented', 'inheritance', 'polymorphism', 'encapsulation', 'abstraction', 'data structure'], role: 'both', mode: 'coding' },

  // ==================== CYBERSECURITY ====================
  { intent: 'cybersecurity_query', keywords: ['cybersecurity', 'hacking', 'ethical hacking', 'penetration testing', 'firewall', 'encryption', 'malware', 'phishing', 'vulnerability', 'security', 'network security', 'cia triad', 'owasp', 'sql injection', 'xss', 'csrf', 'ddos', 'authentication', 'authorization', 'cryptograph'], role: 'both', mode: 'coding' },

  // ==================== MATH/SCIENCE ====================
  { intent: 'math_science', keywords: ['calculate', 'formula', 'equation', 'theorem', 'proof', 'math', 'physics', 'chemistry', 'biology', 'calculus', 'algebra', 'geometry', 'statistics', 'probability', 'derivative', 'integral', 'matrix'], role: 'both', mode: 'academic' },

  // ==================== GENERAL KNOWLEDGE ====================
  { intent: 'general_knowledge', keywords: ['who is', 'when was', 'where is', 'why do', 'how many', 'history of', 'facts about', 'capital of', 'largest', 'smallest', 'first', 'inventor', 'discovered', 'country', 'continent', 'ocean', 'population'], role: 'both', mode: 'general' },

  // ==================== PERSONAL HELP ====================
  { intent: 'personal_help', keywords: ['help me', 'advice', 'suggestion', 'recommend', 'tips', 'how should i', 'what should i', 'can you suggest', 'guidance', 'career', 'study tips', 'exam preparation'], role: 'both', mode: 'general' },

  // General Help (system)
  { intent: 'general_help', keywords: ['help', 'what can you do', 'how to use', 'features', 'options', 'capabilities'], role: 'both', mode: 'hostel' },
]

// ===================== INTENT DETECTION =====================
function detectIntent(input: string, role: string): { intent: Intent; mode: QueryMode } {
  const lower = input.toLowerCase().trim()

  let bestMatch: Intent = 'unknown'
  let bestMode: QueryMode = 'unknown'
  let bestScore = 0

  for (const { intent, keywords, role: intentRole, mode } of intentRules) {
    if (intentRole !== 'both' && intentRole !== role) continue

    let score = 0
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        score += kw.length + (mode === 'hostel' ? 2 : 0) // Slight hostel bias for accuracy
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestMatch = intent
      bestMode = mode
    }
  }

  // If no match found, default to general_knowledge (Ask Anything mode)
  if (bestMatch === 'unknown' && lower.length > 3) {
    return { intent: 'general_knowledge', mode: 'general' }
  }

  return { intent: bestMatch, mode: bestMode }
}

// ===================== FORMAT HELPERS =====================
function formatPKR(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString()}`
}

function formatDate(date: string | Date | null): string {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ===================== LLM CALL =====================
async function callLLM(messages: { role: string; content: string }[], systemPrompt: string): Promise<string> {
  const zai = await getLLM()
  if (!zai) {
    return "⚠️ The AI knowledge engine is currently unavailable. I can still help with hostel-related queries. Please try asking about your fees, room, complaints, or hostel rules."
  }

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-10) // Last 10 messages for context
      ],
      temperature: 0.7,
      max_tokens: 1500,
    })

    return completion.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again."
  } catch (error: any) {
    console.error('LLM Error:', error?.message)
    return "⚠️ I'm having trouble connecting to the AI service right now. Please try again in a moment, or ask me about hostel-related topics like fees, rooms, or complaints."
  }
}

// ===================== CONTEXT BUILDER =====================
async function buildUserContext(userId: string, userRole: string): Promise<string> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { student: { include: { room: { include: { hostel: true } } } } }
    })

    if (!user) return ''

    let ctx = `User: ${user.name} (${user.email}), Role: ${userRole}`

    if (user.student) {
      const s = user.student
      ctx += `\nStudent Details: Roll No: ${s.rollNo}, Department: ${s.department}, Semester: ${s.semester}, Status: ${s.status}`
      if (s.room) ctx += `\nRoom: ${s.room.number}, Floor: ${s.room.floor}, Hostel: ${s.room.hostel?.name || 'N/A'}`
      if (s.guardianName) ctx += `\nGuardian: ${s.guardianName}`
    }

    return ctx
  } catch {
    return ''
  }
}

// ===================== SYSTEM PROMPT BUILDER =====================
function buildSystemPrompt(mode: QueryMode, userContext: string): string {
  const baseContext = userContext ? `\n\nCurrent User Info:\n${userContext}` : ''

  const basePrompt = `You are the RBH AI Assistant for River Boy Hostel, University of Malakand (UOM). You are intelligent, helpful, and knowledgeable. You assist students and admins with both hostel management and general knowledge questions.${baseContext}`

  switch (mode) {
    case 'academic':
      return basePrompt + `\n\nYou are now in **Academic Tutor Mode**. Provide clear, educational explanations with:
- Step-by-step breakdowns (simple to advanced)
- Real-world examples
- Key takeaways at the end
- Use markdown formatting: **bold** for key terms, bullet points for lists
- If explaining a concept, start with a simple definition then elaborate
- Be thorough but concise — aim for comprehensive understanding`

    case 'coding':
      return basePrompt + `\n\nYou are now in **Coding Assistant Mode**. Provide technical help with:
- Code examples wrapped in triple backticks with language identifier (e.g., \`\`\`python, \`\`\`cpp, \`\`\`javascript)
- Clear explanations of how the code works
- Comments in the code for clarity
- Debugging tips if the user has an error
- Best practices and common pitfalls
- Step-by-step algorithm explanations
- Support: Python, C++, JavaScript, Java, PHP, SQL, HTML/CSS, TypeScript, and more
- For data structures: explain with visual descriptions and code
- For cybersecurity: explain concepts with practical examples (ethical only)`

    case 'general':
      return basePrompt + `\n\nYou are now in **General Knowledge Mode**. Provide informative, accurate responses with:
- Clear, well-structured answers
- Interesting facts and context
- Balanced perspectives where applicable
- Use markdown formatting for readability
- Keep responses engaging but factual
- If uncertain, acknowledge it and provide the best available information`

    default:
      return basePrompt + `\n\nRespond helpfully and accurately. Use markdown formatting: **bold** for emphasis, bullet points for lists.`
  }
}

// ===================== HOSTEL RESPONSE GENERATORS =====================

async function handleStudentIntent(intent: Intent, userId: string, context: any[]): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { student: { include: { room: { include: { hostel: true } } } } }
  })

  if (!user || !user.student) {
    return "I couldn't find your student profile. Please make sure you're logged in with a valid student account."
  }

  const student = user.student

  switch (intent) {
    case 'greeting': {
      const hour = new Date().getHours()
      const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'
      return `${greeting}, ${user.name}! 👋\n\nI'm your **RBH AI Assistant** — I can help with *anything*!\n\n🏠 **Hostel Help:**\n• Fee & payment queries\n• Room details & availability\n• Leave requests & complaints\n• Hostel rules & notices\n\n📚 **Study Help:**\n• Explain concepts (CS, coding, cybersecurity)\n• Code examples & debugging\n• Math, science, algorithms\n\n🌍 **General Knowledge:**\n• Ask me anything — history, science, facts\n\n💡 Try: *"Explain OOP"*, *"What is AI?"*, *"My fee"*, or *"Python code for linked list"*`
    }

    case 'fee_query': {
      const fees = await prisma.fee.findMany({ where: { studentId: student.id }, orderBy: { createdAt: 'desc' }, take: 10 })
      const totalAmount = fees.reduce((s, f) => s + f.amount, 0)
      const paidAmount = fees.filter(f => f.status === 'Paid').reduce((s, f) => s + f.amount, 0)
      const pendingAmount = fees.filter(f => f.status === 'Pending' || f.status === 'Overdue').reduce((s, f) => s + f.amount + f.lateFine, 0)
      const overdueFees = fees.filter(f => f.status === 'Overdue')
      const lateFines = fees.reduce((s, f) => s + f.lateFine, 0)

      let response = `📊 **Your Fee Summary**\n\n`
      response += `**Total Fee:** ${formatPKR(totalAmount)}\n**Paid:** ${formatPKR(paidAmount)}\n**Pending:** ${formatPKR(pendingAmount)}\n`
      if (lateFines > 0) response += `**Late Fines:** ${formatPKR(lateFines)}\n`

      if (overdueFees.length > 0) {
        response += `\n⚠️ **Overdue Fees (${overdueFees.length}):**\n`
        overdueFees.forEach(f => { response += `  • ${f.feeType} - ${f.month} ${f.year}: ${formatPKR(f.amount + f.lateFine)} (incl. fine: ${formatPKR(f.lateFine)})\n` })
      }

      const pendingFees = fees.filter(f => f.status === 'Pending')
      if (pendingFees.length > 0) {
        response += `\n📋 **Pending Fees (${pendingFees.length}):**\n`
        pendingFees.forEach(f => { response += `  • ${f.feeType} - ${f.month} ${f.year}: ${formatPKR(f.amount)}`; if (f.dueDate) response += ` (Due: ${formatDate(f.dueDate)})`; response += `\n` })
      }

      if (pendingAmount === 0 && overdueFees.length === 0) response += `\n✅ All your fees are paid! No pending dues.`
      return response
    }

    case 'payment_history': {
      const payments = await prisma.payment.findMany({ where: { fee: { studentId: student.id } }, include: { fee: { include: { student: { include: { user: true } } } } }, orderBy: { createdAt: 'desc' }, take: 10 })
      if (payments.length === 0) return "You don't have any payment records yet."
      let response = `💳 **Your Payment History** (Last ${payments.length})\n\n`
      payments.forEach((p, i) => { response += `**${i + 1}.** ${p.fee.feeType} - ${p.fee.month} ${p.fee.year}\n   Amount: ${formatPKR(p.amount)} | Method: ${p.paymentMethod} | Status: ${p.status}\n`; if (p.referenceNo) response += `   Ref: ${p.referenceNo}\n`; response += `   Date: ${formatDate(p.createdAt)}\n\n` })
      const totalPaid = payments.filter(p => p.status === 'Verified').reduce((s, p) => s + p.amount, 0)
      response += `**Total Verified Payments:** ${formatPKR(totalPaid)}`
      return response
    }

    case 'room_query': {
      if (!student.room) return "You don't have a room assigned yet. Apply from the 'Apply for Room' section."
      const room = student.room; const hostel = room.hostel
      const roommates = await prisma.student.findMany({ where: { roomId: room.id, id: { not: student.id } }, include: { user: true } })
      let response = `🏠 **Your Room Details**\n\n**Room Number:** ${room.number}\n**Floor:** ${room.floor}\n**Capacity:** ${room.capacity} students\n**Hostel:** ${hostel?.name || 'N/A'} (${hostel?.type || 'N/A'})\n**Status:** ${room.status}\n`
      if (roommates.length > 0) { response += `\n👥 **Roommates (${roommates.length}):**\n`; roommates.forEach(rm => { response += `  • ${rm.user.name} - ${rm.department}, Semester ${rm.semester}\n` }) }
      return response
    }

    case 'room_availability': {
      const rooms = await prisma.room.findMany({ where: { status: 'Available' }, include: { hostel: true, _count: { select: { students: true } } } })
      if (rooms.length === 0) return "😔 No available rooms right now. Check back later or contact administration."
      const hostels = [...new Set(rooms.map(r => r.hostel?.name).filter(Boolean))]
      let response = `🛏️ **Available Rooms** (${rooms.length} rooms)\n\n`
      hostels.forEach(hostelName => {
        const hostelRooms = rooms.filter(r => r.hostel?.name === hostelName)
        response += `**${hostelName}:**\n`
        hostelRooms.slice(0, 5).forEach(r => { response += `  • Room ${r.number} - Floor ${r.floor}, Capacity: ${r.capacity}, Occupied: ${r._count.students}\n` })
        if (hostelRooms.length > 5) response += `  ... and ${hostelRooms.length - 5} more\n`
        response += `\n`
      })
      response += `💡 Apply from the 'Apply for Room' section.`
      return response
    }

    case 'leave_request': {
      const movements = await prisma.studentMovement.findMany({ where: { studentId: student.id }, orderBy: { createdAt: 'desc' }, take: 5 })
      const pendingMovements = movements.filter(m => m.status === 'Pending')
      const activeMovement = movements.find(m => m.status === 'Approved' || m.status === 'Out')
      let response = `🚪 **Leave & Movement Status**\n\n`
      if (activeMovement) { response += `📍 **Active Movement:**\n  Reason: ${activeMovement.reason}\n  Departure: ${formatDate(activeMovement.departureDate)}\n  Expected Return: ${formatDate(activeMovement.expectedReturnDate)}\n  Status: ${activeMovement.status}\n\n` }
      if (pendingMovements.length > 0) { response += `⏳ **Pending Requests:** ${pendingMovements.length}\n`; pendingMovements.forEach(m => { response += `  • ${m.reason} - Departure: ${formatDate(m.departureDate)}\n` }); response += `\n` }
      response += `💡 Go to **Leave & Movement** to submit a new request.`
      return response
    }

    case 'complaint_status': {
      const complaints = await prisma.complaint.findMany({ where: { studentId: student.id }, orderBy: { createdAt: 'desc' }, take: 10 })
      if (complaints.length === 0) return "You haven't submitted any complaints. Submit one from the 'Complaints' section."
      const open = complaints.filter(c => c.status === 'Open').length, inProgress = complaints.filter(c => c.status === 'In Progress').length, resolved = complaints.filter(c => c.status === 'Resolved').length
      let response = `📝 **Your Complaints** (Total: ${complaints.length})\n\n📊 Open: ${open} | In Progress: ${inProgress} | Resolved: ${resolved}\n\n`
      complaints.slice(0, 5).forEach((c, i) => { const si = c.status === 'Resolved' ? '✅' : c.status === 'In Progress' ? '🔄' : '🟡'; response += `${si} **${i + 1}. ${c.title}**\n   Category: ${c.category} | Priority: ${c.priority} | Status: ${c.status}\n`; if (c.adminReply) response += `   Admin Reply: ${c.adminReply}\n`; response += `   Filed: ${formatDate(c.createdAt)}\n\n` })
      return response
    }

    case 'profile_info': {
      let response = `👤 **Your Profile**\n\n**Name:** ${user.name}\n**Email:** ${user.email}\n**Roll No:** ${student.rollNo}\n**Department:** ${student.department}\n**Semester:** ${student.semester}\n**Status:** ${student.status}\n`
      if (student.room) response += `**Room:** ${student.room.number}\n`
      if (student.guardianName) response += `**Guardian:** ${student.guardianName}\n`
      if (student.bloodGroup) response += `**Blood Group:** ${student.bloodGroup}\n`
      return response
    }

    case 'visitor_info': {
      const visitors = await prisma.visitor.findMany({ where: { studentId: student.id }, orderBy: { createdAt: 'desc' }, take: 5 })
      if (visitors.length === 0) return "No visitors registered for you yet."
      let response = `👥 **Your Visitors** (Last ${visitors.length})\n\n`
      visitors.forEach((v, i) => { const si = v.status === 'Checked In' ? '🟢' : v.status === 'Checked Out' ? '🔴' : '🟡'; response += `${si} **${i + 1}. ${v.visitorName}**\n   Relation: ${v.relationWithStudent} | Purpose: ${v.visitPurpose}\n   CNIC: ${v.cnic} | Status: ${v.status}\n   Date: ${formatDate(v.visitDate)}\n\n` })
      return response
    }

    case 'maintenance_info': {
      const requests = await prisma.maintenanceRequest.findMany({ where: { studentId: student.id }, orderBy: { createdAt: 'desc' }, take: 5, include: { room: true } })
      if (requests.length === 0) return "No maintenance requests. Submit one from 'Maintenance'."
      let response = `🔧 **Your Maintenance Requests**\n\n`
      requests.forEach((r, i) => { const si = r.status === 'Completed' ? '✅' : r.status === 'In Progress' ? '🔄' : '🟡'; response += `${si} **${i + 1}. ${r.title}**\n   Room: ${r.room.number} | Category: ${r.category} | Priority: ${r.priority}\n   Status: ${r.status} | Date: ${formatDate(r.createdAt)}\n\n` })
      return response
    }

    case 'notice_info': {
      const notices = await prisma.notice.findMany({ orderBy: { createdAt: 'desc' }, take: 5 })
      if (notices.length === 0) return "No notices at the moment."
      let response = `📢 **Latest Notices**\n\n`
      notices.forEach((n, i) => { const pi = n.priority === 'Urgent' ? '🔴' : n.priority === 'Important' ? '🟡' : '🟢'; response += `${pi} **${i + 1}. ${n.title}**\n   ${n.content.substring(0, 100)}${n.content.length > 100 ? '...' : ''}\n   Category: ${n.category} | Date: ${formatDate(n.createdAt)}\n\n` })
      return response
    }

    case 'hostel_rules': {
      return `📋 **Hostel Rules & Regulations**\n\n🕐 **Timings:**\n• Gate opens: 6:00 AM | Closes: 10:00 PM\n• Late entry requires warden permission\n\n🚫 **Prohibited:**\n• Smoking, drugs, and alcohol\n• Unauthorized guests/visitors\n• Loud music after 10:00 PM\n• Cooking in rooms (except designated areas)\n• Pets of any kind\n\n✅ **Required:**\n• Keep rooms clean and tidy\n• Carry ID card at all times\n• Register visitors at the gate\n• Report maintenance issues promptly\n• Pay fees before due dates\n\n⚠️ **Violations** may result in fines or hostel eviction.`
    }

    case 'hostel_info': {
      const hostels = await prisma.hostel.findMany({ include: { _count: { select: { rooms: true, staff: true } } } })
      if (hostels.length === 0) return "No hostel information available."
      let response = `🏛️ **Hostel Information**\n\n`
      hostels.forEach(h => { response += `**${h.name}** (${h.type})\n  Total Rooms: ${h._count.rooms} | Staff: ${h._count.staff}\n`; if (h.address) response += `  Address: ${h.address}\n`; response += `\n` })
      return response
    }

    case 'general_help': {
      return `🤖 **RBH AI Assistant — Ask Anything!**\n\nI'm your smart hostel assistant that can help with **everything**:\n\n🏠 **Hostel Management:**\n• "My fee" — Check your fee details\n• "My room" — View room info\n• "My complaints" — Check complaint status\n• "Leave request" — Apply for leave\n• "Hostel rules" — View rules\n\n📚 **Academic Help:**\n• "Explain OOP concepts"\n• "What is DBMS?"\n• "Difference between TCP and UDP"\n• "Define artificial intelligence"\n\n💻 **Coding Assistant:**\n• "Python code for linked list"\n• "Explain recursion with example"\n• "How to sort an array in C++"\n• "SQL join types explained"\n\n🔒 **Cybersecurity:**\n• "What is SQL injection?"\n• "Explain encryption types"\n• "CIA triad in cybersecurity"\n\n🌍 **General Knowledge:**\n• "Who invented the computer?"\n• "Capital of Pakistan"\n• "How does the internet work?"\n\nJust type naturally and I'll help! 💡`
    }

    default:
      return `I'm not sure I understood that. I can help with:\n\n• **"My fee"** — Hostel fee details\n• **"Explain OOP"** — Academic concepts\n• **"Python code"** — Coding help\n• **"Help"** — See all capabilities\n\nTry asking something!`
  }
}

// ===================== ADMIN HOSTEL RESPONSES =====================
async function handleAdminIntent(intent: Intent, userId: string, context: any[]): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return "I couldn't find your admin profile."

  switch (intent) {
    case 'greeting': {
      const hour = new Date().getHours()
      const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'
      const [totalStudents, pendingFees, openComplaints, pendingMovements] = await Promise.all([
        prisma.student.count(),
        prisma.fee.count({ where: { status: { in: ['Pending', 'Overdue'] } } }),
        prisma.complaint.count({ where: { status: 'Open' } }),
        prisma.studentMovement.count({ where: { status: 'Pending' } }),
      ])

      return `${greeting}, ${user.name}! 👋\n\n📊 **Quick Overview:**\n• Total Students: ${totalStudents}\n• Pending/Overdue Fees: ${pendingFees}\n• Open Complaints: ${openComplaints}\n• Pending Leave Requests: ${pendingMovements}\n\nI can help with:\n• **Hostel management** — students, fees, rooms, complaints\n• **Academic & coding** — explain concepts, write code\n• **Reports** — generate summaries\n\nWhat would you like?`
    }

    case 'student_search': {
      const students = await prisma.student.findMany({ include: { user: true, room: { include: { hostel: true } } }, orderBy: { createdAt: 'desc' }, take: 10 })
      if (students.length === 0) return "No students found."
      let response = `🎓 **Students List** (Showing ${students.length})\n\n`
      students.forEach((s, i) => { response += `**${i + 1}. ${s.user.name}**\n   Roll: ${s.rollNo} | Dept: ${s.department} | Sem: ${s.semester}\n   Room: ${s.room?.number || 'Not Assigned'} | Status: ${s.status}\n\n` })
      return response
    }

    case 'payment_summary': {
      const [totalFees, paidFees, pendingFees, overdueFees] = await Promise.all([
        prisma.fee.aggregate({ _sum: { amount: true } }),
        prisma.fee.aggregate({ _sum: { amount: true }, where: { status: 'Paid' } }),
        prisma.fee.aggregate({ _sum: { amount: true }, where: { status: 'Pending' } }),
        prisma.fee.aggregate({ _sum: { amount: true, lateFine: true }, where: { status: 'Overdue' } }),
      ])
      const payments = await prisma.payment.findMany({ where: { status: 'Verified' }, orderBy: { createdAt: 'desc' }, take: 5, include: { fee: { include: { student: { include: { user: true } } } } } })
      let response = `💰 **Payment Summary**\n\n**Total Fee Amount:** ${formatPKR(totalFees._sum.amount || 0)}\n**Collected (Paid):** ${formatPKR(paidFees._sum.amount || 0)}\n**Pending:** ${formatPKR(pendingFees._sum.amount || 0)}\n**Overdue:** ${formatPKR(overdueFees._sum.amount || 0)} (Fines: ${formatPKR(overdueFees._sum.lateFine || 0)})\n\n`
      if (payments.length > 0) { response += `📋 **Recent Verified Payments:**\n`; payments.forEach((p, i) => { response += `  ${i + 1}. ${p.fee.student?.user?.name || 'Unknown'} - ${formatPKR(p.amount)} via ${p.paymentMethod}\n` }) }
      return response
    }

    case 'late_fees_report': {
      const overdueFees = await prisma.fee.findMany({ where: { status: 'Overdue' }, include: { student: { include: { user: true } } }, orderBy: { lateFine: 'desc' }, take: 15 })
      const [pendingCount, overdueCount] = await Promise.all([prisma.fee.count({ where: { status: 'Pending' } }), prisma.fee.count({ where: { status: 'Overdue' } })])
      const totalLateFine = await prisma.fee.aggregate({ _sum: { lateFine: true }, where: { status: 'Overdue' } })
      let response = `⚠️ **Late Fees Report**\n\n**Pending Fees:** ${pendingCount}\n**Overdue Fees:** ${overdueCount}\n**Total Late Fines:** ${formatPKR(totalLateFine._sum.lateFine || 0)}\n\n`
      if (overdueFees.length > 0) { response += `📋 **Top Defaulters:**\n`; overdueFees.slice(0, 8).forEach((f, i) => { response += `  ${i + 1}. ${f.student?.user?.name || 'Unknown'} (${f.student?.rollNo})\n     ${f.feeType} - ${f.month} ${f.year}: ${formatPKR(f.amount)} + Fine: ${formatPKR(f.lateFine)}\n` }) }
      response += `\n💡 Use **AI Automation** to apply late fees in bulk.`
      return response
    }

    case 'room_status_check': {
      const [available, occupied, maintenance] = await Promise.all([prisma.room.count({ where: { status: 'Available' } }), prisma.room.count({ where: { status: 'Occupied' } }), prisma.room.count({ where: { status: 'Maintenance' } })])
      const total = available + occupied + maintenance
      return `🏠 **Room Status Overview**\n\n**Total Rooms:** ${total}\n🟢 **Available:** ${available}\n🟡 **Occupied:** ${occupied}\n🔴 **Maintenance:** ${maintenance}\n\n**Occupancy Rate:** ${total > 0 ? Math.round((occupied / total) * 100) : 0}%`
    }

    case 'occupancy_report': {
      const hostels = await prisma.hostel.findMany({ include: { rooms: { include: { _count: { select: { students: true } } } } } })
      let response = `📊 **Occupancy Report**\n\n`
      for (const hostel of hostels) { const tc = hostel.rooms.reduce((s, r) => s + r.capacity, 0), to = hostel.rooms.reduce((s, r) => s + r._count.students, 0), r = tc > 0 ? Math.round((to / tc) * 100) : 0; response += `**${hostel.name}** (${hostel.type})\n  Rooms: ${hostel.rooms.length} | Capacity: ${tc} | Occupied: ${to} | Rate: ${r}%\n\n` }
      return response
    }

    case 'complaint_overview': {
      const [open, inProgress, resolved] = await Promise.all([prisma.complaint.count({ where: { status: 'Open' } }), prisma.complaint.count({ where: { status: 'In Progress' } }), prisma.complaint.count({ where: { status: 'Resolved' } })])
      const total = open + inProgress + resolved
      const recentComplaints = await prisma.complaint.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { student: { include: { user: true } } } })
      let response = `📝 **Complaints Overview**\n\n**Total:** ${total} | 🟡 Open: ${open} | 🔄 In Progress: ${inProgress} | ✅ Resolved: ${resolved}\n\n`
      if (recentComplaints.length > 0) { response += `📋 **Recent Complaints:**\n`; recentComplaints.forEach((c, i) => { const si = c.status === 'Resolved' ? '✅' : c.status === 'In Progress' ? '🔄' : '🟡'; response += `  ${si} ${c.title} - ${c.student?.user?.name || 'Unknown'} (${c.category})\n` }) }
      return response
    }

    case 'staff_info': {
      const staff = await prisma.staff.findMany({ include: { hostel: true }, orderBy: { name: 'asc' } })
      if (staff.length === 0) return "No staff records found."
      const roles = [...new Set(staff.map(s => s.role))]
      let response = `👥 **Staff Overview** (Total: ${staff.length})\n\n`
      roles.forEach(role => { const rs = staff.filter(s => s.role === role); response += `**${role}** (${rs.length}):\n`; rs.forEach(s => { response += `  • ${s.name} - ${s.hostel?.name || 'N/A'} | Status: ${s.status}\n` }); response += `\n` })
      return response
    }

    case 'notice_info': {
      const notices = await prisma.notice.findMany({ orderBy: { createdAt: 'desc' }, take: 5 })
      if (notices.length === 0) return "No notices found."
      let response = `📢 **Recent Notices**\n\n`
      notices.forEach((n, i) => { response += `**${i + 1}. ${n.title}** (${n.priority})\n   ${n.content.substring(0, 80)}${n.content.length > 80 ? '...' : ''}\n   Category: ${n.category} | Date: ${formatDate(n.createdAt)}\n\n` })
      return response
    }

    case 'hostel_rules': { return `📋 **Hostel Rules & Regulations**\n\n🕐 Gate: 6AM-10PM | 🚫 No smoking/drugs/unauthorized guests | ✅ Clean rooms, carry ID, pay fees on time | ⚠️ Violations → fines/eviction` }
    case 'hostel_info': {
      const hostels = await prisma.hostel.findMany({ include: { _count: { select: { rooms: true, staff: true, applications: true } } } })
      if (hostels.length === 0) return "No hostel information."
      let response = `🏛️ **Hostel Information**\n\n`
      hostels.forEach(h => { response += `**${h.name}** (${h.type})\n  Rooms: ${h._count.rooms} | Staff: ${h._count.staff} | Applications: ${h._count.applications}\n`; if (h.address) response += `  Address: ${h.address}\n`; response += `\n` })
      return response
    }

    case 'generate_report': {
      const [totalStudents, activeStudents, totalRooms, availableRooms, totalFees, paidFees, openComplaints, pendingMovements] = await Promise.all([
        prisma.student.count(), prisma.student.count({ where: { status: 'Active' } }), prisma.room.count(), prisma.room.count({ where: { status: 'Available' } }),
        prisma.fee.aggregate({ _sum: { amount: true } }), prisma.fee.aggregate({ _sum: { amount: true }, where: { status: 'Paid' } }),
        prisma.complaint.count({ where: { status: 'Open' } }), prisma.studentMovement.count({ where: { status: 'Pending' } }),
      ])
      const or = totalRooms > 0 ? Math.round(((totalRooms - availableRooms) / totalRooms) * 100) : 0
      return `📊 **System Report**\n\n🎓 **Students:** ${totalStudents} total, ${activeStudents} active\n🏠 **Rooms:** ${totalRooms} total, ${availableRooms} available, ${or}% occupied\n💰 **Finances:** ${formatPKR(totalFees._sum.amount || 0)} total, ${formatPKR(paidFees._sum.amount || 0)} collected\n📝 **Complaints:** ${openComplaints} open\n🚪 **Movements:** ${pendingMovements} pending\n\n💡 Visit **Reports** for detailed charts.`
    }

    case 'general_help': {
      return `🤖 **RBH AI Assistant — Admin Mode**\n\nI can help with:\n\n🏠 **Hostel Management:**\n• "Payment summary" — Fee collection overview\n• "Room status" — All rooms\n• "Complaints overview" — Pending items\n• "Student search" — Find students\n\n📚 **Knowledge & Coding:**\n• "Explain database normalization"\n• "Python code for student management"\n• "What is cybersecurity?"\n\nJust ask!`
    }

    default:
      return `I can help with:\n\n• **"Payment summary"** — Fee overview\n• **"Room status"** — All rooms\n• **"Explain OOP"** — Academic help\n• **"Help"** — All commands\n\nTry asking!`
  }
}

// ===================== QUERY LIMIT CONSTANTS =====================
const DAILY_QUERY_LIMIT = 15

function getTodayDate(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function getTimeUntilReset(): { hours: number; minutes: number } {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  const diffMs = tomorrow.getTime() - now.getTime()
  const totalMinutes = Math.floor(diffMs / 60000)
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 }
}

// ===================== QUERY LIMIT CHECKER =====================
async function checkAndIncrementQueryLimit(userId: string, userName: string, userRole: string, query: string, intent: string, mode: string): Promise<{ allowed: boolean; reason?: string; message?: string; queryCount?: number; remaining?: number; usagePercentage?: number }> {
  const today = getTodayDate()

  // Find or create the query limit record
  let queryLimit = await prisma.aiQueryLimit.findUnique({
    where: { userId }
  })

  if (!queryLimit) {
    queryLimit = await prisma.aiQueryLimit.create({
      data: {
        userId,
        queryCount: 0,
        lastResetDate: today,
        isDisabled: false,
      }
    })
  }

  // Auto-reset if new day
  if (queryLimit.lastResetDate !== today) {
    queryLimit = await prisma.aiQueryLimit.update({
      where: { userId },
      data: {
        queryCount: 0,
        lastResetDate: today,
      }
    })
  }

  // Check if AI is disabled for this user
  if (queryLimit.isDisabled) {
    return {
      allowed: false,
      reason: 'disabled',
      message: 'Your AI access has been disabled by the administrator. Please contact the warden for assistance.',
      queryCount: queryLimit.queryCount,
      remaining: 0,
      usagePercentage: 100,
    }
  }

  // Check if limit is reached
  if (queryLimit.queryCount >= DAILY_QUERY_LIMIT) {
    const { hours, minutes } = getTimeUntilReset()
    return {
      allowed: false,
      reason: 'limit_reached',
      message: `You have reached your daily limit of ${DAILY_QUERY_LIMIT} AI queries. Please try again tomorrow after reset.\n\n⏰ **Reset in:** ${hours}h ${minutes}m\n📊 **Used today:** ${queryLimit.queryCount} / ${DAILY_QUERY_LIMIT}`,
      queryCount: queryLimit.queryCount,
      remaining: 0,
      usagePercentage: 100,
    }
  }

  // Increment the counter
  queryLimit = await prisma.aiQueryLimit.update({
    where: { userId },
    data: {
      queryCount: { increment: 1 },
    }
  })

  // Log the query
  await prisma.aiQueryLog.create({
    data: {
      userId,
      userName: userName || 'Unknown',
      userRole: userRole || 'student',
      query: query.substring(0, 500),
      intent: intent || null,
      mode: mode || null,
    }
  })

  const remaining = Math.max(0, DAILY_QUERY_LIMIT - queryLimit.queryCount)

  return {
    allowed: true,
    queryCount: queryLimit.queryCount,
    remaining,
    usagePercentage: Math.round((queryLimit.queryCount / DAILY_QUERY_LIMIT) * 100),
  }
}

// ===================== MAIN HANDLER =====================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, userId, userRole, context = [], userName } = body

    if (!message || !userId || !userRole) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const sanitizedMessage = message.replace(/[<>]/g, '').trim()
    if (sanitizedMessage.length === 0) return NextResponse.json({ error: 'Empty message' }, { status: 400 })
    if (sanitizedMessage.length > 500) return NextResponse.json({ error: 'Message too long' }, { status: 400 })

    // Step 1: Detect intent and mode (for logging purposes)
    const { intent, mode } = detectIntent(sanitizedMessage, userRole)

    // Step 2: Check query limit BEFORE processing
    const limitCheck = await checkAndIncrementQueryLimit(userId, userName || 'Unknown', userRole, sanitizedMessage, intent, mode)

    if (!limitCheck.allowed) {
      const { hours, minutes } = getTimeUntilReset()
      return NextResponse.json({
        message: limitCheck.message || 'Daily query limit reached.',
        intent: 'limit_reached',
        mode: 'hostel',
        timestamp: new Date().toISOString(),
        suggestions: ['Try again tomorrow', 'Contact warden'],
        limitInfo: {
          queryCount: limitCheck.queryCount,
          dailyLimit: DAILY_QUERY_LIMIT,
          remaining: 0,
          isLimitReached: true,
          isDisabled: limitCheck.reason === 'disabled',
          usagePercentage: 100,
          timeUntilReset: { hours, minutes },
        }
      })
    }

    // Step 3: Route based on mode
    let response: string
    let responseMode = mode

    if (mode === 'hostel' || intent === 'greeting' || intent === 'general_help') {
      // Hostel database queries
      if (userRole === 'admin') {
        response = await handleAdminIntent(intent, userId, context)
      } else {
        response = await handleStudentIntent(intent, userId, context)
      }
    } else {
      // Academic / Coding / General — Use LLM
      const userContext = await buildUserContext(userId, userRole)
      const systemPrompt = buildSystemPrompt(mode, userContext)

      // Build conversation context
      const llmMessages = context.slice(-8).map((c: any) => ({
        role: c.role === 'user' ? 'user' as const : 'assistant' as const,
        content: c.content
      }))
      llmMessages.push({ role: 'user', content: sanitizedMessage })

      response = await callLLM(llmMessages, systemPrompt)

      // If LLM failed, try hostel fallback
      if (response.includes('⚠️') && response.includes('unavailable')) {
        if (userRole === 'admin') {
          response = await handleAdminIntent(intent === 'unknown' ? 'general_help' : intent, userId, context)
        } else {
          response = await handleStudentIntent(intent === 'unknown' ? 'general_help' : intent, userId, context)
        }
        responseMode = 'hostel'
      }
    }

    // Step 4: Return response with limit info
    const { hours, minutes } = getTimeUntilReset()
    return NextResponse.json({
      message: response,
      intent,
      mode: responseMode,
      timestamp: new Date().toISOString(),
      suggestions: getSuggestions(intent, responseMode, userRole),
      limitInfo: {
        queryCount: limitCheck.queryCount,
        dailyLimit: DAILY_QUERY_LIMIT,
        remaining: limitCheck.remaining,
        isLimitReached: false,
        isDisabled: false,
        usagePercentage: limitCheck.usagePercentage,
        timeUntilReset: { hours, minutes },
      }
    })
  } catch (error: any) {
    console.error('AI Chat Error:', error)
    return NextResponse.json({
      message: "I'm having trouble processing your request. Please try again.",
      intent: 'error',
      mode: 'unknown',
      timestamp: new Date().toISOString(),
      suggestions: ['Try again', 'Help']
    }, { status: 500 })
  }
}

// ===================== SUGGESTION GENERATOR =====================
function getSuggestions(intent: Intent, mode: QueryMode, role: string): string[] {
  // Mode-based suggestions
  if (mode === 'academic') return ['Explain DBMS', 'What is AI?', 'OOP concepts', 'Check my fee']
  if (mode === 'coding') return ['Python linked list', 'SQL joins', 'Cybersecurity basics', 'My room']
  if (mode === 'general') return ['Capital of Pakistan', 'How does internet work', 'My fee', 'Hostel rules']

  // Hostel mode suggestions
  if (role === 'admin') {
    const adminSuggestions: Record<string, string[]> = {
      greeting: ['Payment summary', 'Room status', 'Explain OOP', 'Generate report'],
      payment_summary: ['Late fees report', 'Student search', 'Explain DBMS'],
      late_fees_report: ['Payment summary', 'Student search', 'Python code example'],
      room_status_check: ['Occupancy report', 'Student search', 'Staff info'],
      occupancy_report: ['Room status', 'Student search', 'Cybersecurity basics'],
      complaint_overview: ['Staff info', 'Student search', 'Generate report'],
      student_search: ['Payment summary', 'Room status', 'What is AI?'],
      staff_info: ['Student search', 'Generate report', 'Hostel info'],
      notice_info: ['Complaints overview', 'Student search', 'Generate report'],
      generate_report: ['Payment summary', 'Room status', 'Explain cybersecurity'],
      hostel_info: ['Room status', 'Occupancy report', 'Staff info'],
      hostel_rules: ['Student search', 'Generate report', 'Help'],
      general_help: ['Payment summary', 'Explain OOP', 'Python code', 'Room status'],
      unknown: ['Payment summary', 'Room status', 'Explain OOP', 'Help'],
    }
    return adminSuggestions[intent] || adminSuggestions.unknown
  } else {
    const studentSuggestions: Record<string, string[]> = {
      greeting: ['My fee', 'My room', 'Explain OOP', 'Hostel rules'],
      fee_query: ['Payment history', 'My room', 'What is AI?'],
      payment_history: ['My fee', 'My complaints', 'Python code'],
      room_query: ['Available rooms', 'My complaints', 'Hostel rules'],
      room_availability: ['My room', 'My fee', 'Help'],
      leave_request: ['My complaints', 'My fee', 'Hostel rules'],
      complaint_status: ['Maintenance', 'My fee', 'Explain DBMS'],
      profile_info: ['My fee', 'My room', 'My complaints'],
      visitor_info: ['My room', 'My complaints', 'Help'],
      maintenance_info: ['My complaints', 'My fee', 'Help'],
      notice_info: ['Hostel rules', 'My fee', 'My room'],
      hostel_rules: ['My fee', 'My room', 'Explain cybersecurity'],
      hostel_info: ['Available rooms', 'Hostel rules', 'Help'],
      general_help: ['My fee', 'Explain OOP', 'Python code', 'Hostel rules'],
      unknown: ['My fee', 'My room', 'Explain OOP', 'Help'],
    }
    return studentSuggestions[intent] || studentSuggestions.unknown
  }
}
