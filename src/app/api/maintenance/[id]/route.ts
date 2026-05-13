import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const maintenanceRequest = await db.maintenanceRequest.findUnique({
      where: { id },
      include: {
        room: { include: { hostel: true } },
        student: { include: { user: true } },
      },
    })

    if (!maintenanceRequest) {
      return NextResponse.json({ error: 'Maintenance request not found' }, { status: 404 })
    }

    return NextResponse.json({ maintenanceRequest })
  } catch (error) {
    console.error('Get maintenance request error:', error)
    return NextResponse.json({ error: 'Failed to fetch maintenance request' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, title, description, category, priority } = body

    const maintenanceRequest = await db.maintenanceRequest.update({
      where: { id },
      data: { status, title, description, category, priority },
      include: {
        room: { include: { hostel: true } },
        student: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    })

    return NextResponse.json({ maintenanceRequest })
  } catch (error) {
    console.error('Update maintenance request error:', error)
    return NextResponse.json({ error: 'Failed to update maintenance request' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.maintenanceRequest.delete({ where: { id } })
    return NextResponse.json({ message: 'Maintenance request deleted successfully' })
  } catch (error) {
    console.error('Delete maintenance request error:', error)
    return NextResponse.json({ error: 'Failed to delete maintenance request' }, { status: 500 })
  }
}
