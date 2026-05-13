'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  LayoutDashboard, FileText, Wallet, Clock, DollarSign, TrendingUp,
  AlertTriangle, Users, Plus, Edit, Trash2, Eye, CheckCircle, XCircle,
  Download, RefreshCw, Search, ChevronLeft, ChevronRight, FileCheck,
  Building2, CreditCard, BarChart3, PieChart as PieChartIcon, Settings,
  Filter, Home, Printer
} from 'lucide-react'

import {
  formatPKR, apiFetch,
  FeeStatusBadge, PaymentMethodBadge, PaymentStatusBadge,
  StatCard, ListSkeleton, DashboardSkeleton, EmptyState,
  MONTHS, FEE_TYPES, PAYMENT_METHODS,
  type FeeType, type PaymentType, type FeeStructureType, type StudentType,
} from '@/components/shared-components'

import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

import type { UserType } from '@/app/page'

// ===================== CONSTANTS =====================
const CHART_COLORS = ['#22c55e', '#1e3a5f', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4', '#ec4899']
const PIE_COLORS: Record<string, string> = { Cash: '#22c55e', 'Bank Transfer': '#1e3a5f', EasyPaisa: '#8b5cf6', JazzCash: '#ef4444' }
const PAGE_SIZE = 10

type PaymentTab = 'dashboard' | 'records' | 'payments' | 'structure' | 'late-fine' | 'reports'

interface LateFineConfigType {
  id: string
  gracePeriodDays: number
  finePerDay: number
  maxFine: number
  isActive: boolean
}

interface StatsType {
  totalRevenue: number
  monthlyCollection: number
  pendingAmount: number
  overdueAmount: number
  totalFineCollected: number
  totalFinePending: number
  activeStudents: number
  overdueCount: number
  feeTypeBreakdown: Record<string, { count: number; amount: number; paid: number }>
  monthlyRevenueTrend: { month: string; revenue: number }[]
  paymentMethodDistribution: { name: string; value: number }[]
  topDebtors: { name: string; rollNo: string; department: string; totalDue: number }[]
  recentPayments: { id: string; amount: number; paymentMethod: string; studentName: string; rollNo: string; feeType: string; month: string; year: number; createdAt: string; status: string }[]
  totalFees: number
  paidCount: number
  pendingCount: number
}

// ===================== MAIN COMPONENT =====================
export function AdminPaymentPanel({ user, searchQuery }: { user: UserType; searchQuery: string }) {
  // ---- State ----
  const [activeTab, setActiveTab] = useState<PaymentTab>('dashboard')
  const [fees, setFees] = useState<FeeType[]>([])
  const [payments, setPayments] = useState<PaymentType[]>([])
  const [students, setStudents] = useState<StudentType[]>([])
  const [feeStructures, setFeeStructures] = useState<FeeStructureType[]>([])
  const [lateFineConfig, setLateFineConfig] = useState<LateFineConfigType | null>(null)
  const [stats, setStats] = useState<StatsType | null>(null)
  const [loading, setLoading] = useState(true)

  // Fee records filters & pagination
  const [statusFilter, setStatusFilter] = useState('all')
  const [feeTypeFilter, setFeeTypeFilter] = useState('all')
  const [feeSearch, setFeeSearch] = useState('')
  const [feePage, setFeePage] = useState(1)

  // Payment filters
  const [payStatusFilter, setPayStatusFilter] = useState('all')
  const [payMethodFilter, setPayMethodFilter] = useState('all')
  const [paySearch, setPaySearch] = useState('')
  const [payPage, setPayPage] = useState(1)

  // Dialogs
  const [addFeeDialog, setAddFeeDialog] = useState(false)
  const [editFeeDialog, setEditFeeDialog] = useState(false)
  const [editFee, setEditFee] = useState<FeeType | null>(null)
  const [bulkDialog, setBulkDialog] = useState(false)
  const [receiptFee, setReceiptFee] = useState<FeeType | null>(null)
  const [addStructureDialog, setAddStructureDialog] = useState(false)
  const [rejectDialog, setRejectDialog] = useState(false)
  const [rejectPayment, setRejectPayment] = useState<PaymentType | null>(null)
  const [applyFineConfirm, setApplyFineConfirm] = useState(false)

  // Student search dropdown
  const [studentSearch, setStudentSearch] = useState('')
  const [studentDropdown, setStudentDropdown] = useState(false)

  // Forms
  const [feeForm, setFeeForm] = useState({
    studentId: '', amount: '', month: 'January', year: new Date().getFullYear().toString(),
    feeType: 'Monthly Hostel Fee', status: 'Pending', dueDate: '', paymentMethod: ''
  })
  const [bulkForm, setBulkForm] = useState({
    feeStructureId: '', targetBy: 'all', targetValue: '', month: 'January',
    year: new Date().getFullYear().toString(), dueDate: ''
  })
  const [structureForm, setStructureForm] = useState({
    name: '', amount: '', feeType: 'Monthly Hostel Fee', description: '', isActive: true
  })
  const [fineConfigForm, setFineConfigForm] = useState({
    gracePeriodDays: '5', finePerDay: '50', maxFine: '2000'
  })
  const [rejectReason, setRejectReason] = useState('')

  // ===================== DATA LOADING =====================
  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [feesRes, paymentsRes, studentsRes, structuresRes, configRes, statsRes] = await Promise.all([
        apiFetch<{ fees: FeeType[] }>('/api/fees'),
        apiFetch<{ payments: PaymentType[] }>('/api/payments'),
        apiFetch<{ students: StudentType[] }>('/api/students'),
        apiFetch<{ feeStructures: FeeStructureType[] }>('/api/fee-structures').catch(() => ({ feeStructures: [] as FeeStructureType[] })),
        apiFetch<{ config: LateFineConfigType }>('/api/late-fine-config').catch(() => ({ config: null as LateFineConfigType | null })),
        apiFetch<StatsType>('/api/payments/stats').catch(() => null),
      ])
      setFees(feesRes.fees)
      setPayments(paymentsRes.payments)
      setStudents(studentsRes.students)
      setFeeStructures(structuresRes.feeStructures)
      if (configRes.config) {
        setLateFineConfig(configRes.config)
        setFineConfigForm({
          gracePeriodDays: String(configRes.config.gracePeriodDays),
          finePerDay: String(configRes.config.finePerDay),
          maxFine: String(configRes.config.maxFine),
        })
      }
      if (statsRes) setStats(statsRes)
    } catch {
      toast.error('Failed to load payment data')
    }
    setLoading(false)
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadAll().catch(() => {}) }, [loadAll])

  const refreshData = useCallback(async () => {
    try {
      const [feesRes, paymentsRes, statsRes] = await Promise.all([
        apiFetch<{ fees: FeeType[] }>('/api/fees'),
        apiFetch<{ payments: PaymentType[] }>('/api/payments'),
        apiFetch<StatsType>('/api/payments/stats').catch(() => null),
      ])
      setFees(feesRes.fees)
      setPayments(paymentsRes.payments)
      if (statsRes) setStats(statsRes)
    } catch { /* silent */ }
  }, [])

  // ===================== FILTERED DATA =====================
  const filteredFees = fees.filter(f => {
    const q = (searchQuery || feeSearch).toLowerCase()
    const matchSearch = !q || f.student?.name?.toLowerCase().includes(q) || f.student?.rollNo?.toLowerCase().includes(q) || f.receiptNo?.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || f.status === statusFilter
    const matchType = feeTypeFilter === 'all' || f.feeType === feeTypeFilter
    return matchSearch && matchStatus && matchType
  })

  const totalFeePages = Math.max(1, Math.ceil(filteredFees.length / PAGE_SIZE))
  const paginatedFees = filteredFees.slice((feePage - 1) * PAGE_SIZE, feePage * PAGE_SIZE)

  const filteredPayments = payments.filter(p => {
    const q = paySearch.toLowerCase()
    const studentName = (p.fee as FeeType)?.student?.name || ''
    const refNo = p.referenceNo || ''
    const matchSearch = !q || studentName.toLowerCase().includes(q) || refNo.toLowerCase().includes(q)
    const matchStatus = payStatusFilter === 'all' || p.status === payStatusFilter
    const matchMethod = payMethodFilter === 'all' || p.paymentMethod === payMethodFilter
    return matchSearch && matchStatus && matchMethod
  })

  const totalPayPages = Math.max(1, Math.ceil(filteredPayments.length / PAGE_SIZE))
  const paginatedPayments = filteredPayments.slice((payPage - 1) * PAGE_SIZE, payPage * PAGE_SIZE)

  const pendingPayments = payments.filter(p => p.status === 'Pending')

  const filteredStudents = students.filter(s => {
    const q = studentSearch.toLowerCase()
    return !q || s.user?.name?.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q) || s.department.toLowerCase().includes(q)
  })

  const overdueFeesCount = fees.filter(f => f.status === 'Overdue' || (f.status === 'Pending' && f.dueDate && new Date(f.dueDate) < new Date())).length

  // ===================== HANDLERS =====================
  const resetFeeForm = () => setFeeForm({
    studentId: '', amount: '', month: 'January', year: new Date().getFullYear().toString(),
    feeType: 'Monthly Hostel Fee', status: 'Pending', dueDate: '', paymentMethod: ''
  })

  const handleAddFee = async () => {
    if (!feeForm.studentId || !feeForm.amount) { toast.error('Student and amount are required'); return }
    try {
      await apiFetch('/api/fees', {
        method: 'POST',
        body: JSON.stringify({
          ...feeForm,
          amount: parseFloat(feeForm.amount),
          year: parseInt(feeForm.year),
          dueDate: feeForm.dueDate || undefined,
          paymentMethod: feeForm.paymentMethod || undefined,
        }),
      })
      toast.success('Fee added successfully')
      setAddFeeDialog(false)
      resetFeeForm()
      refreshData()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed to add fee') }
  }

  const handleEditFee = async () => {
    if (!editFee) return
    try {
      await apiFetch(`/api/fees/${editFee.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          amount: parseFloat(feeForm.amount),
          month: feeForm.month,
          year: parseInt(feeForm.year),
          feeType: feeForm.feeType,
          status: feeForm.status,
          paymentMethod: feeForm.paymentMethod || undefined,
        }),
      })
      toast.success('Fee updated successfully')
      setEditFeeDialog(false)
      setEditFee(null)
      resetFeeForm()
      refreshData()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed to update fee') }
  }

  const handleMarkPaid = async (id: string) => {
    try {
      await apiFetch(`/api/fees/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'Paid', paidDate: new Date().toISOString() }) })
      toast.success('Marked as paid')
      refreshData()
    } catch { toast.error('Failed to update fee status') }
  }

  const handleDeleteFee = async (id: string) => {
    try {
      await apiFetch(`/api/fees/${id}`, { method: 'DELETE' })
      toast.success('Fee deleted')
      refreshData()
    } catch { toast.error('Failed to delete fee') }
  }

  const handleBulkAssign = async () => {
    try {
      const res = await apiFetch<{ count: number; message: string }>('/api/payments/bulk', {
        method: 'POST',
        body: JSON.stringify({ action: 'bulkAssignFees', ...bulkForm, year: parseInt(bulkForm.year) }),
      })
      toast.success(res.message || 'Bulk fees assigned')
      setBulkDialog(false)
      refreshData()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed to assign fees') }
  }

  const handleApplyFines = async () => {
    try {
      const res = await apiFetch<{ count: number; message: string }>('/api/payments/bulk', {
        method: 'POST',
        body: JSON.stringify({ action: 'applyLateFines' }),
      })
      toast.success(res.message || 'Late fines applied')
      setApplyFineConfirm(false)
      refreshData()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed to apply fines') }
  }

  const handleVerifyPayment = async (payment: PaymentType) => {
    try {
      await apiFetch(`/api/payments/${payment.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Verified', verifiedBy: user.name }),
      })
      toast.success('Payment verified successfully')
      refreshData()
    } catch { toast.error('Failed to verify payment') }
  }

  const handleRejectPayment = async () => {
    if (!rejectPayment) return
    try {
      await apiFetch(`/api/payments/${rejectPayment.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Rejected', verifiedBy: user.name, notes: rejectReason }),
      })
      toast.success('Payment rejected')
      setRejectDialog(false)
      setRejectPayment(null)
      setRejectReason('')
      refreshData()
    } catch { toast.error('Failed to reject payment') }
  }

  const handleAddStructure = async () => {
    if (!structureForm.name || !structureForm.amount || !structureForm.feeType) {
      toast.error('Name, amount, and fee type are required'); return
    }
    try {
      await apiFetch('/api/fee-structures', {
        method: 'POST',
        body: JSON.stringify(structureForm),
      })
      toast.success('Fee structure added')
      setAddStructureDialog(false)
      setStructureForm({ name: '', amount: '', feeType: 'Monthly Hostel Fee', description: '', isActive: true })
      loadAll()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed to add structure') }
  }

  const handleToggleStructure = async (id: string, isActive: boolean) => {
    try {
      await apiFetch(`/api/fee-structures/${id}`, { method: 'PUT', body: JSON.stringify({ isActive: !isActive }) })
      toast.success('Fee structure updated')
      loadAll()
    } catch { toast.error('Failed to update structure') }
  }

  const handleDeleteStructure = async (id: string) => {
    try {
      await apiFetch(`/api/fee-structures/${id}`, { method: 'DELETE' })
      toast.success('Fee structure deleted')
      loadAll()
    } catch { toast.error('Failed to delete structure') }
  }

  const handleSaveFineConfig = async () => {
    try {
      await apiFetch('/api/late-fine-config', {
        method: 'PUT',
        body: JSON.stringify(fineConfigForm),
      })
      toast.success('Late fine configuration saved')
      loadAll()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed to save config') }
  }

  // ===================== RECEIPT =====================
  const generateReceiptHtml = (fee: FeeType) => {
    return `<!DOCTYPE html><html><head><title>Receipt - ${fee.receiptNo || fee.id}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;padding:40px;max-width:520px;margin:auto;color:#1a1a1a}.header{text-align:center;padding-bottom:20px;border-bottom:3px double #1e3a5f}.header h1{color:#1e3a5f;font-size:22px;margin-bottom:2px}.header .sub{color:#666;font-size:13px}.receipt-info{display:flex;justify-content:space-between;margin:16px 0;padding:12px;background:#f8fafc;border-radius:8px}.receipt-info div{font-size:13px}.receipt-info .label{color:#666;font-size:11px}.divider{border-top:2px dashed #d1d5db;margin:16px 0}.detail-row{display:flex;justify-content:space-between;padding:8px 0;font-size:14px;border-bottom:1px solid #f0f0f0}.detail-row .label{color:#666}.detail-row .value{font-weight:600;color:#1a1a1a}.total-section{margin-top:16px;padding-top:12px;border-top:3px double #1e3a5f}.total-section .detail-row{font-size:18px;border:none}.total-section .value{color:#1e3a5f;font-weight:700}.footer{text-align:center;margin-top:32px;font-size:11px;color:#999}.sig-section{margin-top:40px;text-align:center}.sig-section .line{border-top:1px solid #333;width:200px;margin:0 auto 4px}.sig-section .title{font-size:12px;color:#555}</style></head><body><div class="header"><h1>River Boy Hostel UOM</h1><p class="sub">University of Malakand</p></div><div class="receipt-info"><div><div class="label">Receipt No</div><div style="font-weight:700;margin-top:2px">${fee.receiptNo || 'N/A'}</div></div><div style="text-align:right"><div class="label">Date</div><div style="font-weight:600;margin-top:2px">${fee.paidDate ? new Date(fee.paidDate).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</div></div></div><div class="divider"></div><div class="detail-row"><span class="label">Student Name</span><span class="value">${fee.student?.name || 'N/A'}</span></div><div class="detail-row"><span class="label">Roll No</span><span class="value">${fee.student?.rollNo || 'N/A'}</span></div><div class="detail-row"><span class="label">Department</span><span class="value">${fee.student?.department || 'N/A'}</span></div><div class="detail-row"><span class="label">Room No</span><span class="value">${fee.student?.room?.number || 'N/A'}</span></div><div class="divider"></div><div class="detail-row"><span class="label">Fee Type</span><span class="value">${fee.feeType}</span></div><div class="detail-row"><span class="label">Period</span><span class="value">${fee.month} ${fee.year}</span></div><div class="detail-row"><span class="label">Fee Amount</span><span class="value">${formatPKR(fee.amount)}</span></div>${(fee.lateFine && fee.lateFine > 0) ? `<div class="detail-row"><span class="label">Late Fine</span><span class="value" style="color:#ef4444">${formatPKR(fee.lateFine)}</span></div>` : ''}${fee.paymentMethod ? `<div class="detail-row"><span class="label">Payment Method</span><span class="value">${fee.paymentMethod}</span></div>` : ''}<div class="total-section"><div class="detail-row"><span class="label">Total Amount</span><span class="value">${formatPKR(fee.amount + (fee.lateFine || 0))}</span></div></div><div class="sig-section"><div class="line"></div><div class="title">Admin Signature</div></div><div class="footer"><p>This is a computer-generated receipt.</p><p>River Boy Hostel UOM &mdash; University of Malakand</p></div></body></html>`
  }

  const printReceipt = (fee: FeeType) => {
    const w = window.open('', '_blank')
    if (w) { w.document.write(generateReceiptHtml(fee)); w.document.close(); w.print() }
  }

  const downloadReceipt = (fee: FeeType) => {
    const blob = new Blob([generateReceiptHtml(fee)], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `receipt-${fee.receiptNo || fee.id}.html`; a.click()
    URL.revokeObjectURL(url)
  }

  // ===================== EXPORT CSV =====================
  const exportCSV = () => {
    const headers = ['Student', 'Roll No', 'Room', 'Type', 'Month', 'Year', 'Amount', 'Fine', 'Method', 'Status', 'Receipt No']
    const rows = filteredFees.map(f => [
      f.student?.name || '', f.student?.rollNo || '', f.student?.room?.number || '',
      f.feeType, f.month, f.year, f.amount, f.lateFine || 0,
      f.paymentMethod || '', f.status, f.receiptNo || ''
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `fee-records-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported successfully')
  }

  // ===================== TAB CONFIG =====================
  const tabs: { key: PaymentTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { key: 'records', label: 'Fee Records', icon: <FileText className="h-4 w-4" />, badge: fees.filter(f => f.status === 'Pending' || f.status === 'Overdue').length || undefined },
    { key: 'payments', label: 'Payments', icon: <CreditCard className="h-4 w-4" />, badge: pendingPayments.length || undefined },
    { key: 'structure', label: 'Fee Structure', icon: <Wallet className="h-4 w-4" /> },
    { key: 'late-fine', label: 'Late Fine', icon: <Clock className="h-4 w-4" /> },
    { key: 'reports', label: 'Reports', icon: <BarChart3 className="h-4 w-4" /> },
  ]

  if (loading) return <DashboardSkeleton />

  // ===================== RENDER =====================
  return (
    <div className="space-y-4 animate-fade-in">
      {/* ===== HERO BANNER ===== */}
      <div className="hostel-hero-bg rounded-2xl p-4 sm:p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/60 via-transparent to-[#0a1628]/30" />
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 animate-float">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Payment & Fee Management</h2>
                <p className="text-blue-200/80 text-xs sm:text-sm">Comprehensive Financial Management System</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs" onClick={() => setApplyFineConfirm(true)}>
                <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Apply Fines
              </Button>
              <Button size="sm" className="btn-green-glow text-white text-xs" onClick={() => { setBulkForm({ feeStructureId: '', targetBy: 'all', targetValue: '', month: 'January', year: new Date().getFullYear().toString(), dueDate: '' }); setBulkDialog(true) }}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Bulk Assign
              </Button>
              <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs" onClick={() => loadAll()}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== TAB NAVIGATION ===== */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-xl overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.key ? 'bg-[#1e3a5f] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.badge && tab.badge > 0 && (
              <span className="ml-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/* ===== TAB 1: DASHBOARD ===== */}
      {/* ============================================================ */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4 stagger-children">
          {/* 6 Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            <StatCard title="Total Revenue" value={formatPKR(stats?.totalRevenue || 0)} icon={<DollarSign className="h-5 w-5" />} color="text-green-600" bg="bg-green-50 dark:bg-green-900/20" />
            <StatCard title="Monthly Collection" value={formatPKR(stats?.monthlyCollection || 0)} icon={<TrendingUp className="h-5 w-5" />} color="text-[#1e3a5f]" bg="bg-blue-50 dark:bg-blue-900/20" />
            <StatCard title="Pending Payments" value={formatPKR(stats?.pendingAmount || 0)} icon={<Clock className="h-5 w-5" />} color="text-amber-600" bg="bg-amber-50 dark:bg-amber-900/20" />
            <StatCard title="Overdue Amount" value={formatPKR(stats?.overdueAmount || 0)} icon={<AlertTriangle className="h-5 w-5" />} color="text-red-600" bg="bg-red-50 dark:bg-red-900/20" />
            <StatCard title="Fine Collected" value={formatPKR(stats?.totalFineCollected || 0)} icon={<FileCheck className="h-5 w-5" />} color="text-purple-600" bg="bg-purple-50 dark:bg-purple-900/20" />
            <StatCard title="Overdue Students" value={stats?.overdueCount || 0} icon={<Users className="h-5 w-5" />} color="text-rose-600" bg="bg-rose-50 dark:bg-rose-900/20" />
          </div>

          {/* 2x2 Chart Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue Trend Line Chart */}
            <Card className="chart-container premium-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <TrendingUp className="h-4 w-4 text-green-500" /> Revenue Trend (6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={stats?.monthlyRevenueTrend || []} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.08)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="rgba(30,58,95,0.3)" />
                    <YAxis tick={{ fontSize: 12 }} stroke="rgba(30,58,95,0.3)" tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
                    <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} formatter={(value: number) => [formatPKR(value), 'Revenue']} />
                    <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, stroke: '#22c55e', strokeWidth: 2, fill: '#fff' }} animationDuration={1200} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Payment Method Distribution Pie Chart */}
            <Card className="chart-container premium-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <PieChartIcon className="h-4 w-4 text-[#1e3a5f]" /> Payment Method Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(stats?.paymentMethodDistribution || []).length > 0 ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <ResponsiveContainer width={200} height={200}>
                      <PieChart>
                        <Pie
                          data={stats!.paymentMethodDistribution}
                          cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                          dataKey="value" stroke="none"
                          animationBegin={0} animationDuration={800}
                        >
                          {stats!.paymentMethodDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name] || CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid rgba(0,0,0,0.06)' }} formatter={(value: number) => [formatPKR(value), 'Amount']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 flex-1 w-full">
                      {stats!.paymentMethodDistribution.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[item.name] || CHART_COLORS[index % CHART_COLORS.length] }} />
                            <span className="text-sm font-medium">{item.name}</span>
                          </div>
                          <span className="text-sm font-bold">{formatPKR(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">No payment data available</div>
                )}
              </CardContent>
            </Card>

            {/* Fee Collection Status BarChart */}
            <Card className="chart-container premium-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <BarChart3 className="h-4 w-4 text-[#1e3a5f]" /> Fee Collection by Type
                </CardTitle>
                <CardDescription className="text-xs">Paid vs Pending vs Overdue by fee type</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(stats?.feeTypeBreakdown || {}).length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={Object.entries(stats?.feeTypeBreakdown || {}).map(([type, data]) => ({
                      name: type.length > 12 ? type.substring(0, 12) + '…' : type,
                      Paid: data.paid,
                      Pending: data.amount - data.paid,
                    }))} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.08)" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="rgba(30,58,95,0.3)" />
                      <YAxis tick={{ fontSize: 12 }} stroke="rgba(30,58,95,0.3)" tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
                      <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} formatter={(value: number) => [formatPKR(value), '']} />
                      <Legend />
                      <Bar dataKey="Paid" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Pending" stackId="a" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">No fee type data</div>
                )}
              </CardContent>
            </Card>

            {/* Monthly Comparison BarChart */}
            <Card className="chart-container premium-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <BarChart3 className="h-4 w-4 text-green-500" /> Monthly Comparison
                </CardTitle>
                <CardDescription className="text-xs">Collection vs Pending over last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={(stats?.monthlyRevenueTrend || []).map(m => ({
                    ...m,
                    Pending: (stats?.pendingAmount || 0) / Math.max(stats?.monthlyRevenueTrend?.length || 1, 1),
                  }))} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.08)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="rgba(30,58,95,0.3)" />
                    <YAxis tick={{ fontSize: 12 }} stroke="rgba(30,58,95,0.3)" tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
                    <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} formatter={(value: number) => [formatPKR(value), '']} />
                    <Legend />
                    <Bar dataKey="revenue" name="Collection" fill="#22c55e" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Pending" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Section: Recent Payments + Top Debtors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Payments */}
            <Card className="premium-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <CreditCard className="h-4 w-4 text-green-500" /> Recent Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                  {(stats?.recentPayments || []).length > 0 ? stats!.recentPayments.slice(0, 10).map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-green-50 dark:bg-green-900/20 text-green-600 text-xs font-bold">
                            {p.studentName?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{p.studentName}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{p.feeType} &middot; {p.month} {p.year}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">{formatPKR(p.amount)}</p>
                        <div className="flex items-center gap-1.5 justify-end">
                          <PaymentMethodBadge method={p.paymentMethod} />
                          <span className="text-[10px] text-muted-foreground">{new Date(p.createdAt).toLocaleDateString('en-PK')}</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <EmptyState icon={<CreditCard className="h-8 w-8" />} title="No Recent Payments" description="Payments will appear here when students make payments" />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Debtors */}
            <Card className="premium-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <AlertTriangle className="h-4 w-4 text-red-500" /> Top Debtors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                  {(stats?.topDebtors || []).length > 0 ? stats!.topDebtors.slice(0, 8).map((d, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0 text-sm font-bold text-red-600">
                          {i + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{d.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{d.rollNo} &middot; {d.department}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-red-600">{formatPKR(d.totalDue)}</p>
                        <p className="text-[10px] text-muted-foreground">Total Due</p>
                      </div>
                    </div>
                  )) : (
                    <EmptyState icon={<CheckCircle className="h-8 w-8" />} title="No Outstanding Dues" description="All students have cleared their payments" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ===== TAB 2: FEE RECORDS ===== */}
      {/* ============================================================ */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, roll no, receipt..."
                value={feeSearch}
                onChange={e => { setFeeSearch(e.target.value); setFeePage(1) }}
                className="pl-9 h-9 rounded-xl"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setFeePage(1) }}>
                <SelectTrigger className="w-[130px] h-9 rounded-xl text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                  <SelectItem value="Partially Paid">Partial</SelectItem>
                </SelectContent>
              </Select>
              <Select value={feeTypeFilter} onValueChange={v => { setFeeTypeFilter(v); setFeePage(1) }}>
                <SelectTrigger className="w-[150px] h-9 rounded-xl text-xs"><SelectValue placeholder="Fee Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {FEE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" className="btn-green-glow text-white" onClick={() => { resetFeeForm(); setAddFeeDialog(true) }}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Fee
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{filteredFees.length} fee records found</p>
            <Button size="sm" variant="outline" className="text-xs" onClick={exportCSV}>
              <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
            </Button>
          </div>

          {filteredFees.length === 0 ? (
            <EmptyState icon={<FileText className="h-10 w-10" />} title="No Fee Records" description="No fee records match your current filters" action={<Button size="sm" className="btn-green-glow text-white" onClick={() => { resetFeeForm(); setAddFeeDialog(true) }}><Plus className="h-3.5 w-3.5 mr-1" /> Add Fee</Button>} />
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block premium-card overflow-hidden">
                <Table className="premium-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Fine</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedFees.map(fee => (
                      <TableRow key={fee.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="bg-[#1e3a5f]/10 text-[#1e3a5f] dark:bg-[#1e3a5f]/20 dark:text-blue-300 text-[10px] font-bold">
                                {fee.student?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate max-w-[120px]">{fee.student?.name || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{fee.student?.rollNo || '-'}</TableCell>
                        <TableCell className="text-xs">{fee.student?.room?.number || '-'}</TableCell>
                        <TableCell className="text-xs">{fee.feeType}</TableCell>
                        <TableCell className="text-xs">{fee.month} {fee.year}</TableCell>
                        <TableCell className="font-semibold text-sm">{formatPKR(fee.amount)}</TableCell>
                        <TableCell className="text-xs">{fee.lateFine ? formatPKR(fee.lateFine) : '-'}</TableCell>
                        <TableCell>{fee.paymentMethod ? <PaymentMethodBadge method={fee.paymentMethod} /> : <span className="text-xs text-muted-foreground">-</span>}</TableCell>
                        <TableCell><FeeStatusBadge status={fee.status} /></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {fee.status !== 'Paid' && (
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50" title="Mark Paid" onClick={() => handleMarkPaid(fee.id)}>
                                <CheckCircle className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-muted" title="Edit" onClick={() => {
                              setEditFee(fee)
                              setFeeForm({
                                studentId: fee.studentId, amount: String(fee.amount), month: fee.month,
                                year: String(fee.year), feeType: fee.feeType, status: fee.status,
                                dueDate: fee.dueDate ? new Date(fee.dueDate).toISOString().slice(0, 10) : '',
                                paymentMethod: fee.paymentMethod || ''
                              })
                              setEditFeeDialog(true)
                            }}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-muted" title="Receipt" onClick={() => setReceiptFee(fee)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" title="Delete" onClick={() => handleDeleteFee(fee.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {paginatedFees.map(fee => (
                  <Card key={fee.id} className="premium-card">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-[#1e3a5f]/10 text-[#1e3a5f] dark:bg-[#1e3a5f]/20 dark:text-blue-300 text-xs font-bold">
                              {fee.student?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{fee.student?.name || 'N/A'}</p>
                            <p className="text-[11px] text-muted-foreground">{fee.student?.rollNo} &middot; {fee.student?.room?.number || 'No room'}</p>
                          </div>
                        </div>
                        <FeeStatusBadge status={fee.status} />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-muted-foreground">Type:</span> <span className="font-medium ml-1">{fee.feeType}</span></div>
                        <div><span className="text-muted-foreground">Period:</span> <span className="font-medium ml-1">{fee.month} {fee.year}</span></div>
                        <div><span className="text-muted-foreground">Amount:</span> <span className="font-bold ml-1">{formatPKR(fee.amount)}</span></div>
                        <div><span className="text-muted-foreground">Fine:</span> <span className="font-bold ml-1 text-red-500">{fee.lateFine ? formatPKR(fee.lateFine) : '-'}</span></div>
                      </div>
                      {fee.paymentMethod && <div className="mt-2"><PaymentMethodBadge method={fee.paymentMethod} /></div>}
                      <Separator className="my-3" />
                      <div className="flex gap-2">
                        {fee.status !== 'Paid' && (
                          <Button size="sm" className="btn-green-glow text-white flex-1 text-xs h-8" onClick={() => handleMarkPaid(fee.id)}>
                            <CheckCircle className="h-3 w-3 mr-1" /> Mark Paid
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="flex-1 text-xs h-8" onClick={() => {
                          setEditFee(fee)
                          setFeeForm({
                            studentId: fee.studentId, amount: String(fee.amount), month: fee.month,
                            year: String(fee.year), feeType: fee.feeType, status: fee.status,
                            dueDate: fee.dueDate ? new Date(fee.dueDate).toISOString().slice(0, 10) : '',
                            paymentMethod: fee.paymentMethod || ''
                          })
                          setEditFeeDialog(true)
                        }}>
                          <Edit className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => setReceiptFee(fee)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-500 text-xs h-8" onClick={() => handleDeleteFee(fee.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Showing {Math.min((feePage - 1) * PAGE_SIZE + 1, filteredFees.length)}-{Math.min(feePage * PAGE_SIZE, filteredFees.length)} of {filteredFees.length} records
                </p>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0" disabled={feePage <= 1} onClick={() => setFeePage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-medium">{feePage} / {totalFeePages}</span>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0" disabled={feePage >= totalFeePages} onClick={() => setFeePage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* ===== TAB 3: PAYMENTS ===== */}
      {/* ============================================================ */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Pending Verification Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-amber-500" />
              <h3 className="text-base font-semibold">Pending Verification</h3>
              {pendingPayments.length > 0 && <Badge className="bg-amber-100 text-amber-800 border-amber-200">{pendingPayments.length} pending</Badge>}
            </div>
            {pendingPayments.length === 0 ? (
              <EmptyState icon={<CheckCircle className="h-10 w-10" />} title="No Pending Payments" description="All payments have been verified or rejected" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pendingPayments.map(p => {
                  const feeData = p.fee as FeeType | undefined
                  const studentName = feeData?.student?.name || 'Unknown'
                  const feeType = feeData?.feeType || ''
                  return (
                    <Card key={p.id} className="premium-card">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 text-xs font-bold">
                                {studentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{studentName}</p>
                              <p className="text-[11px] text-muted-foreground">{feeType}</p>
                            </div>
                          </div>
                          <PaymentStatusBadge status={p.status} />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div><span className="text-muted-foreground">Amount:</span> <span className="font-bold ml-1">{formatPKR(p.amount)}</span></div>
                          <div><span className="text-muted-foreground">Method:</span> <span className="ml-1"><PaymentMethodBadge method={p.paymentMethod} /></span></div>
                          {p.referenceNo && <div className="col-span-2"><span className="text-muted-foreground">Ref:</span> <span className="font-mono ml-1">{p.referenceNo}</span></div>}
                          <div className="col-span-2"><span className="text-muted-foreground">Date:</span> <span className="ml-1">{new Date(p.createdAt).toLocaleDateString('en-PK')}</span></div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="btn-green-glow text-white flex-1 text-xs h-8" onClick={() => handleVerifyPayment(p)}>
                            <CheckCircle className="h-3 w-3 mr-1" /> Verify
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 text-xs h-8 text-red-500 border-red-200 hover:bg-red-50" onClick={() => { setRejectPayment(p); setRejectDialog(true) }}>
                            <XCircle className="h-3 w-3 mr-1" /> Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          <Separator />

          {/* Payment History */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-5 w-5 text-[#1e3a5f]" />
              <h3 className="text-base font-semibold">Payment History</h3>
            </div>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search payments..." value={paySearch} onChange={e => { setPaySearch(e.target.value); setPayPage(1) }} className="pl-9 h-9 rounded-xl" />
              </div>
              <Select value={payStatusFilter} onValueChange={v => { setPayStatusFilter(v); setPayPage(1) }}>
                <SelectTrigger className="w-[130px] h-9 rounded-xl text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Verified">Verified</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={payMethodFilter} onValueChange={v => { setPayMethodFilter(v); setPayPage(1) }}>
                <SelectTrigger className="w-[140px] h-9 rounded-xl text-xs"><SelectValue placeholder="Method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {filteredPayments.length === 0 ? (
              <EmptyState icon={<CreditCard className="h-10 w-10" />} title="No Payments" description="No payment records match your filters" />
            ) : (
              <>
                <div className="premium-card overflow-hidden">
                  <Table className="premium-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Fee Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPayments.map(p => {
                        const feeData = p.fee as FeeType | undefined
                        return (
                          <TableRow key={p.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium text-sm">{feeData?.student?.name || 'Unknown'}</TableCell>
                            <TableCell className="text-xs">{feeData?.feeType || '-'}</TableCell>
                            <TableCell className="font-semibold text-sm">{formatPKR(p.amount)}</TableCell>
                            <TableCell><PaymentMethodBadge method={p.paymentMethod} /></TableCell>
                            <TableCell className="text-xs font-mono">{p.referenceNo || '-'}</TableCell>
                            <TableCell><PaymentStatusBadge status={p.status} /></TableCell>
                            <TableCell className="text-xs">{new Date(p.createdAt).toLocaleDateString('en-PK')}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
                {/* Pagination */}
                <div className="flex items-center justify-between gap-2 mt-3">
                  <p className="text-xs text-muted-foreground">
                    Showing {Math.min((payPage - 1) * PAGE_SIZE + 1, filteredPayments.length)}-{Math.min(payPage * PAGE_SIZE, filteredPayments.length)} of {filteredPayments.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0" disabled={payPage <= 1} onClick={() => setPayPage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-medium">{payPage} / {totalPayPages}</span>
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0" disabled={payPage >= totalPayPages} onClick={() => setPayPage(p => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ===== TAB 4: FEE STRUCTURE ===== */}
      {/* ============================================================ */}
      {activeTab === 'structure' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Fee Structures</h3>
            <Button size="sm" className="btn-green-glow text-white" onClick={() => { setStructureForm({ name: '', amount: '', feeType: 'Monthly Hostel Fee', description: '', isActive: true }); setAddStructureDialog(true) }}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Structure
            </Button>
          </div>

          {feeStructures.length === 0 ? (
            <EmptyState icon={<Wallet className="h-10 w-10" />} title="No Fee Structures" description="Create fee structures to define fee categories and amounts" action={
              <Button size="sm" className="btn-green-glow text-white" onClick={() => setAddStructureDialog(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Add Structure</Button>
            } />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {feeStructures.map(fs => (
                <Card key={fs.id} className="premium-card card-hover">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-sm font-semibold">{fs.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">{fs.feeType}</CardDescription>
                      </div>
                      <Badge className={fs.isActive ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400'}>
                        {fs.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-2xl font-bold text-[#1e3a5f]">{formatPKR(fs.amount)}</div>
                    {fs.description && <p className="text-xs text-muted-foreground">{fs.description}</p>}
                    <Separator />
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 text-xs h-8" onClick={() => handleToggleStructure(fs.id, fs.isActive)}>
                        {fs.isActive ? <><XCircle className="h-3 w-3 mr-1" /> Deactivate</> : <><CheckCircle className="h-3 w-3 mr-1" /> Activate</>}
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-500 text-xs h-8" onClick={() => handleDeleteStructure(fs.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* ===== TAB 5: LATE FINE ===== */}
      {/* ============================================================ */}
      {activeTab === 'late-fine' && (
        <div className="space-y-4">
          {/* Configuration Card */}
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" /> Late Fine Configuration
              </CardTitle>
              <CardDescription>Configure how late fines are calculated and applied</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Grace Period (Days)</Label>
                  <Input
                    type="number"
                    value={fineConfigForm.gracePeriodDays}
                    onChange={e => setFineConfigForm(prev => ({ ...prev, gracePeriodDays: e.target.value }))}
                    className="h-9 rounded-xl"
                  />
                  <p className="text-[10px] text-muted-foreground">Days after due date before fine starts</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Fine Per Day (Rs.)</Label>
                  <Input
                    type="number"
                    value={fineConfigForm.finePerDay}
                    onChange={e => setFineConfigForm(prev => ({ ...prev, finePerDay: e.target.value }))}
                    className="h-9 rounded-xl"
                  />
                  <p className="text-[10px] text-muted-foreground">Amount charged per day after grace period</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Maximum Fine (Rs.)</Label>
                  <Input
                    type="number"
                    value={fineConfigForm.maxFine}
                    onChange={e => setFineConfigForm(prev => ({ ...prev, maxFine: e.target.value }))}
                    className="h-9 rounded-xl"
                  />
                  <p className="text-[10px] text-muted-foreground">Maximum fine that can be applied to any fee</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200">{overdueFeesCount} overdue fees</Badge>
                  {lateFineConfig && <Badge className="bg-green-100 text-green-800 border-green-200">Config Active</Badge>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="btn-green-glow text-white" onClick={handleSaveFineConfig}>
                    <Settings className="h-3.5 w-3.5 mr-1" /> Save Configuration
                  </Button>
                  <Button size="sm" variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => setApplyFineConfirm(true)}>
                    <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Apply Late Fines Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary of current config */}
          {lateFineConfig && (
            <Card className="premium-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileCheck className="h-4 w-4 text-green-500" /> Current Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/30">
                    <p className="text-2xl font-bold text-amber-600">{lateFineConfig.gracePeriodDays}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Grace Days</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30">
                    <p className="text-2xl font-bold text-red-600">{formatPKR(lateFineConfig.finePerDay)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Per Day Fine</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200/50 dark:border-purple-800/30">
                    <p className="text-2xl font-bold text-purple-600">{formatPKR(lateFineConfig.maxFine)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Maximum Fine</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* ===== TAB 6: REPORTS ===== */}
      {/* ============================================================ */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Financial Reports & Analytics</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-xs" onClick={exportCSV}>
                <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
              </Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => window.print()}>
                <Printer className="h-3.5 w-3.5 mr-1" /> Print
              </Button>
            </div>
          </div>

          {/* Collection Rate Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="premium-card">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Collection Rate</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats && stats.totalFees > 0 ? Math.round((stats.paidCount / stats.totalFees) * 100) : 0}%
                </p>
                <Progress
                  value={stats && stats.totalFees > 0 ? (stats.paidCount / stats.totalFees) * 100 : 0}
                  className="mt-2 h-2"
                />
              </CardContent>
            </Card>
            <Card className="premium-card">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Collected</p>
                <p className="text-3xl font-bold text-[#1e3a5f]">{formatPKR(stats?.totalRevenue || 0)}</p>
              </CardContent>
            </Card>
            <Card className="premium-card">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Outstanding</p>
                <p className="text-3xl font-bold text-red-500">{formatPKR((stats?.pendingAmount || 0) + (stats?.overdueAmount || 0))}</p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Comparison Chart */}
          <Card className="chart-container premium-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <BarChart3 className="h-4 w-4 text-[#1e3a5f]" /> Monthly Collection Comparison
              </CardTitle>
              <CardDescription className="text-xs">Revenue collected vs pending amounts by month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={(stats?.monthlyRevenueTrend || []).map(m => ({
                  ...m,
                  Pending: (stats?.pendingAmount || 0) / Math.max(stats?.monthlyRevenueTrend?.length || 1, 1),
                }))} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.08)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="rgba(30,58,95,0.3)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="rgba(30,58,95,0.3)" tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} formatter={(value: number) => [formatPKR(value), '']} />
                  <Legend />
                  <Bar dataKey="revenue" name="Collection" fill="#22c55e" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Pending" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Fee Type Breakdown Pie Chart */}
          <Card className="chart-container premium-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <PieChartIcon className="h-4 w-4 text-[#1e3a5f]" /> Fee Type Breakdown
              </CardTitle>
              <CardDescription className="text-xs">Distribution of fees by type</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(stats?.feeTypeBreakdown || {}).length > 0 ? (
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <ResponsiveContainer width={250} height={250}>
                    <PieChart>
                      <Pie
                        data={Object.entries(stats?.feeTypeBreakdown || {}).map(([name, data], i) => ({ name, value: data.amount }))}
                        cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                        dataKey="value" stroke="none"
                        animationBegin={0} animationDuration={800}
                      >
                        {Object.entries(stats?.feeTypeBreakdown || {}).map((_, i) => (
                          <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid rgba(0,0,0,0.06)' }} formatter={(value: number) => [formatPKR(value), 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3 flex-1 w-full">
                    {Object.entries(stats?.feeTypeBreakdown || {}).map(([name, data], i) => (
                      <div key={name} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-sm font-medium">{name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{formatPKR(data.amount)}</p>
                          <p className="text-[10px] text-muted-foreground">{data.count} records &middot; {formatPKR(data.paid)} paid</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">No fee type data available</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* ===== DIALOGS ===== */}
      {/* ============================================================ */}

      {/* Add Fee Dialog */}
      <Dialog open={addFeeDialog} onOpenChange={setAddFeeDialog}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="h-4 w-4 text-green-500" /> Add Fee Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Student Dropdown */}
            <div className="space-y-1.5">
              <Label className="text-xs">Student *</Label>
              <div className="relative">
                <Input
                  placeholder="Search student by name, roll no..."
                  value={studentSearch}
                  onChange={e => { setStudentSearch(e.target.value); setStudentDropdown(true) }}
                  onFocus={() => setStudentDropdown(true)}
                  className="h-9 rounded-xl"
                />
                {feeForm.studentId && (
                  <Badge className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-100 text-green-800 text-[10px]">
                    {students.find(s => s.id === feeForm.studentId)?.user?.name || 'Selected'}
                  </Badge>
                )}
                {studentDropdown && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto bg-popover border rounded-xl shadow-lg">
                    {filteredStudents.slice(0, 20).map(s => (
                      <button
                        key={s.id}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex items-center gap-2"
                        onClick={() => {
                          setFeeForm(prev => ({ ...prev, studentId: s.id }))
                          setStudentSearch(s.user?.name || s.rollNo)
                          setStudentDropdown(false)
                        }}
                      >
                        <span className="font-medium">{s.user?.name}</span>
                        <span className="text-muted-foreground text-xs">{s.rollNo} &middot; {s.department}</span>
                      </button>
                    ))}
                    {filteredStudents.length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">No students found</p>}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Amount (Rs.) *</Label>
                <Input type="number" value={feeForm.amount} onChange={e => setFeeForm(prev => ({ ...prev, amount: e.target.value }))} className="h-9 rounded-xl" placeholder="5000" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Fee Type *</Label>
                <Select value={feeForm.feeType} onValueChange={v => setFeeForm(prev => ({ ...prev, feeType: v }))}>
                  <SelectTrigger className="h-9 rounded-xl text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{FEE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Month *</Label>
                <Select value={feeForm.month} onValueChange={v => setFeeForm(prev => ({ ...prev, month: v }))}>
                  <SelectTrigger className="h-9 rounded-xl text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Year *</Label>
                <Input type="number" value={feeForm.year} onChange={e => setFeeForm(prev => ({ ...prev, year: e.target.value }))} className="h-9 rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={feeForm.status} onValueChange={v => setFeeForm(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger className="h-9 rounded-xl text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Payment Method</Label>
                <Select value={feeForm.paymentMethod || 'none'} onValueChange={v => setFeeForm(prev => ({ ...prev, paymentMethod: v === 'none' ? '' : v }))}>
                  <SelectTrigger className="h-9 rounded-xl text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Due Date</Label>
              <Input type="date" value={feeForm.dueDate} onChange={e => setFeeForm(prev => ({ ...prev, dueDate: e.target.value }))} className="h-9 rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddFeeDialog(false)} className="h-9">Cancel</Button>
            <Button size="sm" className="btn-green-glow text-white h-9" onClick={handleAddFee}>Add Fee</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Fee Dialog */}
      <Dialog open={editFeeDialog} onOpenChange={setEditFeeDialog}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Edit className="h-4 w-4 text-[#1e3a5f]" /> Edit Fee Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Amount (Rs.)</Label>
                <Input type="number" value={feeForm.amount} onChange={e => setFeeForm(prev => ({ ...prev, amount: e.target.value }))} className="h-9 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Fee Type</Label>
                <Select value={feeForm.feeType} onValueChange={v => setFeeForm(prev => ({ ...prev, feeType: v }))}>
                  <SelectTrigger className="h-9 rounded-xl text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{FEE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Month</Label>
                <Select value={feeForm.month} onValueChange={v => setFeeForm(prev => ({ ...prev, month: v }))}>
                  <SelectTrigger className="h-9 rounded-xl text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Year</Label>
                <Input type="number" value={feeForm.year} onChange={e => setFeeForm(prev => ({ ...prev, year: e.target.value }))} className="h-9 rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={feeForm.status} onValueChange={v => setFeeForm(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger className="h-9 rounded-xl text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                    <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Payment Method</Label>
                <Select value={feeForm.paymentMethod || 'none'} onValueChange={v => setFeeForm(prev => ({ ...prev, paymentMethod: v === 'none' ? '' : v }))}>
                  <SelectTrigger className="h-9 rounded-xl text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setEditFeeDialog(false); setEditFee(null) }} className="h-9">Cancel</Button>
            <Button size="sm" className="bg-[#1e3a5f] hover:bg-[#16304f] text-white h-9" onClick={handleEditFee}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Assign Dialog */}
      <Dialog open={bulkDialog} onOpenChange={setBulkDialog}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="h-4 w-4 text-green-500" /> Bulk Assign Fees</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Fee Structure *</Label>
              <Select value={bulkForm.feeStructureId} onValueChange={v => setBulkForm(prev => ({ ...prev, feeStructureId: v }))}>
                <SelectTrigger className="h-9 rounded-xl text-xs"><SelectValue placeholder="Select fee structure" /></SelectTrigger>
                <SelectContent>
                  {feeStructures.filter(fs => fs.isActive).map(fs => (
                    <SelectItem key={fs.id} value={fs.id}>{fs.name} - {formatPKR(fs.amount)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Target By</Label>
              <Select value={bulkForm.targetBy} onValueChange={v => setBulkForm(prev => ({ ...prev, targetBy: v, targetValue: '' }))}>
                <SelectTrigger className="h-9 rounded-xl text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Active Students</SelectItem>
                  <SelectItem value="department">By Department</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {bulkForm.targetBy === 'department' && (
              <div className="space-y-1.5">
                <Label className="text-xs">Department</Label>
                <Select value={bulkForm.targetValue} onValueChange={v => setBulkForm(prev => ({ ...prev, targetValue: v }))}>
                  <SelectTrigger className="h-9 rounded-xl text-xs"><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'BBA', 'Physics', 'Mathematics', 'Chemistry', 'Botany', 'Zoology'].map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Month *</Label>
                <Select value={bulkForm.month} onValueChange={v => setBulkForm(prev => ({ ...prev, month: v }))}>
                  <SelectTrigger className="h-9 rounded-xl text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Year *</Label>
                <Input type="number" value={bulkForm.year} onChange={e => setBulkForm(prev => ({ ...prev, year: e.target.value }))} className="h-9 rounded-xl" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Due Date</Label>
              <Input type="date" value={bulkForm.dueDate} onChange={e => setBulkForm(prev => ({ ...prev, dueDate: e.target.value }))} className="h-9 rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setBulkDialog(false)} className="h-9">Cancel</Button>
            <Button size="sm" className="btn-green-glow text-white h-9" onClick={handleBulkAssign}>Assign Fees</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={!!receiptFee} onOpenChange={() => setReceiptFee(null)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Eye className="h-4 w-4 text-[#1e3a5f]" /> Fee Receipt</DialogTitle>
          </DialogHeader>
          {receiptFee && (
            <div className="space-y-4">
              <div className="text-center pb-3 border-b">
                <h3 className="text-lg font-bold text-[#1e3a5f]">River Boy Hostel UOM</h3>
                <p className="text-xs text-muted-foreground">University of Malakand</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Receipt No:</span></div><div className="font-mono font-semibold">{receiptFee.receiptNo || 'N/A'}</div>
                <div><span className="text-muted-foreground">Date:</span></div><div className="font-semibold">{receiptFee.paidDate ? new Date(receiptFee.paidDate).toLocaleDateString('en-PK') : 'N/A'}</div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Student:</span></div><div className="font-semibold">{receiptFee.student?.name || 'N/A'}</div>
                <div><span className="text-muted-foreground">Roll No:</span></div><div className="font-semibold">{receiptFee.student?.rollNo || 'N/A'}</div>
                <div><span className="text-muted-foreground">Department:</span></div><div className="font-semibold">{receiptFee.student?.department || 'N/A'}</div>
                <div><span className="text-muted-foreground">Room:</span></div><div className="font-semibold">{receiptFee.student?.room?.number || 'N/A'}</div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Fee Type:</span></div><div className="font-semibold">{receiptFee.feeType}</div>
                <div><span className="text-muted-foreground">Period:</span></div><div className="font-semibold">{receiptFee.month} {receiptFee.year}</div>
                <div><span className="text-muted-foreground">Fee Amount:</span></div><div className="font-semibold">{formatPKR(receiptFee.amount)}</div>
                {receiptFee.lateFine && receiptFee.lateFine > 0 && (
                  <><div><span className="text-muted-foreground">Late Fine:</span></div><div className="font-semibold text-red-500">{formatPKR(receiptFee.lateFine)}</div></>
                )}
                {receiptFee.paymentMethod && (
                  <><div><span className="text-muted-foreground">Method:</span></div><div><PaymentMethodBadge method={receiptFee.paymentMethod} /></div></>
                )}
              </div>
              <Separator />
              <div className="flex items-center justify-between text-lg font-bold text-[#1e3a5f]">
                <span>Total Amount:</span>
                <span>{formatPKR(receiptFee.amount + (receiptFee.lateFine || 0))}</span>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" className="flex-1 text-xs h-9" onClick={() => printReceipt(receiptFee)}>
                  <Printer className="h-3.5 w-3.5 mr-1" /> Print
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-xs h-9" onClick={() => downloadReceipt(receiptFee)}>
                  <FileCheck className="h-3.5 w-3.5 mr-1" /> Download
                </Button>
              </div>
              <p className="text-center text-[10px] text-muted-foreground mt-2">This is a computer-generated receipt. River Boy Hostel UOM - University of Malakand</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Structure Dialog */}
      <Dialog open={addStructureDialog} onOpenChange={setAddStructureDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="h-4 w-4 text-green-500" /> Add Fee Structure</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Structure Name *</Label>
              <Input placeholder="e.g., Monthly Hostel Fee" value={structureForm.name} onChange={e => setStructureForm(prev => ({ ...prev, name: e.target.value }))} className="h-9 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Amount (Rs.) *</Label>
                <Input type="number" placeholder="5000" value={structureForm.amount} onChange={e => setStructureForm(prev => ({ ...prev, amount: e.target.value }))} className="h-9 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Fee Type *</Label>
                <Select value={structureForm.feeType} onValueChange={v => setStructureForm(prev => ({ ...prev, feeType: v }))}>
                  <SelectTrigger className="h-9 rounded-xl text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{FEE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea placeholder="Optional description..." value={structureForm.description} onChange={e => setStructureForm(prev => ({ ...prev, description: e.target.value }))} className="rounded-xl min-h-[60px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddStructureDialog(false)} className="h-9">Cancel</Button>
            <Button size="sm" className="btn-green-glow text-white h-9" onClick={handleAddStructure}>Add Structure</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Payment Dialog */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-500" /> Reject Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Are you sure you want to reject this payment? This action cannot be undone.</p>
            <div className="space-y-1.5">
              <Label className="text-xs">Rejection Reason</Label>
              <Textarea placeholder="Provide a reason for rejection..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="rounded-xl min-h-[60px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setRejectDialog(false); setRejectPayment(null) }} className="h-9">Cancel</Button>
            <Button size="sm" variant="destructive" className="h-9" onClick={handleRejectPayment}>Reject Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply Fines Confirmation */}
      <Dialog open={applyFineConfirm} onOpenChange={setApplyFineConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Apply Late Fines</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This will automatically calculate and apply late fines to all overdue fee records based on the current configuration.
            </p>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/30">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Warning</span>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {overdueFeesCount} overdue fee records will be processed. This action cannot be undone.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setApplyFineConfirm(false)} className="h-9">Cancel</Button>
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white h-9" onClick={handleApplyFines}>Apply Fines</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
