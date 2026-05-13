import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    let config = await db.lateFineConfig.findFirst({ where: { isActive: true } })
    if (!config) {
      config = await db.lateFineConfig.create({
        data: { gracePeriodDays: 5, finePerDay: 50, maxFine: 2000, isActive: true },
      })
    }
    return NextResponse.json({ config })
  } catch (error) {
    console.error('Get late fine config error:', error)
    return NextResponse.json({ error: 'Failed to fetch late fine config' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { gracePeriodDays, finePerDay, maxFine, isActive } = body

    let config = await db.lateFineConfig.findFirst({ where: { isActive: true } })

    const updateData: Record<string, unknown> = {}
    if (gracePeriodDays !== undefined) updateData.gracePeriodDays = parseInt(gracePeriodDays)
    if (finePerDay !== undefined) updateData.finePerDay = parseFloat(finePerDay)
    if (maxFine !== undefined) updateData.maxFine = parseFloat(maxFine)
    if (isActive !== undefined) updateData.isActive = isActive

    if (config) {
      config = await db.lateFineConfig.update({
        where: { id: config.id },
        data: updateData,
      })
    } else {
      config = await db.lateFineConfig.create({
        data: {
          gracePeriodDays: parseInt(gracePeriodDays) || 5,
          finePerDay: parseFloat(finePerDay) || 50,
          maxFine: parseFloat(maxFine) || 2000,
          isActive: isActive !== undefined ? isActive : true,
        },
      })
    }

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Update late fine config error:', error)
    return NextResponse.json({ error: 'Failed to update late fine config' }, { status: 500 })
  }
}
