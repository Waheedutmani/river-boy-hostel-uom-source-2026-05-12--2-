'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  DollarSign, TrendingUp, Clock, AlertTriangle, CheckCircle2, Eye, Download,
  FileCheck, Building2, Phone, Home, Receipt, Activity, AlertCircle, CreditCard,
  Wallet, ChevronLeft, ChevronRight, Filter, Search, RefreshCw
} from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts'
import {
  formatPKR, apiFetch, MONTHS, FEE_TYPES, PAYMENT_METHODS,
  FeeStatusBadge, PaymentMethodBadge, PaymentStatusBadge, StatCard, ListSkeleton, Breadcrumb, EmptyState,
  FeeType, PaymentType, FeeStructureType
} from '@/components/shared-components'

// ======================== USER TYPE ========================
interface UserType { id: string; email: string; name: string; role: string; phone?: string }

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
      <div className="flex items-center gap-3 sm:gap-4 relative z-10">
        <div className={`stat-icon ${bg} shadow-sm group-hover:scale-110 transition-transform duration-300 shrink-0`}>
          <div className={color}>{icon}</div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-sm font-medium text-muted-foreground leading-tight">{title}</p>
          <p className="text-base sm:text-2xl font-bold truncate mt-0.5 animate-counter">{displayValue}</p>
        </div>
      </div>
    </div>
  )
}

