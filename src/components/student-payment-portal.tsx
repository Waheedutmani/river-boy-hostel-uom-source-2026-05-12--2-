'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Receipt, DollarSign, CheckCircle2, AlertCircle, Clock, TrendingUp,
  Download, Eye, Home, Activity, Building2, Phone, CreditCard,
  ChevronLeft, ChevronRight, Filter, Printer, FileCheck, Calendar,
  Wallet, ArrowUpRight, Search, BarChart3, RefreshCw
} from 'lucide-react'

import {
  formatPKR, apiFetch,
  FeeStatusBadge, PaymentMethodBadge, PaymentStatusBadge,
  StatCard, ListSkeleton, DashboardSkeleton, EmptyState,
  MONTHS, FEE_TYPES, PAYMENT_METHODS,
  type FeeType, type PaymentType,
} from '@/components/shared-components'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

import type { UserType } from '@/app/page'

// ======================== ANIMATED COUNTER HOOK ========================
function useAnimatedCounter(target: number, duration = 800) {
  const [count, setCount] = useState(() => target)
  useEffect(() => {
    if (target === 0) return
    let rafId: number
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) rafId = requestAnimationFrame(animate)
    }
    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [target, duration])
  return count
}

// ======================== ANIMATED STAT CARD ========================
function AnimatedStatCard({ title, value, icon, color, bg, isCurrency = false, numericValue = 0 }: {
  title: string; value: string | number; icon: React.ReactNode; color: string; bg: string; isCurrency?: boolean; numericValue?: number
}) {
  const animatedCount = useAnimatedCounter(typeof value === 'number' ? value : numericValue)
  const displayValue = isCurrency ? formatPKR(numericValue) : (typeof value === 'number' ? animatedCount : value)

  return (
    <div className="dashboard-stat-card stat-card-shimmer group">
      <div className="flex items-center gap-4 relative z-10">
        <div className={`stat-icon ${bg} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
          <div className={color}>{icon}</div>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold truncate mt-0.5 animate-counter">{displayValue}</p>
        </div>
      </div>
    </div>
  )
}

// ======================== MAIN EXPORT ========================
export function StudentPaymentPortal({ user }: { user: UserType }) {
  const [fees, setFees] = useState<FeeType[]>([])
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [receiptFee, setReceiptFee] = useState<FeeType | null>(null)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 8
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    feeId: '',
    amount: 0,
    paymentMethod: 'Cash',
    referenceNo: '',
    notes: ''
  })

  // ======================== DATA LOADING ========================
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [feesRes, studentsRes] = await Promise.all([
        apiFetch<{ fees: FeeType[] }>('/api/fees'),
        apiFetch<{ students: any[] }>('/api/students'),
      ])
      const me = studentsRes.students.find((s: any) => s.userId === user.id) || null
      setStudent(me)
      setFees(feesRes.fees.filter(f => f.studentId === me?.id))
    } catch {
      toast.error('Failed to load fees')
    }
    setLoading(false)
  }, [user.id])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (cancelled) return
      await load()
    })()
    return () => { cancelled = true }
  }, [load])

  // ======================== COMPUTED VALUES ========================
  const totalFees = fees.reduce((s, f) => s + f.amount, 0)
  const paidFees = fees.filter(f => f.status === 'Paid').reduce((s, f) => s + f.amount, 0)
  const pendingFees = fees.filter(f => f.status !== 'Paid').reduce((s, f) => s + f.amount - (f.partiallyPaidAmount || 0), 0)
  const totalFines = fees.reduce((s, f) => s + (f.lateFine || 0), 0)
  const paidFines = fees.filter(f => f.status === 'Paid').reduce((s, f) => s + (f.lateFine || 0), 0)
  const paidPercent = totalFees > 0 ? Math.round((paidFees / totalFees) * 100) : 0

  // Next due date
  const pendingWithDue = fees
    .filter(f => f.status !== 'Paid' && f.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
  const nextDueDate = pendingWithDue.length > 0 ? pendingWithDue[0].dueDate : null

  // Fee type breakdown for pie chart
  const feeTypeMap: Record<string, number> = {}
  for (const f of fees) {
    feeTypeMap[f.feeType] = (feeTypeMap[f.feeType] || 0) + f.amount
  }
  const feeTypeData = Object.entries(feeTypeMap).map(([name, value]) => ({ name, value }))
  const pieColors = ['#1e3a5f', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#3b82f6', '#ec4899', '#14b8a6']

  // Payment timeline
  const paidFeesList = fees
    .filter(f => f.status === 'Paid' && f.paidDate)
    .sort((a, b) => new Date(b.paidDate!).getTime() - new Date(a.paidDate!).getTime())

  // Monthly breakdown for bar chart (last 6 months)
  const monthlyBreakdown = (() => {
    const now = new Date()
    const months: { label: string; month: string; year: number; paid: number; pending: number; overdue: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = MONTHS[d.getMonth()]
      const year = d.getFullYear()
      const monthFees = fees.filter(f => f.month === monthName && f.year === year)
      months.push({
        label: `${monthName.slice(0, 3)} ${year}`,
        month: monthName,
        year,
        paid: monthFees.filter(f => f.status === 'Paid').reduce((s, f) => s + f.amount, 0),
        pending: monthFees.filter(f => f.status === 'Pending' || f.status === 'Partially Paid').reduce((s, f) => s + f.amount, 0),
        overdue: monthFees.filter(f => f.status === 'Overdue').reduce((s, f) => s + f.amount, 0),
      })
    }
    return months
  })()

  // Filtered fees with pagination
  const filtered = fees.filter(f => {
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter
    const matchesSearch = !searchQuery.trim() ||
      f.feeType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.month.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(f.year).includes(searchQuery)
    return matchesStatus && matchesSearch
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginatedFees = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const startIdx = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const endIdx = Math.min(safePage * PAGE_SIZE, filtered.length)

  // Unpaid fees for payment submission
  const unpaidFees = fees.filter(f => f.status !== 'Paid')

  // Payment form handlers
  const handleSelectFee = (feeId: string) => {
    const selected = unpaidFees.find(f => f.id === feeId)
    if (selected) {
      const remaining = selected.amount + (selected.lateFine || 0) - (selected.partiallyPaidAmount || 0)
      setPaymentForm(prev => ({
        ...prev,
        feeId,
        amount: remaining
      }))
    }
  }

  const handleSubmitPayment = async () => {
    if (!paymentForm.feeId) {
      toast.error('Please select a fee to pay')
      return
    }
    if (paymentForm.amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    if (['Bank Transfer', 'EasyPaisa', 'JazzCash'].includes(paymentForm.paymentMethod) && !paymentForm.referenceNo.trim()) {
      toast.error('Reference number is required for the selected payment method')
      return
    }
    try {
      setSubmitting(true)
      await apiFetch('/api/payments', {
        method: 'POST',
        body: JSON.stringify({
          feeId: paymentForm.feeId,
          amount: paymentForm.amount,
          paymentMethod: paymentForm.paymentMethod,
          referenceNo: paymentForm.referenceNo || null,
          paidBy: user.name
        })
      })
      toast.success('Payment submitted successfully! It will be verified by admin.')
      setPaymentDialogOpen(false)
      setPaymentForm({ feeId: '', amount: 0, paymentMethod: 'Cash', referenceNo: '', notes: '' })
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit payment')
    } finally {
      setSubmitting(false)
    }
  }

  // ======================== RECEIPT FUNCTIONS ========================
  const generateReceiptHtml = (fee: FeeType) => {
    const receiptNo = fee.receiptNo || `RCB-${fee.year}-${fee.id.slice(-6)}`
    const roomNumber = fee.student?.room?.number || student?.room?.number || 'N/A'
    const hostelName = fee.student?.room?.hostel?.name || student?.room?.hostel?.name || 'River Boy Hostel'
    return `<!DOCTYPE html><html><head><title>Receipt - ${receiptNo}</title><style>
      body{font-family:Arial,sans-serif;padding:40px;max-width:500px;margin:auto;color:#1a1a1a}
      h1{text-align:center;color:#1e3a5f;margin:0;font-size:22px}
      p.sub{text-align:center;color:#666;margin:4px 0 20px;font-size:13px}
      .divider{border-top:2px dashed #ccc;margin:16px 0}
      .divider-double{border-top:3px double #1e3a5f;margin:16px 0;padding-top:12px}
      .row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px}
      .row .label{color:#666}
      .row .value{font-weight:600}
      .total{font-size:18px;font-weight:700;color:#1e3a5f}
      .footer{text-align:center;margin-top:24px;font-size:11px;color:#999}
      .signature{text-align:center;margin-top:40px;padding-top:20px}
      .signature-line{border-top:1px dashed #999;width:200px;margin:0 auto 8px}
      .signature p{font-size:12px;color:#666;margin:2px 0}
      .logo-box{width:48px;height:48px;background:linear-gradient(135deg,#1e3a5f,#22c55e);border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px}
      .logo-icon{color:white;font-size:24px;font-weight:bold}
      .gradient-line{height:3px;background:linear-gradient(to right,#1e3a5f,#22c55e);margin:12px auto;width:80px;border-radius:2px}
      .fine{color:#ef4444}
    </style></head><body>
      <div class="logo-box"><span class="logo-icon">&#127968;</span></div>
      <h1>River Boy Hostel UOM</h1>
      <p class="sub">University of Malakand</p>
      <div class="gradient-line"></div>
      <div class="row"><span class="label">Receipt No:</span><span class="value" style="font-family:monospace">${receiptNo}</span></div>
      <div class="row"><span class="label">Date:</span><span class="value">${fee.paidDate ? new Date(fee.paidDate).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span></div>
      <div class="divider"></div>
      <div class="row"><span class="label">Student Name:</span><span class="value">${fee.student?.name || student?.name || 'N/A'}</span></div>
      <div class="row"><span class="label">Roll No:</span><span class="value">${fee.student?.rollNo || student?.rollNo || 'N/A'}</span></div>
      <div class="row"><span class="label">Department:</span><span class="value">${fee.student?.department || student?.department || 'N/A'}</span></div>
      <div class="row"><span class="label">Room Number:</span><span class="value">${roomNumber}</span></div>
      <div class="divider"></div>
      <div class="row"><span class="label">Fee Type:</span><span class="value">${fee.feeType}</span></div>
      <div class="row"><span class="label">Period:</span><span class="value">${fee.month} ${fee.year}</span></div>
      ${(fee.lateFine && fee.lateFine > 0) ? `<div class="row fine"><span class="label">Late Fine:</span><span class="value">${formatPKR(fee.lateFine)}</span></div>` : ''}
      ${fee.paymentMethod ? `<div class="row"><span class="label">Payment Method:</span><span class="value">${fee.paymentMethod}</span></div>` : ''}
      <div class="row"><span class="label">Status:</span><span class="value" style="color:#22c55e">${fee.status}</span></div>
      <div class="divider-double"></div>
      <div class="row total"><span>Total Amount:</span><span>${formatPKR(fee.amount + (fee.lateFine || 0))}</span></div>
      <div class="signature">
        <div class="signature-line"></div>
        <p>Authorized Signatory</p>
        <p style="font-weight:600;color:#1e3a5f">River Boy Hostel UOM</p>
      </div>
      <div class="footer"><p>This is a computer-generated receipt.</p><p>River Boy Hostel UOM - University of Malakand</p></div>
    </body></html>`
  }

  const printReceipt = (fee: FeeType) => {
    const receiptHtml = generateReceiptHtml(fee)
    const w = window.open('', '_blank')
    if (w) {
      w.document.write(receiptHtml)
      w.document.close()
      w.print()
    }
  }

  const downloadReceipt = (fee: FeeType) => {
    const receiptHtml = generateReceiptHtml(fee)
    const receiptNo = fee.receiptNo || `RCB-${fee.year}-${fee.id.slice(-6)}`
    const blob = new Blob([receiptHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt-${receiptNo}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ======================== LOADING STATE ========================
  if (loading) return <DashboardSkeleton />

  // ======================== EMPTY STATE ========================
  if (fees.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <EmptyState
          icon={<Receipt className="h-8 w-8" />}
          title="No Fee Records"
          description="You don't have any fee records yet. Fee records will appear here once they are assigned by the hostel administration."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ==================== 1. HERO BANNER ==================== */}
      <div className="hostel-hero-bg rounded-2xl p-4 sm:p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/60 via-transparent to-[#0a1628]/30" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
              <Receipt className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">My Fee & Payment Portal</h2>
              <p className="text-blue-200/80 text-xs sm:text-sm">Track your fees, payments, and dues</p>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 2. FIVE STAT CARDS ==================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 stagger-children">
        <AnimatedStatCard
          title="Total Hostel Fee"
          value={formatPKR(totalFees)}
          icon={<Receipt className="h-5 w-5" />}
          color="text-[#1e3a5f]"
          bg="bg-blue-50 dark:bg-blue-900/20"
          isCurrency
          numericValue={totalFees}
        />
        <AnimatedStatCard
          title="Paid Amount"
          value={formatPKR(paidFees)}
          icon={<CheckCircle2 className="h-5 w-5" />}
          color="text-green-600"
          bg="bg-green-50 dark:bg-green-900/20"
          isCurrency
          numericValue={paidFees}
        />
        <AnimatedStatCard
          title="Remaining Dues"
          value={formatPKR(pendingFees)}
          icon={<AlertCircle className="h-5 w-5" />}
          color="text-amber-600"
          bg="bg-amber-50 dark:bg-amber-900/20"
          isCurrency
          numericValue={pendingFees}
        />
        <AnimatedStatCard
          title="Late Fine"
          value={formatPKR(totalFines)}
          icon={<AlertCircle className="h-5 w-5" />}
          color="text-red-600"
          bg="bg-red-50 dark:bg-red-900/20"
          isCurrency
          numericValue={totalFines}
        />
        <AnimatedStatCard
          title="Next Due Date"
          value={nextDueDate ? new Date(nextDueDate).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }) : 'N/A'}
          icon={<Clock className="h-5 w-5" />}
          color="text-purple-600"
          bg="bg-purple-50 dark:bg-purple-900/20"
        />
      </div>

      {/* ==================== 3. FEE SUMMARY WITH PROGRESS ==================== */}
      <Card className="premium-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <TrendingUp className="h-4 w-4 text-[#1e3a5f]" /> Fee Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Payment Progress</span>
            <span className="text-sm font-bold">{paidPercent}%</span>
          </div>
          <div className="premium-progress h-3 mb-3">
            <div
              className="premium-progress-bar bg-gradient-to-r from-green-500 to-green-400"
              style={{ width: `${paidPercent}%`, transition: 'width 1s ease-in-out' }}
            />
          </div>
          <p className="text-xs text-muted-foreground mb-3">{paidPercent}% paid</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
              <p className="text-xs text-muted-foreground">Total Fee</p>
              <p className="font-bold text-[#1e3a5f] dark:text-blue-300 text-sm">{formatPKR(totalFees)}</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-xl">
              <p className="text-xs text-muted-foreground">Paid</p>
              <p className="font-bold text-green-600 dark:text-green-400 text-sm">{formatPKR(paidFees)}</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl">
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="font-bold text-amber-600 dark:text-amber-400 text-sm">{formatPKR(pendingFees)}</p>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-xl">
              <p className="text-xs text-muted-foreground">Late Fines</p>
              <p className="font-bold text-red-600 dark:text-red-400 text-sm">{formatPKR(totalFines - paidFines)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ==================== 4. TWO-COLUMN SECTION ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger-children">
        {/* Fee Type Breakdown PieChart */}
        <Card className="chart-container premium-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Receipt className="h-4 w-4 text-[#1e3a5f]" /> Fee Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feeTypeData.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={feeTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="value"
                      stroke="none"
                      animationBegin={0}
                      animationDuration={600}
                    >
                      {feeTypeData.map((_, index) => (
                        <Cell key={index} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '0.75rem' }}
                      formatter={(value: number) => [formatPKR(value), 'Amount']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 flex-1 w-full">
                  {feeTypeData.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: pieColors[idx % pieColors.length] }}
                        />
                        <span className="text-sm truncate">{item.name}</span>
                      </div>
                      <span className="text-sm font-bold shrink-0">{formatPKR(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[180px] text-muted-foreground text-sm">
                No fee records
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods Info */}
        <Card className="premium-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <DollarSign className="h-4 w-4 text-[#1e3a5f]" /> Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 rounded-xl border bg-green-50/50 dark:bg-green-900/10 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Cash Payment</p>
                  <p className="text-xs text-muted-foreground">Pay directly at hostel office</p>
                </div>
              </div>
              <div className="p-3 rounded-xl border bg-blue-50/50 dark:bg-blue-900/10 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Bank Transfer</p>
                  <p className="text-xs text-muted-foreground">Transfer to hostel bank account</p>
                </div>
              </div>
              <div className="p-3 rounded-xl border bg-purple-50/50 dark:bg-purple-900/10 flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <Phone className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">EasyPaisa</p>
                  <p className="text-xs text-muted-foreground">Mobile wallet payment</p>
                </div>
              </div>
              <div className="p-3 rounded-xl border bg-red-50/50 dark:bg-red-900/10 flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <Phone className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">JazzCash</p>
                  <p className="text-xs text-muted-foreground">Mobile wallet payment</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ==================== 5. MONTHLY FEE BREAKDOWN BAR CHART ==================== */}
      <Card className="chart-container premium-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <BarChart3 className="h-4 w-4 text-[#1e3a5f]" /> Monthly Fee Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyBreakdown.some(m => m.paid + m.pending + m.overdue > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyBreakdown} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  axisLine={{ stroke: 'var(--border)' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickFormatter={(val: number) => `${Math.round(val / 1000)}k`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '0.75rem',
                    border: '1px solid var(--border)',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number, name: string) => [formatPKR(value), name]}
                />
                <Bar dataKey="paid" name="Paid" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="overdue" name="Overdue" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
              No monthly data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* ==================== SUBMIT PAYMENT SECTION ==================== */}
      <Card className="premium-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Wallet className="h-4 w-4 text-green-600" />
                Submit Payment
              </CardTitle>
              <CardDescription className="text-xs mt-1">Submit your fee payment for admin verification</CardDescription>
            </div>
            <Button
              className="btn-green-glow text-white gap-2 text-xs sm:text-sm"
              onClick={() => {
                setPaymentForm({ feeId: '', amount: 0, paymentMethod: 'Cash', referenceNo: '', notes: '' })
                setPaymentDialogOpen(true)
              }}
              disabled={unpaidFees.length === 0}
            >
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Submit</span> Payment
            </Button>
          </div>
          {unpaidFees.length === 0 && (
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-300">All fees are paid! No pending payments.</p>
            </div>
          )}
          {unpaidFees.length > 0 && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {unpaidFees.slice(0, 4).map(f => (
                <div key={f.id} className="p-3 rounded-xl border bg-amber-50/50 dark:bg-amber-900/10 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{f.feeType}</p>
                    <p className="text-xs text-muted-foreground">{f.month} {f.year}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">{formatPKR(f.amount + (f.lateFine || 0))}</p>
                    <FeeStatusBadge status={f.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* ==================== 6. PAYMENT HISTORY TIMELINE ==================== */}
      {paidFeesList.length > 0 && (
        <Card className="premium-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Activity className="h-4 w-4 text-green-500" /> Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border/60" />
              <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                {paidFeesList.map((f, idx) => (
                  <div
                    key={f.id}
                    className="flex items-start gap-3 relative animate-fade-in"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="w-[30px] h-[30px] rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 z-10 border-2 border-background">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">
                          {f.feeType} - {f.month} {f.year}
                        </p>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400 shrink-0">
                          {formatPKR(f.amount + (f.lateFine || 0))}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          {f.paidDate
                            ? new Date(f.paidDate).toLocaleDateString('en-PK', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : ''}
                        </span>
                        {f.paymentMethod && (
                          <PaymentMethodBadge method={f.paymentMethod} />
                        )}
                        {f.lateFine && f.lateFine > 0 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 text-red-600 border-red-200 dark:text-red-400 dark:border-red-800"
                          >
                            Fine: {formatPKR(f.lateFine)}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1 h-6 text-xs text-green-600 hover:text-green-700 p-0"
                        onClick={() => setReceiptFee(f)}
                      >
                        <Eye className="h-3 w-3 mr-1" /> View Receipt
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================== 7. FEE RECORDS WITH FILTERS ==================== */}
      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44 premium-input">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
            <SelectItem value="Partially Paid">Partially Paid</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search fees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 premium-input"
          />
        </div>
        <span className="text-sm text-muted-foreground shrink-0">
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block chart-container overflow-hidden">
        <Table className="premium-table">
          <TableHeader>
            <TableRow>
              <TableHead>Fee Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Fine</TableHead>
              <TableHead>Month</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Paid Date</TableHead>
              <TableHead className="text-right">Receipt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedFees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  No fee records found
                </TableCell>
              </TableRow>
            ) : (
              paginatedFees.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.feeType}</TableCell>
                  <TableCell className="font-bold">{formatPKR(f.amount)}</TableCell>
                  <TableCell>
                    {f.lateFine && f.lateFine > 0 ? (
                      <span className="text-red-600 font-medium">{formatPKR(f.lateFine)}</span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{f.month}</TableCell>
                  <TableCell>{f.year}</TableCell>
                  <TableCell>
                    <FeeStatusBadge status={f.status} />
                  </TableCell>
                  <TableCell>
                    {f.paymentMethod ? (
                      <PaymentMethodBadge method={f.paymentMethod} />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {f.paidDate ? new Date(f.paidDate).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {f.status === 'Paid' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReceiptFee(f)}
                        className="gap-1 text-green-600 hover:text-green-700"
                      >
                        <Eye className="h-4 w-4" />
                        Receipt
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 md:hidden gap-4 stagger-children">
        {paginatedFees.length === 0 ? (
          <div className="premium-card p-8 text-center">
            <p className="text-muted-foreground text-sm">No fee records found</p>
          </div>
        ) : (
          paginatedFees.map((f) => (
            <div key={f.id} className="premium-card p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{f.feeType}</h3>
                  <p className="text-sm text-muted-foreground">
                    {f.month} {f.year}
                  </p>
                </div>
                <FeeStatusBadge status={f.status} />
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg font-bold">{formatPKR(f.amount + (f.lateFine || 0))}</span>
                {f.paymentMethod && <PaymentMethodBadge method={f.paymentMethod} />}
              </div>
              {f.lateFine && f.lateFine > 0 && (
                <p className="text-xs text-red-600 mb-2">
                  Includes late fine: {formatPKR(f.lateFine)}
                </p>
              )}
              {f.paidDate && (
                <p className="text-xs text-muted-foreground mb-2">
                  Paid: {new Date(f.paidDate).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
              {f.status === 'Paid' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setReceiptFee(f)}
                  className="gap-1 w-full"
                >
                  <Eye className="h-3.5 w-3.5" /> Receipt
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Showing {startIdx}-{endIdx} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <span className="text-sm font-medium px-2">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="gap-1"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ==================== 8. RECEIPT DIALOG ==================== */}
      <Dialog open={!!receiptFee} onOpenChange={() => setReceiptFee(null)}>
        <DialogContent className="max-w-md animate-bounce-in">
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
          </DialogHeader>
          {receiptFee && (
            <div className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6">
              {/* Center Header */}
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#1e3a5f] to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Home className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-[#1e3a5f] dark:text-blue-300">
                  River Boy Hostel UOM
                </h2>
                <p className="text-sm text-muted-foreground">University of Malakand</p>
                <div className="w-16 h-0.5 bg-gradient-to-r from-[#1e3a5f] to-green-500 mx-auto mt-2" />
              </div>

              {/* Receipt Info */}
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receipt No:</span>
                  <span className="font-mono">
                    {receiptFee.receiptNo || `RCB-${receiptFee.year}-${receiptFee.id.slice(-6)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span>
                    {receiptFee.paidDate
                      ? new Date(receiptFee.paidDate).toLocaleDateString('en-PK', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Student Info */}
              <div className="border-t border-dashed pt-3 space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Student:</span>
                  <span className="font-medium">
                    {receiptFee.student?.name || student?.name || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Roll No:</span>
                  <span>{receiptFee.student?.rollNo || student?.rollNo || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department:</span>
                  <span>{receiptFee.student?.department || student?.department || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Room Number:</span>
                  <span>
                    {receiptFee.student?.room?.number || student?.room?.number || '-'}
                  </span>
                </div>
              </div>

              {/* Fee Details */}
              <div className="border-t border-dashed pt-3 space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee Type:</span>
                  <span>{receiptFee.feeType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Period:</span>
                  <span>
                    {receiptFee.month} {receiptFee.year}
                  </span>
                </div>
                {receiptFee.lateFine && receiptFee.lateFine > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span className="text-muted-foreground">Late Fine:</span>
                    <span>{formatPKR(receiptFee.lateFine)}</span>
                  </div>
                )}
                {receiptFee.paymentMethod && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Method:</span>
                    <span>{receiptFee.paymentMethod}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="text-green-700 font-medium">{receiptFee.status}</span>
                </div>
              </div>

              {/* Total */}
              <div className="border-t-2 border-[#1e3a5f] pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-[#1e3a5f]">
                    {formatPKR(receiptFee.amount + (receiptFee.lateFine || 0))}
                  </span>
                </div>
              </div>

              {/* Admin Signature Section */}
              <div className="mt-6 text-center">
                <div className="border-t border-dashed pt-4 mx-auto w-48">
                  <p className="text-xs text-muted-foreground">Authorized Signatory</p>
                  <p className="text-xs font-semibold text-[#1e3a5f] dark:text-blue-300 mt-1">
                    River Boy Hostel UOM
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground">
                  This is a computer-generated receipt.
                </p>
                <p className="text-xs text-muted-foreground">River Boy Hostel UOM</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs gap-1"
                  onClick={() => printReceipt(receiptFee)}
                >
                  <Printer className="h-3 w-3" /> Print
                </Button>
                <Button
                  size="sm"
                  className="flex-1 text-xs gap-1 bg-[#1e3a5f] hover:bg-[#16304f]"
                  onClick={() => downloadReceipt(receiptFee)}
                >
                  <FileCheck className="h-3 w-3" /> Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ==================== PAYMENT SUBMISSION DIALOG ==================== */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-md animate-bounce-in">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" /> Submit Payment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Fee *</Label>
              <Select value={paymentForm.feeId} onValueChange={handleSelectFee}>
                <SelectTrigger className="premium-input">
                  <SelectValue placeholder="Choose a fee to pay..." />
                </SelectTrigger>
                <SelectContent>
                  {unpaidFees.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.feeType} - {f.month} {f.year} ({formatPKR(f.amount + (f.lateFine || 0))})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {paymentForm.feeId && (
              <div className="p-3 bg-muted/30 rounded-xl text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee Amount:</span>
                  <span className="font-medium">{formatPKR(unpaidFees.find(f => f.id === paymentForm.feeId)?.amount || 0)}</span>
                </div>
                {(unpaidFees.find(f => f.id === paymentForm.feeId)?.lateFine || 0) > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Late Fine:</span>
                    <span className="font-medium">{formatPKR(unpaidFees.find(f => f.id === paymentForm.feeId)?.lateFine || 0)}</span>
                  </div>
                )}
                {(unpaidFees.find(f => f.id === paymentForm.feeId)?.partiallyPaidAmount || 0) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Already Paid:</span>
                    <span className="font-medium">{formatPKR(unpaidFees.find(f => f.id === paymentForm.feeId)?.partiallyPaidAmount || 0)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Amount to Pay:</span>
                  <span className="text-green-600">{formatPKR(paymentForm.amount)}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium">Payment Method *</Label>
              <Select value={paymentForm.paymentMethod} onValueChange={v => setPaymentForm(prev => ({ ...prev, paymentMethod: v }))}>
                <SelectTrigger className="premium-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {['Bank Transfer', 'EasyPaisa', 'JazzCash'].includes(paymentForm.paymentMethod) && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Reference/Transaction Number *</Label>
                <Input
                  placeholder="Enter transaction reference number"
                  value={paymentForm.referenceNo}
                  onChange={e => setPaymentForm(prev => ({ ...prev, referenceNo: e.target.value }))}
                  className="premium-input"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium">Notes (Optional)</Label>
              <Input
                placeholder="Any additional notes"
                value={paymentForm.notes}
                onChange={e => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                className="premium-input"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)} className="gap-1">
              Cancel
            </Button>
            <Button
              className="btn-green-glow text-white gap-2"
              onClick={handleSubmitPayment}
              disabled={submitting || !paymentForm.feeId}
            >
              {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              {submitting ? 'Submitting...' : 'Submit Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
