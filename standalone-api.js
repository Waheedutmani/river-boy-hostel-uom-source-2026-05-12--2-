const http = require('http');
const { URL } = require('url');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PORT = 3001;

console.log('Starting standalone API server...');

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
  
  const url = new URL(req.url, 'http://localhost');
  let body = {};
  
  if (req.method === 'POST' || req.method === 'PUT') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    try { body = JSON.parse(Buffer.concat(chunks).toString()); } catch (e) {}
  }
  
  let result = { status: 404, body: { error: 'Not found' } };
  
  try {
    // Auth - Login
    if (url.pathname === '/api/auth/login' && req.method === 'POST') {
      const { email, password } = body;
      if (!email || !password) {
        result = { status: 400, body: { error: 'Email and password are required' } };
      } else {
        const user = await prisma.user.findUnique({
          where: { email },
          include: { student: { include: { room: { include: { hostel: true } } } } }
        });
        if (!user) {
          result = { status: 401, body: { error: 'Invalid email or password' } };
        } else {
          const hashedPassword = Buffer.from(password).toString('base64');
          if (user.password !== hashedPassword) {
            result = { status: 401, body: { error: 'Invalid email or password' } };
          } else {
            const { password: _, ...safeUser } = user;
            result = { status: 200, body: { user: safeUser } };
          }
        }
      }
    }
    // Auth - Register
    else if (url.pathname === '/api/auth/register' && req.method === 'POST') {
      const { name, email, password, phone, role, rollNo, department, semester, bloodGroup, guardianName, guardianPhone, address, emergencyContact } = body;
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        result = { status: 400, body: { error: 'Email already registered' } };
      } else {
        const hashedPassword = Buffer.from(password).toString('base64');
        const user = await prisma.user.create({
          data: {
            name, email, password: hashedPassword, phone: phone || '', role: role || 'student',
            student: role !== 'admin' ? {
              create: { rollNo: rollNo || '', department: department || '', semester: semester || 1, bloodGroup: bloodGroup || '', guardianName: guardianName || '', guardianPhone: guardianPhone || '', address: address || '', emergencyContact: emergencyContact || '', status: 'active' }
            } : undefined
          },
          include: { student: { include: { room: { include: { hostel: true } } } } }
        });
        const { password: _, ...safeUser } = user;
        result = { status: 201, body: { user: safeUser } };
      }
    }
    // Notifications
    else if (url.pathname === '/api/notifications' && req.method === 'GET') {
      const userId = url.searchParams.get('userId');
      if (!userId) {
        result = { status: 200, body: { notifications: [], unreadCount: 0 } };
      } else {
        const notifications = await prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 });
        const unreadCount = notifications.filter(n => !n.read).length;
        result = { status: 200, body: { notifications, unreadCount } };
      }
    }
    // Dashboard (lightweight - sequential queries to avoid memory spikes)
    else if (url.pathname === '/api/dashboard' && req.method === 'GET') {
      const totalStudents = await prisma.student.count();
      const totalRooms = await prisma.room.count();
      const totalComplaints = await prisma.complaint.count();
      const activeStudents = await prisma.student.count({ where: { status: 'active' } });
      const pendingComplaints = await prisma.complaint.count({ where: { status: 'pending' } });
      const totalFees = await prisma.fee.count();
      result = { status: 200, body: {
        totalStudents, activeStudents, totalRooms, totalComplaints, pendingComplaints,
        totalFees,
        collectedFees: 0,
        pendingFees: 0,
        recentComplaints: [], recentFees: [], occupancyData: []
      }};
    }
    // Students (lightweight)
    else if (url.pathname === '/api/students' && req.method === 'GET') {
      const students = await prisma.student.findMany({ take: 50 });
      result = { status: 200, body: students };
    }
    // Announcements
    else if (url.pathname === '/api/announcements' && req.method === 'GET') {
      const announcements = await prisma.announcement.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
      result = { status: 200, body: announcements };
    }
    // Health check
    else if (url.pathname === '/api/health') {
      result = { status: 200, body: { status: 'ok', timestamp: new Date().toISOString() } };
    }
    // Seed
    else if (url.pathname === '/api/seed') {
      result = { status: 200, body: { message: 'Use the main Next.js app for seeding' } };
    }
    // Catch-all for other API routes  
    else if (url.pathname.startsWith('/api/')) {
      // Return empty data for unknown API routes
      result = { status: 200, body: [] };
    }
  } catch (err) {
    console.error('API Error:', err.message);
    result = { status: 500, body: { error: err.message } };
  }
  
  res.writeHead(result.status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(result.body));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Standalone API server running on port ${PORT}`);
});

// Keep alive
setInterval(() => { process.stdout.write('.'); }, 60000);
