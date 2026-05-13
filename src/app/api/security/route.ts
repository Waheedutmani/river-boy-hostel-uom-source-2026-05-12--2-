import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // ===================== SECURITY DASHBOARD STATS =====================
    if (action === 'dashboard-stats') {
      const now = new Date()
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      // Activity counts
      const totalActivities = await db.activityLog.count()
      const todayActivities = await db.activityLog.count({ where: { createdAt: { gte: last24h } } })
      const weekActivities = await db.activityLog.count({ where: { createdAt: { gte: last7d } } })

      // Login stats
      const totalLogins = await db.activityLog.count({ where: { action: 'login' } })
      const todayLogins = await db.activityLog.count({ where: { action: 'login', createdAt: { gte: last24h } } })
      const todayStudentLogins = await db.activityLog.count({ where: { action: 'login', userRole: 'student', createdAt: { gte: last24h } } })
      const todayAdminLogins = await db.activityLog.count({ where: { action: 'login', userRole: 'admin', createdAt: { gte: last24h } } })

      // Failed attempts
      const totalFailedAttempts = await db.activityLog.count({ where: { action: 'failed_login' } })
      const todayFailedAttempts = await db.activityLog.count({ where: { action: 'failed_login', createdAt: { gte: last24h } } })
      const weekFailedAttempts = await db.activityLog.count({ where: { action: 'failed_login', createdAt: { gte: last7d } } })

      // Security alerts
      const totalAlerts = await db.securityAlert.count()
      const unresolvedAlerts = await db.securityAlert.count({ where: { isResolved: false } })
      const criticalAlerts = await db.securityAlert.count({ where: { severity: 'critical', isResolved: false } })
      const highAlerts = await db.securityAlert.count({ where: { severity: 'high', isResolved: false } })
      const mediumAlerts = await db.securityAlert.count({ where: { severity: 'medium', isResolved: false } })
      const lowAlerts = await db.securityAlert.count({ where: { severity: 'low', isResolved: false } })

      // Recent alerts
      const recentAlerts = await db.securityAlert.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      })

      // Recent activity logs
      const recentLogs = await db.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      })

      // Active users (logged in within last 24h)
      const activeUsers = await db.activityLog.findMany({
        where: { action: 'login', createdAt: { gte: last24h } },
        select: { userId: true, userName: true, userRole: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      })

      // Unique active users count
      const uniqueActiveUserIds = new Set(activeUsers.map(u => u.userId).filter(Boolean))

      // Category breakdown for today
      const todayCategoryLogs = await db.activityLog.findMany({
        where: { createdAt: { gte: last24h } },
        select: { category: true },
      })
      const categoryBreakdown: Record<string, number> = {}
      todayCategoryLogs.forEach(l => { categoryBreakdown[l.category] = (categoryBreakdown[l.category] || 0) + 1 })

      // Action breakdown for today
      const todayActionLogs = await db.activityLog.findMany({
        where: { createdAt: { gte: last24h } },
        select: { action: true },
      })
      const actionBreakdown: Record<string, number> = {}
      todayActionLogs.forEach(l => { actionBreakdown[l.action] = (actionBreakdown[l.action] || 0) + 1 })

      // Hourly login activity (last 24h)
      const hourlyLogins: { hour: number; count: number }[] = []
      for (let h = 0; h < 24; h++) {
        const hourStart = new Date(now)
        hourStart.setHours(h, 0, 0, 0)
        const hourEnd = new Date(now)
        hourEnd.setHours(h, 59, 59, 999)
        const count = await db.activityLog.count({
          where: { action: 'login', createdAt: { gte: hourStart, lte: hourEnd } },
        })
        if (count > 0) hourlyLogins.push({ hour: h, count })
      }

      return NextResponse.json({
        totalActivities, todayActivities, weekActivities,
        totalLogins, todayLogins, todayStudentLogins, todayAdminLogins,
        totalFailedAttempts, todayFailedAttempts, weekFailedAttempts,
        totalAlerts, unresolvedAlerts, criticalAlerts, highAlerts, mediumAlerts, lowAlerts,
        recentAlerts, recentLogs,
        activeUsers: activeUsers.slice(0, 15),
        uniqueActiveUsers: uniqueActiveUserIds.size,
        categoryBreakdown, actionBreakdown,
        hourlyLogins,
      })
    }

    // ===================== ACTIVITY LOGS =====================
    if (action === 'activity-logs') {
      const category = searchParams.get('category') || 'all'
      const actionType = searchParams.get('actionType') || 'all'
      const role = searchParams.get('role') || 'all'
      const search = searchParams.get('search') || ''
      const limit = parseInt(searchParams.get('limit') || '50')
      const offset = parseInt(searchParams.get('offset') || '0')

      const where: Record<string, unknown> = {}
      if (category !== 'all') where.category = category
      if (actionType !== 'all') where.action = actionType
      if (role !== 'all') where.userRole = role
      if (search) {
        where.OR = [
          { userName: { contains: search } },
          { description: { contains: search } },
          { action: { contains: search } },
        ]
      }

      const [logs, total] = await Promise.all([
        db.activityLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit, skip: offset }),
        db.activityLog.count({ where }),
      ])

      return NextResponse.json({ logs, total })
    }

    // ===================== SECURITY ALERTS =====================
    if (action === 'alerts') {
      const severity = searchParams.get('severity') || 'all'
      const type = searchParams.get('type') || 'all'
      const resolved = searchParams.get('resolved') // 'true', 'false', or null for all
      const limit = parseInt(searchParams.get('limit') || '50')

      const where: Record<string, unknown> = {}
      if (severity !== 'all') where.severity = severity
      if (type !== 'all') where.type = type
      if (resolved !== null && resolved !== undefined) where.isResolved = resolved === 'true'

      const [alerts, total, unresolvedCount] = await Promise.all([
        db.securityAlert.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit }),
        db.securityAlert.count({ where }),
        db.securityAlert.count({ where: { isResolved: false } }),
      ])

      return NextResponse.json({ alerts, total, unresolvedCount })
    }

    // ===================== STUDENT ACTIVITY (for student portal) =====================
    if (action === 'my-activity') {
      const userId = searchParams.get('userId')
      if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

      const [logs, alertCount] = await Promise.all([
        db.activityLog.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 30,
        }),
        db.securityAlert.count({ where: { userId, isResolved: false } }),
      ])

      // Login stats for this student
      const totalLogins = await db.activityLog.count({ where: { userId, action: 'login' } })
      const lastLogin = await db.activityLog.findFirst({
        where: { userId, action: 'login' },
        orderBy: { createdAt: 'desc' },
      })
      const failedAttempts = await db.activityLog.count({
        where: { userId, action: 'failed_login' },
      })

      return NextResponse.json({ logs, alertCount, totalLogins, lastLogin, failedAttempts })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Security API error:', error)
    return NextResponse.json({ error: 'Security operation failed' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    // ===================== LOG ACTIVITY =====================
    if (action === 'log-activity') {
      const { userId, userName, userRole, activityAction, category, description, ipAddress, userAgent, metadata } = body

      const log = await db.activityLog.create({
        data: {
          userId: userId || null,
          userName: userName || 'Unknown',
          userRole: userRole || 'system',
          action: activityAction,
          category: category || 'system',
          description: description || '',
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      })

      return NextResponse.json({ success: true, log })
    }

    // ===================== CREATE SECURITY ALERT =====================
    if (action === 'create-alert') {
      const { type, severity, userId, userName, description, ipAddress } = body

      const alert = await db.securityAlert.create({
        data: {
          type: type || 'suspicious_activity',
          severity: severity || 'medium',
          userId: userId || null,
          userName: userName || null,
          description: description || '',
          ipAddress: ipAddress || null,
        },
      })

      return NextResponse.json({ success: true, alert })
    }

    // ===================== RESOLVE ALERT =====================
    if (action === 'resolve-alert') {
      const { alertId, resolvedBy } = body
      if (!alertId) return NextResponse.json({ error: 'alertId required' }, { status: 400 })

      const alert = await db.securityAlert.update({
        where: { id: alertId },
        data: {
          isResolved: true,
          resolvedBy: resolvedBy || 'Admin',
          resolvedAt: new Date(),
        },
      })

      // Log the resolution
      await db.activityLog.create({
        data: {
          userId: null,
          userName: resolvedBy || 'Admin',
          userRole: 'admin',
          action: 'resolve_alert',
          category: 'system',
          description: `Resolved security alert: ${alert.type} - ${alert.description}`,
        },
      })

      return NextResponse.json({ success: true, alert })
    }

    // ===================== RESOLVE ALL ALERTS =====================
    if (action === 'resolve-all-alerts') {
      const { resolvedBy } = body
      const result = await db.securityAlert.updateMany({
        where: { isResolved: false },
        data: {
          isResolved: true,
          resolvedBy: resolvedBy || 'Admin',
          resolvedAt: new Date(),
        },
      })

      await db.activityLog.create({
        data: {
          userId: null,
          userName: resolvedBy || 'Admin',
          userRole: 'admin',
          action: 'resolve_alert',
          category: 'system',
          description: `Resolved all ${result.count} pending security alerts`,
        },
      })

      return NextResponse.json({ success: true, resolved: result.count })
    }

    // ===================== FORGOT PASSWORD =====================
    if (action === 'forgot-password') {
      const { email } = body
      if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

      const user = await db.user.findUnique({ where: { email } })
      if (!user) {
        // Don't reveal whether user exists for security
        return NextResponse.json({ success: true, message: 'If an account with this email exists, a password reset has been processed.' })
      }

      // For this system, we'll reset the password to a default and log it
      const tempPassword = `rbh_${Date.now().toString(36)}`
      const hashedTempPassword = Buffer.from(tempPassword).toString('base64')

      await db.user.update({
        where: { id: user.id },
        data: { password: hashedTempPassword },
      })

      // Log the password reset
      await db.activityLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          action: 'password_change',
          category: 'auth',
          description: `Password reset requested for ${user.email}`,
        },
      })

      // Create security alert for password change
      await db.securityAlert.create({
        data: {
          type: 'password_breach',
          severity: 'medium',
          userId: user.id,
          userName: user.name,
          description: `Password reset requested for account ${user.email}`,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Password has been reset. Contact admin for your new password.',
        tempPassword, // In production, this would be sent via email
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Security POST error:', error)
    return NextResponse.json({ error: 'Security operation failed' }, { status: 500 })
  }
}
