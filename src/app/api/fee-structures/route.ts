import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const feeStructures = await db.feeStructure.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ feeStructures })
  } catch (error) {
    console.error('Get fee structures error:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch fee structures'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, amount, feeType, description, isActive } = body

    if (!name || !amount || !feeType) {
      return NextResponse.json({ error: 'Missing required fields: name, amount, feeType' }, { status: 400 })
    }

    const feeStructure = await db.feeStructure.create({
      data: {
        name,
        amount: parseFloat(amount),
        feeType,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json({ feeStructure }, { status: 201 })
  } catch (error) {
    console.error('Create fee structure error:', error)
    return NextResponse.json({ error: 'Failed to create fee structure' }, { status: 500 })
  }
}
