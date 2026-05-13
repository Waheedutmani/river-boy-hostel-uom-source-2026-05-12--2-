import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const notices = await db.notice.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ notices })
  } catch (error) {
    console.error('Get notices error:', error)
    return NextResponse.json({ error: 'Failed to fetch notices' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, content, category, priority, createdBy } = body

    if (!title || !content || !category) {
      return NextResponse.json({ error: 'Missing required fields: title, content, category' }, { status: 400 })
    }

    const notice = await db.notice.create({
      data: {
        title,
        content,
        category,
        priority: priority || 'Normal',
        createdBy,
      },
    })

    return NextResponse.json({ notice }, { status: 201 })
  } catch (error) {
    console.error('Create notice error:', error)
    return NextResponse.json({ error: 'Failed to create notice' }, { status: 500 })
  }
}
