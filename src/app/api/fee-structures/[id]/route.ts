import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, amount, feeType, description, isActive } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (feeType !== undefined) updateData.feeType = feeType
    if (description !== undefined) updateData.description = description
    if (isActive !== undefined) updateData.isActive = isActive

    const feeStructure = await db.feeStructure.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ feeStructure })
  } catch (error) {
    console.error('Update fee structure error:', error)
    return NextResponse.json({ error: 'Failed to update fee structure' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.feeStructure.delete({ where: { id } })
    return NextResponse.json({ message: 'Fee structure deleted successfully' })
  } catch (error) {
    console.error('Delete fee structure error:', error)
    return NextResponse.json({ error: 'Failed to delete fee structure' }, { status: 500 })
  }
}
