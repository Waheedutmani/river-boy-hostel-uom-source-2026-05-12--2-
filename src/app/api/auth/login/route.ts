import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const MAX_FAILED_ATTEMPTS = 5

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body
    const userAgent = request.headers.get('user-agent') || undefined
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { email },
      include: { student: true },
    })

    if (!user) {
      // Log failed login - user not found
      await db.activityLog.create({
        data: {
          userId: null,
          userName: email,
          userRole: 'unknown',
          action: 'failed_login',
          category: 'auth',
          description: `Failed login attempt for non-existent email: ${email}`,
          ipAddress: ip,
          userAgent,
        },
      })

      // Create security alert for failed login
      await db.securityAlert.create({
        data: {
          type: 'failed_login',
          severity: 'medium',
          userName: email,
          description: `Failed login attempt with email: ${email}`,
          ipAddress: ip,
        },
      })

      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const hashedPassword = Buffer.from(password).toString('base64')
    if (user.password !== hashedPassword) {
      // Count recent failed attempts for this user
      const recentFailures = await db.activityLog.count({
        where: {
          userId: user.id,
          action: 'failed_login',
          createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) }, // Last 15 minutes
        },
      })

      // Log failed login
      await db.activityLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          action: 'failed_login',
          category: 'auth',
          description: `Failed login attempt for ${user.name} (${user.role})`,
          ipAddress: ip,
          userAgent,
          metadata: JSON.stringify({ attemptNumber: recentFailures + 1 }),
        },
      })

      // Determine severity based on attempt count
      let severity: string = 'medium'
      if (recentFailures + 1 >= MAX_FAILED_ATTEMPTS) {
        severity = 'critical'
      } else if (recentFailures + 1 >= 3) {
        severity = 'high'
      }

      // Create security alert
      await db.securityAlert.create({
        data: {
          type: recentFailures + 1 >= MAX_FAILED_ATTEMPTS ? 'account_locked' : 'failed_login',
          severity,
          userId: user.id,
          userName: user.name,
          description: recentFailures + 1 >= MAX_FAILED_ATTEMPTS
            ? `Account potentially locked: ${recentFailures + 1} failed login attempts for ${user.name} (${user.email})`
            : `Failed login attempt #${recentFailures + 1} for ${user.name} (${user.role})`,
          ipAddress: ip,
        },
      })

      const lockoutWarning = recentFailures + 1 >= 3
        ? ` Warning: ${MAX_FAILED_ATTEMPTS - recentFailures - 1} attempt(s) remaining before account flagging.`
        : ''

      return NextResponse.json({ error: `Invalid email or password.${lockoutWarning}` }, { status: 401 })
    }

    // Successful login - log it
    await db.activityLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'login',
        category: 'auth',
        description: `${user.role === 'admin' ? 'Admin' : 'Student'} logged in: ${user.name} (${user.email})`,
        ipAddress: ip,
        userAgent,
      },
    })

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        student: user.student,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Failed to login' }, { status: 500 })
  }
}
