import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const application = await db.application.findUnique({
      where: { id },
      include: {
        student: { include: { user: true, room: { include: { hostel: true } } } },
        hostel: true,
      },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    return NextResponse.json({ application })
  } catch (error) {
    console.error('Get application error:', error)
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, adminRemark, preferredRoom, message } = body

    const application = await db.application.update({
      where: { id },
      data: { status, adminRemark, preferredRoom, message },
      include: {
        student: { include: { user: { select: { id: true, name: true, email: true } } } },
        hostel: true,
      },
    })

    return NextResponse.json({ application })
  } catch (error) {
    console.error('Update application error:', error)
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.application.delete({ where: { id } })
    return NextResponse.json({ message: 'Application deleted successfully' })
  } catch (error) {
    console.error('Delete application error:', error)
    return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 })
  }
}
