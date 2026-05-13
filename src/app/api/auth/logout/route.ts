import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, userName, userRole } = body
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined

    if (userId && userName) {
      await db.activityLog.create({
        data: {
          userId,
          userName,
          userRole: userRole || 'unknown',
          action: 'logout',
          category: 'auth',
          description: `${userRole === 'admin' ? 'Admin' : 'Student'} logged out: ${userName}`,
          ipAddress: ip,
          userAgent,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout logging error:', error)
    return NextResponse.json({ success: true }) // Don't fail logout on logging error
  }
}
