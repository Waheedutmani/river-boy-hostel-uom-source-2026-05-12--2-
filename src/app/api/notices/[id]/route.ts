import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const notice = await db.notice.findUnique({ where: { id } })

    if (!notice) {
      return NextResponse.json({ error: 'Notice not found' }, { status: 404 })
    }

    return NextResponse.json({ notice })
  } catch (error) {
    console.error('Get notice error:', error)
    return NextResponse.json({ error: 'Failed to fetch notice' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, content, category, priority, createdBy } = body

    const notice = await db.notice.update({
      where: { id },
      data: { title, content, category, priority, createdBy },
    })

    return NextResponse.json({ notice })
  } catch (error) {
    console.error('Update notice error:', error)
    return NextResponse.json({ error: 'Failed to update notice' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.notice.delete({ where: { id } })
    return NextResponse.json({ message: 'Notice deleted successfully' })
  } catch (error) {
    console.error('Delete notice error:', error)
    return NextResponse.json({ error: 'Failed to delete notice' }, { status: 500 })
  }
}