// ======================== PROGRESS BAR COMPONENT ========================
function PremiumProgressBar({ percent }: { percent: number }) {
  return (
    <div className="w-full h-3 bg-muted/40 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-1000 ease-in-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

// ======================== MAIN COMPONENT ========================
export default function StudentPaymentPanel({ user }: { user: UserType }) {
  // ---- State ----
  const [fees, setFees] = useState<FeeType[]>([])
  const [payments, setPayments] = useState<PaymentType[]>([])
  const [student, setStudent] = useState<{
    id: string; userId: string; rollNo: string; department: string; semester: number;
    roomId: string | null; guardianName: string | null; guardianPhone: string | null;
    address: string | null; bloodGroup: string | null; emergencyContact: string | null;
    status: string; user?: { name: string; email: string; phone: string };
    room?: { id?: string; number: string; floor?: number; capacity?: number; hostel?: { name: string } };
    _count?: { fees: number; complaints: number }
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  // Dialogs
  const [receiptFee, setReceiptFee] = useState<FeeType | null>(null)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    feeId: '',
    amount: 0,
    paymentMethod: 'Cash',
    referenceNo: '',
    notes: ''
  })

  // ---- Data Fetching ----
  const fetchData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true)
      else setLoading(true)

      const [studentsRes, feesRes, paymentsRes] = await Promise.all([
        apiFetch<{ students: any[] }>('/api/students'),
        apiFetch<{ fees: FeeType[] }>('/api/fees'),
        apiFetch<{ payments: PaymentType[] }>('/api/payments')
      ])

      const me = studentsRes.students.find((s: any) => s.userId === user.id) || null
      setStudent(me)

      if (me) {
        const myFees = feesRes.fees.filter((f: FeeType) => f.studentId === me.id)
        const myPayments = paymentsRes.payments.filter((p: PaymentType) => {
          return myFees.some(f => f.id === p.feeId)
        })
        setFees(myFees)
        setPayments(myPayments)
      }
    } catch {
      toast.error('Failed to load payment data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ---- Computed Values ----
  const totalFees = fees.reduce((s, f) => s + f.amount, 0)
  const paidFees = fees.filter(f => f.status === 'Paid').reduce((s, f) => s + f.amount, 0)
  const pendingFees = fees.filter(f => f.status !== 'Paid').reduce((s, f) => s + (f.amount - (f.partiallyPaidAmount || 0)), 0)
  const totalFines = fees.reduce((s, f) => s + (f.lateFine || 0), 0)
  const paidPercent = totalFees > 0 ? Math.round((paidFees / totalFees) * 100) : 0

  // Next Due Date
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

  // Payment timeline - sorted by paidDate desc
  const paidFeesList = fees
    .filter(f => f.status === 'Paid' && f.paidDate)
    .sort((a, b) => new Date(b.paidDate!).getTime() - new Date(a.paidDate!).getTime())

  // Unpaid/partially paid fees for payment submission
  const unpaidFees = fees.filter(f => f.status !== 'Paid')

  // Filtered & searched fees for table
  const filteredFees = fees.filter(f => {
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter
    const matchesSearch = searchQuery === '' || f.feeType.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredFees.length / pageSize))
  const paginatedFees = filteredFees.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // ---- Payment Form Handlers ----
  const handleSelectFee = (feeId: string) => {
    const selected = unpaidFees.find(f => f.id === feeId)
    if (selected) {
      const remaining = selected.amount - (selected.partiallyPaidAmount || 0)
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
      fetchData(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit payment')
    } finally {
      setSubmitting(false)
    }
  }

  // ---- Receipt Functions ----
  const generateReceiptHtml = (fee: FeeType) => {
    const roomNum = fee.student?.room?.number || student?.room?.number || 'N/A'
    const hostelName = fee.student?.room?.hostel?.name || student?.room?.hostel?.name || ''
    const receiptNo = fee.receiptNo || `RCB-${fee.year}-${fee.id.slice(-6)}`
    const paymentDate = fee.paidDate ? new Date(fee.paidDate).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'

    return `<!DOCTYPE html><html><head><title>Receipt - ${receiptNo}</title>
<style>
  @page { size: A4; margin: 20mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; max-width: 500px; margin: 0 auto; color: #1a1a2e; }
  .header { text-align: center; margin-bottom: 20px; }
  .logo-circle { width: 56px; height: 56px; background: linear-gradient(135deg, #1e3a5f, #22c55e); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; }
  .logo-circle svg { width: 28px; height: 28px; fill: white; }
  .header h1 { font-size: 20px; color: #1e3a5f; font-weight: 700; margin: 0; }
  .header .subtitle { font-size: 13px; color: #6b7280; margin-top: 2px; }
  .gradient-line { height: 3px; background: linear-gradient(90deg, #1e3a5f, #22c55e, #1e3a5f); border-radius: 2px; margin: 16px 0; }
  .section { margin-bottom: 16px; }
  .section-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 8px; }
  .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px solid #f3f4f6; }
  .row:last-child { border-bottom: none; }
  .row .label { color: #6b7280; }
  .row .value { font-weight: 600; color: #1a1a2e; text-align: right; }
  .late-fine .value { color: #dc2626; }
  .total-section { margin-top: 16px; border-top: 3px double #1e3a5f; padding-top: 12px; }
  .total-row { display: flex; justify-content: space-between; font-size: 18px; font-weight: 700; color: #1e3a5f; }
  .footer { text-align: center; margin-top: 32px; }
  .footer p { font-size: 10px; color: #9ca3af; line-height: 1.6; }
  .signature-section { margin-top: 40px; text-align: right; }
  .signature-line { width: 180px; border-top: 1px solid #d1d5db; margin-left: auto; padding-top: 6px; }
  .signature-label { font-size: 11px; color: #6b7280; }
</style></head><body>
  <div class="header">
    <div class="logo-circle">
      <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    </div>
    <h1>River Boy Hostel UOM</h1>
    <p class="subtitle">University of Malakand</p>
  </div>
  <div class="gradient-line"></div>
  <div class="section">
    <div class="row"><span class="label">Receipt No:</span><span class="value" style="font-family:monospace">${receiptNo}</span></div>
    <div class="row"><span class="label">Payment Date:</span><span class="value">${paymentDate}</span></div>
  </div>
  <div class="gradient-line" style="height:1px;"></div>
  <div class="section">
    <div class="section-title">Student Information</div>
    <div class="row"><span class="label">Student Name:</span><span class="value">${fee.student?.name || student?.user?.name || 'N/A'}</span></div>
    <div class="row"><span class="label">Roll No:</span><span class="value">${fee.student?.rollNo || student?.rollNo || 'N/A'}</span></div>
    <div class="row"><span class="label">Room Number:</span><span class="value">${roomNum}${hostelName ? ' - ' + hostelName : ''}</span></div>
    <div class="row"><span class="label">Department:</span><span class="value">${fee.student?.department || student?.department || 'N/A'}</span></div>
  </div>
  <div class="gradient-line" style="height:1px;"></div>
  <div class="section">
    <div class="section-title">Fee Details</div>
    <div class="row"><span class="label">Fee Type:</span><span class="value">${fee.feeType}</span></div>
    <div class="row"><span class="label">Period:</span><span class="value">${fee.month} ${fee.year}</span></div>
    <div class="row"><span class="label">Fee Amount:</span><span class="value">${formatPKR(fee.amount)}</span></div>
    ${(fee.lateFine && fee.lateFine > 0) ? `<div class="row late-fine"><span class="label">Late Fine:</span><span class="value">${formatPKR(fee.lateFine)}</span></div>` : ''}
    ${fee.paymentMethod ? `<div class="row"><span class="label">Payment Method:</span><span class="value">${fee.paymentMethod}</span></div>` : ''}
  </div>
  <div class="total-section">
    <div class="total-row"><span>Total Amount:</span><span>${formatPKR(fee.amount + (fee.lateFine || 0))}</span></div>
  </div>
  <div class="footer">
    <p>This is a computer-generated receipt and does not require a physical signature.</p>
    <p>River Boy Hostel UOM &bull; University of Malakand</p>
  </div>
  <div class="signature-section">
    <div class="signature-line"></div>
    <div class="signature-label">Authorized Signature</div>
  </div>
</body></html>`
  }

  const printReceipt = (fee: FeeType) => {
    const html = generateReceiptHtml(fee)
    const w = window.open('', '_blank')
    if (w) {
      w.document.write(html)
      w.document.close()
      setTimeout(() => w.print(), 300)
    }
  }

  const downloadReceipt = (fee: FeeType) => {
    const html = generateReceiptHtml(fee)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt-${fee.receiptNo || fee.id}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ---- Loading State ----
  if (loading) return <ListSkeleton />

  // ======================== RENDER ========================
  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Home' }, { label: 'My Fees & Payments', active: true }]} />

      {/* ===== 1. HERO BANNER ===== */}
      <div className="hostel-hero-bg rounded-2xl p-4 sm:p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/60 via-transparent to-[#0a1628]/30" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
              <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold tracking-tight">My Fee & Payment Portal</h2>
              <p className="text-blue-200/80 text-xs sm:text-sm">Track your fees, submit payments, and download receipts</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/15 h-9 w-9 sm:h-10 sm:w-10 shrink-0"
            onClick={() => fetchData(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ===== 2. FIVE STAT CARDS ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 stagger-children">
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
          icon={<AlertTriangle className="h-5 w-5" />}
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

      {/* ===== 3. FEE SUMMARY WITH PROGRESS BAR ===== */}
      <Card className="premium-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <TrendingUp className="h-4 w-4 text-[#1e3a5f]" />
            Fee Summary
          </CardTitle>
          <CardDescription>Overall payment progress for your hostel fees</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Payment Progress</span>
            <span className="text-sm font-bold text-green-600 dark:text-green-400">{paidPercent}% Paid</span>
          </div>
          <PremiumProgressBar percent={paidPercent} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
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
              <p className="font-bold text-red-600 dark:text-red-400 text-sm">{formatPKR(totalFines)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== 4. TWO-COLUMN: PIE CHART + PAYMENT METHODS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Fee Type Breakdown Pie Chart */}
        <Card className="chart-container premium-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Receipt className="h-4 w-4 text-[#1e3a5f]" />
              Fee Type Breakdown
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
                    <RechartsTooltip
                      contentStyle={{ borderRadius: '0.75rem', fontSize: '13px' }}
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
                No fee records found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods Info Card */}
        <Card className="premium-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <CreditCard className="h-4 w-4 text-[#1e3a5f]" />
              Payment Methods
            </CardTitle>
            <CardDescription>Available methods to pay your hostel fees</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 rounded-xl border bg-green-50/50 dark:bg-green-900/10 flex items-center gap-3 card-hover cursor-default">
                <div className="w-9 h-9 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm">Cash Payment</p>
                  <p className="text-xs text-muted-foreground">Pay directly at the hostel office counter</p>
                </div>
              </div>
              <div className="p-3 rounded-xl border bg-blue-50/50 dark:bg-blue-900/10 flex items-center gap-3 card-hover cursor-default">
                <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm">Bank Transfer</p>
                  <p className="text-xs text-muted-foreground">Transfer to hostel bank account with reference number</p>
                </div>
              </div>
              <div className="p-3 rounded-xl border bg-purple-50/50 dark:bg-purple-900/10 flex items-center gap-3 card-hover cursor-default">
                <div className="w-9 h-9 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <Phone className="h-4 w-4 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm">EasyPaisa</p>
                  <p className="text-xs text-muted-foreground">Mobile wallet payment via EasyPaisa app</p>
                </div>
              </div>
              <div className="p-3 rounded-xl border bg-red-50/50 dark:bg-red-900/10 flex items-center gap-3 card-hover cursor-default">
                <div className="w-9 h-9 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <Phone className="h-4 w-4 text-red-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm">JazzCash</p>
                  <p className="text-xs text-muted-foreground">Mobile wallet payment via JazzCash app</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== 5. SUBMIT PAYMENT SECTION ===== */}
      <Card className="premium-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Wallet className="h-4 w-4 text-green-600" />
                Submit Payment
              </CardTitle>
              <CardDescription>Submit your fee payment for verification</CardDescription>
            </div>
            <Button
              className="btn-green-glow text-white gap-2"
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
        </CardHeader>
      </Card>

      {/* ===== 6. PAYMENT HISTORY WITH TIMELINE ===== */}
      {paidFeesList.length > 0 && (
        <Card className="premium-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Activity className="h-4 w-4 text-green-500" />
              Payment History
            </CardTitle>
            <CardDescription>Your recent payment activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Vertical connecting line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-green-300 via-green-200 to-transparent dark:from-green-700 dark:via-green-800" />
              <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
                {paidFeesList.map((f, idx) => (
                  <div
                    key={f.id}
                    className="flex items-start gap-3 relative animate-fade-in"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    {/* Green dot */}
                    <div className="w-[30px] h-[30px] rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 z-10 border-2 border-background">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{f.feeType} &mdash; {f.month} {f.year}</p>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400 shrink-0">
                          {formatPKR(f.amount + (f.lateFine || 0))}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {f.paidDate ? new Date(f.paidDate).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                        </span>
                        {f.paymentMethod && <PaymentMethodBadge method={f.paymentMethod} />}
                        {(f.lateFine && f.lateFine > 0) && (
                          <Badge variant="outline" className="text-[10px] py-0 text-red-600 border-red-200 dark:text-red-400 dark:border-red-800">
                            Fine: {formatPKR(f.lateFine)}
                          </Badge>
                        )}
                        <FeeStatusBadge status={f.status} />
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

      {/* ===== 7. FEE RECORDS TABLE (DESKTOP) / CARDS (MOBILE) ===== */}
      <div className="space-y-4">
        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search fee type..."
                className="pl-9 w-full sm:w-56 premium-input"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
              <SelectTrigger className="w-full sm:w-44 premium-input">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
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
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredFees.length} record{filteredFees.length !== 1 ? 's' : ''} found
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedFees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    No fee records found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                paginatedFees.map(f => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.feeType}</TableCell>
                    <TableCell className="font-bold">{formatPKR(f.amount)}</TableCell>
                    <TableCell>
                      {(f.lateFine && f.lateFine > 0) ? (
                        <span className="text-red-600 font-medium">{formatPKR(f.lateFine)}</span>
                      ) : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>{f.month}</TableCell>
                    <TableCell>{f.year}</TableCell>
                    <TableCell><FeeStatusBadge status={f.status} /></TableCell>
                    <TableCell>
                      {f.paymentMethod ? <PaymentMethodBadge method={f.paymentMethod} /> : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {f.paidDate ? new Date(f.paidDate).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' }) : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      {f.status === 'Paid' ? (
                        <Button variant="ghost" size="sm" onClick={() => setReceiptFee(f)} className="gap-1 text-green-600 hover:text-green-700">
                          <Eye className="h-4 w-4" /> Receipt
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-800">
                          Awaiting
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="grid grid-cols-1 md:hidden gap-3 stagger-children">
          {paginatedFees.length === 0 ? (
            <EmptyState
              icon={<Receipt className="h-8 w-8" />}
              title="No Fees Found"
              description="No fee records match your current filters"
            />
          ) : (
            paginatedFees.map(f => (
              <div key={f.id} className="premium-card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">{f.feeType}</h3>
                    <p className="text-sm text-muted-foreground">{f.month} {f.year}</p>
                  </div>
                  <FeeStatusBadge status={f.status} />
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg font-bold">{formatPKR(f.amount + (f.lateFine || 0))}</span>
                  {f.paymentMethod && <PaymentMethodBadge method={f.paymentMethod} />}
                </div>
                {(f.lateFine && f.lateFine > 0) && (
                  <p className="text-xs text-red-600 dark:text-red-400 mb-2">
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
                    <Eye className="h-3.5 w-3.5" /> View Receipt
                  </Button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                .map((page, idx, arr) => {
                  const prevPage = arr[idx - 1]
                  const showEllipsis = prevPage !== undefined && page - prevPage > 1
                  return (
                    <span key={page} className="flex items-center">
                      {showEllipsis && <span className="px-1 text-muted-foreground text-xs">...</span>}
                      <Button
                        variant={page === currentPage ? 'default' : 'outline'}
                        size="icon"
                        className={`h-8 w-8 text-xs ${page === currentPage ? 'bg-[#1e3a5f] hover:bg-[#16304f]' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    </span>
                  )
                })}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ===== 8. RECEIPT DIALOG ===== */}
      <Dialog open={!!receiptFee} onOpenChange={() => setReceiptFee(null)}>
        <DialogContent className="max-w-md animate-bounce-in">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-green-600" />
              Payment Receipt
            </DialogTitle>
            <DialogDescription>Official receipt for your hostel fee payment</DialogDescription>
          </DialogHeader>
          {receiptFee && (
            <div className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-5 sm:p-6">
              {/* Header */}
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#1e3a5f] to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Home className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-[#1e3a5f] dark:text-blue-300">River Boy Hostel UOM</h2>
                <p className="text-sm text-muted-foreground">University of Malakand</p>
                <div className="w-16 h-0.5 bg-gradient-to-r from-[#1e3a5f] to-green-500 mx-auto mt-2" />
              </div>

              {/* Receipt Info */}
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receipt No:</span>
                  <span className="font-mono font-medium">
                    {receiptFee.receiptNo || `RCB-${receiptFee.year}-${receiptFee.id.slice(-6)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Date:</span>
                  <span className="font-medium">
                    {receiptFee.paidDate
                      ? new Date(receiptFee.paidDate).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })
                      : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Student Info */}
              <div className="border-t border-dashed pt-3 space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Student Name:</span>
                  <span className="font-medium">{receiptFee.student?.name || student?.user?.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Roll No:</span>
                  <span className="font-medium">{receiptFee.student?.rollNo || student?.rollNo || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Room Number:</span>
                  <span className="font-medium">
                    {receiptFee.student?.room?.number || student?.room?.number || '-'}
                    {(receiptFee.student?.room?.hostel?.name || student?.room?.hostel?.name) && (
                      <span className="text-muted-foreground"> - {receiptFee.student?.room?.hostel?.name || student?.room?.hostel?.name}</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-medium">{receiptFee.student?.department || student?.department || '-'}</span>
                </div>
              </div>

              {/* Fee Details */}
              <div className="border-t border-dashed pt-3 space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee Type:</span>
                  <span className="font-medium">{receiptFee.feeType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Period:</span>
                  <span className="font-medium">{receiptFee.month} {receiptFee.year}</span>
                </div>
                {(receiptFee.lateFine && receiptFee.lateFine > 0) && (
                  <div className="flex justify-between text-red-600 dark:text-red-400">
                    <span className="text-muted-foreground">Late Fine:</span>
                    <span className="font-medium">{formatPKR(receiptFee.lateFine)}</span>
                  </div>
                )}
                {receiptFee.paymentMethod && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Method:</span>
                    <span className="font-medium">{receiptFee.paymentMethod}</span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="border-t-2 border-[#1e3a5f] dark:border-blue-500 pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="text-[#1e3a5f] dark:text-blue-300">
                    {formatPKR(receiptFee.amount + (receiptFee.lateFine || 0))}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground">This is a computer-generated receipt.</p>
                <p className="text-xs text-muted-foreground">River Boy Hostel UOM &bull; University of Malakand</p>
              </div>

              {/* Signature Line */}
              <div className="mt-6 text-right">
                <div className="w-40 border-t border-gray-300 dark:border-gray-600 ml-auto pt-1">
                  <span className="text-[10px] text-muted-foreground">Authorized Signature</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs gap-1"
                  onClick={() => printReceipt(receiptFee)}
                >
                  <Download className="h-3 w-3" /> Print
                </Button>
                <Button
                  size="sm"
                  className="flex-1 text-xs gap-1 bg-[#1e3a5f] hover:bg-[#16304f] text-white"
                  onClick={() => downloadReceipt(receiptFee)}
                >
                  <FileCheck className="h-3 w-3" /> Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== SUBMIT PAYMENT DIALOG ===== */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-md animate-bounce-in">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              Submit Payment
            </DialogTitle>
            <DialogDescription>Submit your fee payment for admin verification</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Select Fee */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Fee <span className="text-red-500">*</span></Label>
              <Select
                value={paymentForm.feeId}
                onValueChange={handleSelectFee}
              >
                <SelectTrigger className="premium-input">
                  <SelectValue placeholder="Choose a fee to pay" />
                </SelectTrigger>
                <SelectContent>
                  {unpaidFees.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.feeType} - {f.month} {f.year} ({formatPKR(f.amount - (f.partiallyPaidAmount || 0))} remaining)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Amount (PKR) <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                min={1}
                value={paymentForm.amount || ''}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                placeholder="Enter payment amount"
                className="premium-input"
              />
              {paymentForm.feeId && (
                <p className="text-xs text-muted-foreground">
                  Full fee amount. You can edit for partial payments.
                </p>
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Payment Method <span className="text-red-500">*</span></Label>
              <Select
                value={paymentForm.paymentMethod}
                onValueChange={(v) => setPaymentForm(prev => ({ ...prev, paymentMethod: v }))}
              >
                <SelectTrigger className="premium-input">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reference Number (conditional) */}
            {['Bank Transfer', 'EasyPaisa', 'JazzCash'].includes(paymentForm.paymentMethod) && (
              <div className="space-y-2 animate-fade-in">
                <Label className="text-sm font-medium">
                  Reference Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={paymentForm.referenceNo}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, referenceNo: e.target.value }))}
                  placeholder={`Enter ${paymentForm.paymentMethod} reference/trx ID`}
                  className="premium-input"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the transaction reference number from your {paymentForm.paymentMethod} receipt
                </p>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes or comments..."
                className="premium-input resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setPaymentDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              className="btn-green-glow text-white gap-2 min-w-[120px]"
              onClick={handleSubmitPayment}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Submit Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
