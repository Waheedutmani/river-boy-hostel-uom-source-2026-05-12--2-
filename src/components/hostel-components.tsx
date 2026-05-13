'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  LayoutDashboard, Building2, DoorOpen, Users, Receipt, MessageSquareWarning,
  Bell, Menu, X, Plus, Pencil, Trash2, Search, ChevronDown, Home,
  TrendingUp, TrendingDown, DollarSign, AlertCircle, CheckCircle2,
  Clock, UserPlus, BedDouble, Shield, Wifi, Droplets, Zap, Wrench,
  MoreVertical, Filter, Download, RefreshCw, Eye, ArrowUpRight,
  ArrowDownRight, Activity, BarChart3, PieChart as PieChartIcon
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

// ===================== TYPES =====================
export type NavPage = 'dashboard' | 'hostels' | 'rooms' | 'students' | 'fees' | 'complaints' | 'notices'

export interface HostelType {
  id: string
  name: string
  type: string
  totalRooms: number
  address: string | null
  createdAt: string
  updatedAt: string
  rooms?: RoomType[]
  totalOccupancy?: number
  totalCapacity?: number
}

export interface RoomType {
  id: string
  number: string
  floor: number
  capacity: number
  hostelId: string
  createdAt: string
  updatedAt: string
  hostel?: { name: string; type: string }
  _count?: { students: number }
  students?: StudentType[]
}

export interface StudentType {
  id: string
  name: string
  email: string
  phone: string
  rollNo: string
  department: string
  semester: number
  roomId: string | null
  guardianName: string | null
  guardianPhone: string | null
  address: string | null
  createdAt: string
  updatedAt: string
  room?: { name?: string; number: string; hostel?: { name: string } }
  _count?: { fees: number; complaints: number }
  fees?: FeeType[]
  complaints?: ComplaintType[]
}

export interface FeeType {
  id: string
  studentId: string
  amount: number
  month: string
  year: number
  status: string
  paidDate: string | null
  createdAt: string
  updatedAt: string
  student?: { name: string; rollNo: string; department: string }
}

export interface ComplaintType {
  id: string
  studentId: string
  title: string
  description: string
  category: string
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  student?: { name: string; rollNo: string; department: string }
}

export interface NoticeType {
  id: string
  title: string
  content: string
  category: string
  priority: string
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  totalStudents: number
  totalRooms: number
  totalHostels: number
  totalCapacity: number
  totalOccupancy: number
  occupancyRate: number
  pendingFees: number
  overdueFees: number
  totalFeeAmount: number
  collectedFeeAmount: number
  openComplaints: number
  inProgressComplaints: number
  resolvedComplaints: number
  hostelOccupancy: { name: string; type: string; totalRooms: number; totalCapacity: number; totalOccupancy: number; occupancyRate: number }[]
  feeBreakdown: { paid: number; pending: number; overdue: number }
}

// ===================== API HELPERS =====================
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}

// ===================== NAV ITEMS =====================
const navItems: { page: NavPage; label: string; icon: React.ReactNode }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { page: 'hostels', label: 'Hostels', icon: <Building2 className="h-5 w-5" /> },
  { page: 'rooms', label: 'Rooms', icon: <DoorOpen className="h-5 w-5" /> },
  { page: 'students', label: 'Students', icon: <Users className="h-5 w-5" /> },
  { page: 'fees', label: 'Fees', icon: <Receipt className="h-5 w-5" /> },
  { page: 'complaints', label: 'Complaints', icon: <MessageSquareWarning className="h-5 w-5" /> },
  { page: 'notices', label: 'Notices', icon: <Bell className="h-5 w-5" /> },
]

// ===================== BADGE HELPERS =====================
export function FeeStatusBadge({ status }: { status: string }) {
  const config: Record<string, { className: string; icon: React.ReactNode }> = {
    Paid: { className: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
    Pending: { className: 'bg-amber-100 text-amber-800 border-amber-200', icon: <Clock className="h-3 w-3 mr-1" /> },
    Overdue: { className: 'bg-red-100 text-red-800 border-red-200', icon: <AlertCircle className="h-3 w-3 mr-1" /> },
  }
  const c = config[status] || config.Pending
  return <Badge variant="outline" className={`${c.className} flex items-center`}>{c.icon}{status}</Badge>
}

export function ComplaintStatusBadge({ status }: { status: string }) {
  const config: Record<string, { className: string }> = {
    Open: { className: 'bg-sky-100 text-sky-800 border-sky-200' },
    'In Progress': { className: 'bg-amber-100 text-amber-800 border-amber-200' },
    Resolved: { className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  }
  const c = config[status] || config.Open
  return <Badge variant="outline" className={c.className}>{status}</Badge>
}

export function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { className: string }> = {
    Low: { className: 'bg-gray-100 text-gray-700 border-gray-200' },
    Medium: { className: 'bg-amber-100 text-amber-800 border-amber-200' },
    High: { className: 'bg-red-100 text-red-800 border-red-200' },
  }
  const c = config[priority] || config.Medium
  return <Badge variant="outline" className={c.className}>{priority}</Badge>
}

export function NoticePriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { className: string }> = {
    Normal: { className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    Important: { className: 'bg-amber-100 text-amber-800 border-amber-200' },
    Urgent: { className: 'bg-red-100 text-red-800 border-red-200' },
  }
  const c = config[priority] || config.Normal
  return <Badge variant="outline" className={c.className}>{priority}</Badge>
}

export function CategoryBadge({ category }: { category: string }) {
  const config: Record<string, { className: string; icon: React.ReactNode }> = {
    Plumbing: { className: 'bg-blue-100 text-blue-800', icon: <Droplets className="h-3 w-3 mr-1" /> },
    Electrical: { className: 'bg-yellow-100 text-yellow-800', icon: <Zap className="h-3 w-3 mr-1" /> },
    Cleaning: { className: 'bg-green-100 text-green-800', icon: <Wrench className="h-3 w-3 mr-1" /> },
    Internet: { className: 'bg-purple-100 text-purple-800', icon: <Wifi className="h-3 w-3 mr-1" /> },
    Other: { className: 'bg-gray-100 text-gray-700', icon: <MoreVertical className="h-3 w-3 mr-1" /> },
    General: { className: 'bg-emerald-100 text-emerald-800', icon: <Bell className="h-3 w-3 mr-1" /> },
    Maintenance: { className: 'bg-amber-100 text-amber-800', icon: <Wrench className="h-3 w-3 mr-1" /> },
    Event: { className: 'bg-purple-100 text-purple-800', icon: <Activity className="h-3 w-3 mr-1" /> },
    Emergency: { className: 'bg-red-100 text-red-800', icon: <AlertCircle className="h-3 w-3 mr-1" /> },
  }
  const c = config[category] || config.Other
  return <Badge className={`${c.className} flex items-center`}>{c.icon}{category}</Badge>
}

// ===================== SIDEBAR =====================
export function Sidebar({ currentPage, onNavigate, isOpen, onClose }: {
  currentPage: NavPage
  onNavigate: (page: NavPage) => void
  isOpen: boolean
  onClose: () => void
}) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-emerald-900 text-white transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between p-4 border-b border-emerald-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Home className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">HostelHub</h1>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-emerald-800" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <ScrollArea className="h-[calc(100%-73px)]">
          <nav className="p-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.page}
                onClick={() => { onNavigate(item.page); onClose() }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === item.page
                    ? 'bg-emerald-700 text-white'
                    : 'text-emerald-200 hover:bg-emerald-800 hover:text-white'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
          <div className="p-4 mt-4 mx-3 bg-emerald-800/50 rounded-lg">
            <p className="text-xs text-emerald-300 mb-1">Hostel Management</p>
            <p className="text-xs text-emerald-400">v1.0.0 • Final Year Project</p>
          </div>
        </ScrollArea>
      </aside>
    </>
  )
}

// ===================== DASHBOARD =====================
export function DashboardSection() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiFetch<DashboardStats>('/api/dashboard')
      setStats(data)
    } catch (err) {
      toast.error('Failed to load dashboard stats')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  if (loading) return <DashboardSkeleton />

  if (!stats) return <div className="p-6 text-center text-muted-foreground">Failed to load dashboard</div>

  const statCards = [
    { title: 'Total Students', value: stats.totalStudents, icon: <Users className="h-6 w-6" />, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+12%', trendUp: true },
    { title: 'Total Rooms', value: stats.totalRooms, icon: <BedDouble className="h-6 w-6" />, color: 'text-teal-600', bg: 'bg-teal-50', trend: '+5%', trendUp: true },
    { title: 'Occupancy Rate', value: `${stats.occupancyRate}%`, icon: <BarChart3 className="h-6 w-6" />, color: 'text-cyan-600', bg: 'bg-cyan-50', trend: stats.occupancyRate > 70 ? 'High' : 'Low', trendUp: stats.occupancyRate > 70 },
    { title: 'Pending Fees', value: stats.pendingFees + stats.overdueFees, icon: <DollarSign className="h-6 w-6" />, color: 'text-amber-600', bg: 'bg-amber-50', trend: `₹${((stats.totalFeeAmount - stats.collectedFeeAmount) / 1000).toFixed(1)}k`, trendUp: false },
    { title: 'Open Complaints', value: stats.openComplaints, icon: <AlertCircle className="h-6 w-6" />, color: 'text-red-600', bg: 'bg-red-50', trend: `${stats.inProgressComplaints} in progress`, trendUp: false },
    { title: 'Hostels', value: stats.totalHostels, icon: <Building2 className="h-6 w-6" />, color: 'text-emerald-700', bg: 'bg-emerald-50', trend: 'Active', trendUp: true },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
          <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening at your hostels.</p>
        </div>
        <Button onClick={fetchStats} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <Card key={card.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {card.trendUp ? (
                      <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-amber-500" />
                    )}
                    <span className={`text-xs ${card.trendUp ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {card.trend}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${card.bg}`}>
                  <div className={card.color}>{card.icon}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hostel Occupancy Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
              Hostel Occupancy
            </CardTitle>
            <CardDescription>Room occupancy by hostel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.hostelOccupancy.map((h) => (
                <div key={h.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{h.name}</span>
                    <span className="text-muted-foreground">{h.totalOccupancy}/{h.totalCapacity} ({h.occupancyRate}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        h.occupancyRate >= 80 ? 'bg-red-500' : h.occupancyRate >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(h.occupancyRate, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Fee Collection Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-emerald-600" />
              Fee Collection Status
            </CardTitle>
            <CardDescription>Current semester fee breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {(() => {
                    const total = stats.feeBreakdown.paid + stats.feeBreakdown.pending + stats.feeBreakdown.overdue
                    if (total === 0) return <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="20" />
                    const paidPct = (stats.feeBreakdown.paid / total) * 251.3
                    const pendingPct = (stats.feeBreakdown.pending / total) * 251.3
                    const overduePct = (stats.feeBreakdown.overdue / total) * 251.3
                    let offset = 0
                    return (
                      <>
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="20"
                          strokeDasharray={`${paidPct} 251.3`} strokeDashoffset={-offset} />
                        {offset += paidPct}
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="20"
                          strokeDasharray={`${pendingPct} 251.3`} strokeDashoffset={-offset} />
                        {offset += pendingPct}
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="20"
                          strokeDasharray={`${overduePct} 251.3`} strokeDashoffset={-offset} />
                      </>
                    )
                  })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-2xl font-bold">₹{(stats.collectedFeeAmount / 1000).toFixed(0)}k</span>
                  <span className="text-xs text-muted-foreground">Collected</span>
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-sm">Paid ({stats.feeBreakdown.paid})</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" /><span className="text-sm">Pending ({stats.feeBreakdown.pending})</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-sm">Overdue ({stats.feeBreakdown.overdue})</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Complaints & Fee Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquareWarning className="h-5 w-5 text-emerald-600" />
              Complaints Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-sky-50 rounded-lg">
                <p className="text-2xl font-bold text-sky-700">{stats.openComplaints}</p>
                <p className="text-xs text-sky-600">Open</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-700">{stats.inProgressComplaints}</p>
                <p className="text-xs text-amber-600">In Progress</p>
              </div>
              <div className="text-center p-3 bg-emerald-50 rounded-lg">
                <p className="text-2xl font-bold text-emerald-700">{stats.resolvedComplaints}</p>
                <p className="text-xs text-emerald-600">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Fee Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Fee Amount</span>
                <span className="font-semibold">₹{stats.totalFeeAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Collected</span>
                <span className="font-semibold text-emerald-600">₹{stats.collectedFeeAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Outstanding</span>
                <span className="font-semibold text-red-600">₹{(stats.totalFeeAmount - stats.collectedFeeAmount).toLocaleString()}</span>
              </div>
              <Progress value={(stats.collectedFeeAmount / stats.totalFeeAmount) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">
                {((stats.collectedFeeAmount / stats.totalFeeAmount) * 100).toFixed(1)}% collected
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-20" /></CardContent></Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent><Skeleton className="h-48" /></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent><Skeleton className="h-48" /></CardContent></Card>
      </div>
    </div>
  )
}

// ===================== HOSTELS SECTION =====================
export function HostelsSection() {
  const [hostels, setHostels] = useState<HostelType[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingHostel, setEditingHostel] = useState<HostelType | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', type: 'Boys', totalRooms: 0, address: '' })
  const [saving, setSaving] = useState(false)

  const fetchHostels = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiFetch<HostelType[]>('/api/hostels')
      setHostels(data)
    } catch { toast.error('Failed to load hostels') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchHostels() }, [fetchHostels])

  const openCreate = () => {
    setEditingHostel(null)
    setForm({ name: '', type: 'Boys', totalRooms: 0, address: '' })
    setDialogOpen(true)
  }

  const openEdit = (hostel: HostelType) => {
    setEditingHostel(hostel)
    setForm({ name: hostel.name, type: hostel.type, totalRooms: hostel.totalRooms, address: hostel.address || '' })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    try {
      setSaving(true)
      if (editingHostel) {
        await apiFetch(`/api/hostels/${editingHostel.id}`, {
          method: 'PUT', body: JSON.stringify(form)
        })
        toast.success('Hostel updated successfully')
      } else {
        await apiFetch('/api/hostels', {
          method: 'POST', body: JSON.stringify(form)
        })
        toast.success('Hostel created successfully')
      }
      setDialogOpen(false)
      fetchHostels()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save hostel')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await apiFetch(`/api/hostels/${deletingId}`, { method: 'DELETE' })
      toast.success('Hostel deleted successfully')
      fetchHostels()
    } catch { toast.error('Failed to delete hostel') }
    finally { setDeleteDialogOpen(false); setDeletingId(null) }
  }

  if (loading) return <ListSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Hostels</h2>
          <p className="text-muted-foreground">Manage hostel buildings and their details</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> Add Hostel
        </Button>
      </div>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 md:hidden gap-4">
        {hostels.map((h) => (
          <Card key={h.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{h.name}</h3>
                  <Badge variant="outline" className="mt-1">{h.type}</Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(h)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-red-600" onClick={() => { setDeletingId(h.id); setDeleteDialogOpen(true) }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Rooms:</span> {h.totalRooms}</div>
                <div><span className="text-muted-foreground">Occupancy:</span> {h.totalOccupancy || 0}/{h.totalCapacity || 0}</div>
                {h.address && <div className="col-span-2"><span className="text-muted-foreground">Address:</span> {h.address}</div>}
              </div>
              {(h.totalCapacity || 0) > 0 && (
                <div className="mt-3">
                  <Progress value={((h.totalOccupancy || 0) / (h.totalCapacity || 1)) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{Math.round(((h.totalOccupancy || 0) / (h.totalCapacity || 1)) * 100)}% occupied</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Rooms</TableHead>
                  <TableHead>Occupancy</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hostels.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No hostels found</TableCell></TableRow>
                ) : hostels.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">{h.name}</TableCell>
                    <TableCell><Badge variant="outline">{h.type}</Badge></TableCell>
                    <TableCell>{h.totalRooms}</TableCell>
                    <TableCell>{h.totalOccupancy || 0}/{h.totalCapacity || 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={((h.totalOccupancy || 0) / Math.max(h.totalCapacity || 1, 1)) * 100} className="h-2 w-16" />
                        <span className="text-xs">{Math.round(((h.totalOccupancy || 0) / Math.max(h.totalCapacity || 1, 1)) * 100)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-32 truncate">{h.address || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(h)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-red-600" onClick={() => { setDeletingId(h.id); setDeleteDialogOpen(true) }}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Hostel Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingHostel ? 'Edit Hostel' : 'Add New Hostel'}</DialogTitle>
            <DialogDescription>
              {editingHostel ? 'Update hostel information' : 'Enter details for the new hostel'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Hostel name" /></div>
            <div><Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Boys">Boys</SelectItem>
                  <SelectItem value="Girls">Girls</SelectItem>
                  <SelectItem value="Co-ed">Co-ed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Total Rooms</Label><Input type="number" value={form.totalRooms} onChange={e => setForm(f => ({ ...f, totalRooms: parseInt(e.target.value) || 0 }))} /></div>
            <div><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Optional" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? 'Saving...' : editingHostel ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Hostel</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This will also delete all rooms in this hostel and unassign all students.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ===================== ROOMS SECTION =====================
export function RoomsSection() {
  const [rooms, setRooms] = useState<RoomType[]>([])
  const [hostels, setHostels] = useState<HostelType[]>([])
  const [loading, setLoading] = useState(true)
  const [hostelFilter, setHostelFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<RoomType | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState({ number: '', floor: 1, capacity: 2, hostelId: '' })
  const [saving, setSaving] = useState(false)

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true)
      const url = hostelFilter !== 'all' ? `/api/rooms?hostelId=${hostelFilter}` : '/api/rooms'
      const data = await apiFetch<RoomType[]>(url)
      setRooms(data)
    } catch { toast.error('Failed to load rooms') }
    finally { setLoading(false) }
  }, [hostelFilter])

  const fetchHostels = useCallback(async () => {
    try {
      const data = await apiFetch<HostelType[]>('/api/hostels')
      setHostels(data)
      if (data.length > 0 && !form.hostelId) setForm(f => ({ ...f, hostelId: data[0].id }))
    } catch { /* ignore */ }
  }, [form.hostelId])

  useEffect(() => { fetchHostels(); fetchRooms() }, [fetchHostels, fetchRooms])

  const openCreate = () => {
    setEditingRoom(null)
    setForm({ number: '', floor: 1, capacity: 2, hostelId: hostels[0]?.id || '' })
    setDialogOpen(true)
  }

  const openEdit = (room: RoomType) => {
    setEditingRoom(room)
    setForm({ number: room.number, floor: room.floor, capacity: room.capacity, hostelId: room.hostelId })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.number.trim() || !form.hostelId) { toast.error('Room number and hostel are required'); return }
    try {
      setSaving(true)
      if (editingRoom) {
        await apiFetch(`/api/rooms/${editingRoom.id}`, { method: 'PUT', body: JSON.stringify(form) })
        toast.success('Room updated successfully')
      } else {
        await apiFetch('/api/rooms', { method: 'POST', body: JSON.stringify(form) })
        toast.success('Room created successfully')
      }
      setDialogOpen(false)
      fetchRooms()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save room')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await apiFetch(`/api/rooms/${deletingId}`, { method: 'DELETE' })
      toast.success('Room deleted successfully')
      fetchRooms()
    } catch { toast.error('Failed to delete room') }
    finally { setDeleteDialogOpen(false); setDeletingId(null) }
  }

  const getOccupancyColor = (current: number, capacity: number) => {
    const ratio = current / capacity
    if (ratio >= 1) return 'bg-red-500'
    if (ratio >= 0.5) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  if (loading) return <ListSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Rooms</h2>
          <p className="text-muted-foreground">Manage room allocation and details</p>
        </div>
        <div className="flex gap-2">
          <Select value={hostelFilter} onValueChange={setHostelFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Filter hostel" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Hostels</SelectItem>
              {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={openCreate} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> Add Room
          </Button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room No.</TableHead>
                  <TableHead>Hostel</TableHead>
                  <TableHead>Floor</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Occupancy</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No rooms found</TableCell></TableRow>
                ) : rooms.map((r) => {
                  const occ = r._count?.students || 0
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.number}</TableCell>
                      <TableCell>{r.hostel?.name || '-'}</TableCell>
                      <TableCell>{r.floor}</TableCell>
                      <TableCell>{r.capacity}</TableCell>
                      <TableCell>{occ}/{r.capacity}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getOccupancyColor(occ, r.capacity)}`} />
                          <span className="text-xs">{occ >= r.capacity ? 'Full' : occ > 0 ? 'Partial' : 'Empty'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-red-600" onClick={() => { setDeletingId(r.id); setDeleteDialogOpen(true) }}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 md:hidden gap-4">
        {rooms.map((r) => {
          const occ = r._count?.students || 0
          return (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">Room {r.number}</h3>
                    <p className="text-sm text-muted-foreground">{r.hostel?.name} • Floor {r.floor}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getOccupancyColor(occ, r.capacity)}`} />
                    <span className="text-xs">{occ >= r.capacity ? 'Full' : 'Partial'}</span>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm">Occupancy: {occ}/{r.capacity}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => { setDeletingId(r.id); setDeleteDialogOpen(true) }}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
                <Progress value={(occ / Math.max(r.capacity, 1)) * 100} className="h-2 mt-2" />
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Room Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRoom ? 'Edit Room' : 'Add New Room'}</DialogTitle>
            <DialogDescription>{editingRoom ? 'Update room details' : 'Enter details for the new room'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Room Number</Label><Input value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} placeholder="e.g. 101" /></div>
            <div><Label>Hostel</Label>
              <Select value={form.hostelId} onValueChange={v => setForm(f => ({ ...f, hostelId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select hostel" /></SelectTrigger>
                <SelectContent>{hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Floor</Label><Input type="number" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: parseInt(e.target.value) || 1 }))} /></div>
              <div><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: parseInt(e.target.value) || 1 }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving ? 'Saving...' : editingRoom ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? Students in this room will be unassigned.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ===================== STUDENTS SECTION =====================
export function StudentsSection() {
  const [students, setStudents] = useState<StudentType[]>([])
  const [hostels, setHostels] = useState<HostelType[]>([])
  const [allRooms, setAllRooms] = useState<RoomType[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [semFilter, setSemFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<StudentType | null>(null)
  const [viewingStudent, setViewingStudent] = useState<StudentType | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', rollNo: '', department: 'Computer Science',
    semester: 1, roomId: '', guardianName: '', guardianPhone: '', address: ''
  })

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (deptFilter !== 'all') params.set('department', deptFilter)
      if (semFilter !== 'all') params.set('semester', semFilter)
      const data = await apiFetch<StudentType[]>(`/api/students?${params.toString()}`)
      setStudents(data)
    } catch { toast.error('Failed to load students') }
    finally { setLoading(false) }
  }, [search, deptFilter, semFilter])

  const fetchMeta = useCallback(async () => {
    try {
      const [h, r] = await Promise.all([
        apiFetch<HostelType[]>('/api/hostels'),
        apiFetch<RoomType[]>('/api/rooms')
      ])
      setHostels(h)
      setAllRooms(r)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchMeta(); fetchStudents() }, [fetchMeta, fetchStudents])

  const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Chemical']

  const openCreate = () => {
    setEditingStudent(null)
    setForm({ name: '', email: '', phone: '', rollNo: '', department: 'Computer Science', semester: 1, roomId: '', guardianName: '', guardianPhone: '', address: '' })
    setDialogOpen(true)
  }

  const openEdit = (s: StudentType) => {
    setEditingStudent(s)
    setForm({
      name: s.name, email: s.email, phone: s.phone, rollNo: s.rollNo,
      department: s.department, semester: s.semester, roomId: s.roomId || '',
      guardianName: s.guardianName || '', guardianPhone: s.guardianPhone || '', address: s.address || ''
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.rollNo.trim()) {
      toast.error('Name, email and roll number are required'); return
    }
    try {
      setSaving(true)
      const payload = { ...form, roomId: form.roomId || null }
      if (editingStudent) {
        await apiFetch(`/api/students/${editingStudent.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        toast.success('Student updated successfully')
      } else {
        await apiFetch('/api/students', { method: 'POST', body: JSON.stringify(payload) })
        toast.success('Student added successfully')
      }
      setDialogOpen(false)
      fetchStudents()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save student')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await apiFetch(`/api/students/${deletingId}`, { method: 'DELETE' })
      toast.success('Student deleted')
      fetchStudents()
    } catch { toast.error('Failed to delete student') }
    finally { setDeleteDialogOpen(false); setDeletingId(null) }
  }

  const openDetail = async (id: string) => {
    try {
      const data = await apiFetch<StudentType>(`/api/students/${id}`)
      setViewingStudent(data)
      setDetailDialogOpen(true)
    } catch { toast.error('Failed to load student details') }
  }

  if (loading) return <ListSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Students</h2>
          <p className="text-muted-foreground">Manage student records and room assignments</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <UserPlus className="h-4 w-4" /> Add Student
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name, roll no, email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={semFilter} onValueChange={setSemFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Semester" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sem</SelectItem>
            {[2, 4, 6, 8].map(s => <SelectItem key={s} value={s.toString()}>Sem {s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Sem</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No students found</TableCell></TableRow>
                ) : students.map((s) => (
                  <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(s.id)}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.rollNo}</TableCell>
                    <TableCell>{s.department}</TableCell>
                    <TableCell>{s.semester}</TableCell>
                    <TableCell>{s.room ? `${s.room.number} (${s.room.hostel?.name})` : <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                    <TableCell>{s.phone}</TableCell>
                    <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-red-600" onClick={() => { setDeletingId(s.id); setDeleteDialogOpen(true) }}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 lg:hidden gap-4">
        {students.map((s) => (
          <Card key={s.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDetail(s.id)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{s.name}</h3>
                  <p className="text-sm text-muted-foreground">{s.rollNo} • {s.department}</p>
                </div>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}><Pencil className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => { setDeletingId(s.id); setDeleteDialogOpen(true) }}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline">Sem {s.semester}</Badge>
                <Badge variant="outline">{s.room ? `Room ${s.room.number}` : 'Unassigned'}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Student Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          {viewingStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Name:</span><p className="font-medium">{viewingStudent.name}</p></div>
                <div><span className="text-muted-foreground">Roll No:</span><p className="font-medium">{viewingStudent.rollNo}</p></div>
                <div><span className="text-muted-foreground">Email:</span><p className="font-medium">{viewingStudent.email}</p></div>
                <div><span className="text-muted-foreground">Phone:</span><p className="font-medium">{viewingStudent.phone}</p></div>
                <div><span className="text-muted-foreground">Department:</span><p className="font-medium">{viewingStudent.department}</p></div>
                <div><span className="text-muted-foreground">Semester:</span><p className="font-medium">{viewingStudent.semester}</p></div>
                <div><span className="text-muted-foreground">Room:</span><p className="font-medium">{viewingStudent.room ? `${viewingStudent.room.number} (${viewingStudent.room.hostel?.name})` : 'Unassigned'}</p></div>
                <div><span className="text-muted-foreground">Guardian:</span><p className="font-medium">{viewingStudent.guardianName || '-'}</p></div>
                <div><span className="text-muted-foreground">Guardian Phone:</span><p className="font-medium">{viewingStudent.guardianPhone || '-'}</p></div>
                <div><span className="text-muted-foreground">Address:</span><p className="font-medium">{viewingStudent.address || '-'}</p></div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                  <p className="text-xl font-bold text-emerald-700">{viewingStudent.fees?.length || 0}</p>
                  <p className="text-xs text-emerald-600">Fee Records</p>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                  <p className="text-xl font-bold text-amber-700">{viewingStudent.complaints?.length || 0}</p>
                  <p className="text-xs text-amber-600">Complaints</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Student Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
            <DialogDescription>{editingStudent ? 'Update student information' : 'Enter student details'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><Label>Roll No *</Label><Input value={form.rollNo} onChange={e => setForm(f => ({ ...f, rollNo: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Department</Label>
                <Select value={form.department} onValueChange={v => setForm(f => ({ ...f, department: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Semester</Label>
                <Select value={form.semester.toString()} onValueChange={v => setForm(f => ({ ...f, semester: parseInt(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{[1,2,3,4,5,6,7,8].map(s => <SelectItem key={s} value={s.toString()}>Semester {s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Assign Room</Label>
              <Select value={form.roomId} onValueChange={v => setForm(f => ({ ...f, roomId: v }))}>
                <SelectTrigger><SelectValue placeholder="No room assigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Room</SelectItem>
                  {allRooms.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.number} - {r.hostel?.name} ({r._count?.students || 0}/{r.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Guardian Name</Label><Input value={form.guardianName} onChange={e => setForm(f => ({ ...f, guardianName: e.target.value }))} /></div>
              <div><Label>Guardian Phone</Label><Input value={form.guardianPhone} onChange={e => setForm(f => ({ ...f, guardianPhone: e.target.value }))} /></div>
            </div>
            <div><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving ? 'Saving...' : editingStudent ? 'Update' : 'Add Student'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Student</AlertDialogTitle><AlertDialogDescription>Are you sure? This will also delete all associated fee and complaint records.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ===================== FEES SECTION =====================
export function FeesSection() {
  const [fees, setFees] = useState<FeeType[]>([])
  const [students, setStudents] = useState<StudentType[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState({ studentId: '', amount: 5000, month: 'January', year: 2025, status: 'Pending' })
  const [saving, setSaving] = useState(false)

  const fetchFees = useCallback(async () => {
    try {
      setLoading(true)
      const url = statusFilter !== 'all' ? `/api/fees?status=${statusFilter}` : '/api/fees'
      const data = await apiFetch<FeeType[]>(url)
      setFees(data)
    } catch { toast.error('Failed to load fees') }
    finally { setLoading(false) }
  }, [statusFilter])

  const fetchStudents = useCallback(async () => {
    try {
      const data = await apiFetch<StudentType[]>('/api/students')
      setStudents(data)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchStudents(); fetchFees() }, [fetchStudents, fetchFees])

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  const handleSave = async () => {
    if (!form.studentId) { toast.error('Please select a student'); return }
    try {
      setSaving(true)
      await apiFetch('/api/fees', { method: 'POST', body: JSON.stringify(form) })
      toast.success('Fee entry created successfully')
      setDialogOpen(false)
      fetchFees()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create fee entry')
    } finally { setSaving(false) }
  }

  const markAsPaid = async (id: string) => {
    try {
      await apiFetch(`/api/fees/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'Paid' }) })
      toast.success('Fee marked as paid')
      fetchFees()
    } catch { toast.error('Failed to update fee') }
  }

  const markAsOverdue = async (id: string) => {
    try {
      await apiFetch(`/api/fees/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'Overdue' }) })
      toast.success('Fee marked as overdue')
      fetchFees()
    } catch { toast.error('Failed to update fee') }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await apiFetch(`/api/fees/${deletingId}`, { method: 'DELETE' })
      toast.success('Fee entry deleted')
      fetchFees()
    } catch { toast.error('Failed to delete fee') }
    finally { setDeleteDialogOpen(false); setDeletingId(null) }
  }

  // Summary stats
  const totalAmount = fees.reduce((sum, f) => sum + f.amount, 0)
  const paidAmount = fees.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0)
  const pendingAmount = fees.filter(f => f.status === 'Pending').reduce((sum, f) => sum + f.amount, 0)
  const overdueAmount = fees.filter(f => f.status === 'Overdue').reduce((sum, f) => sum + f.amount, 0)

  if (loading) return <ListSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Fee Management</h2>
          <p className="text-muted-foreground">Track and manage student fee payments</p>
        </div>
        <Button onClick={() => { setForm({ studentId: students[0]?.id || '', amount: 5000, month: 'January', year: 2025, status: 'Pending' }); setDialogOpen(true) }} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> Add Fee
        </Button>
      </div>

      {/* Fee Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Total</p><p className="text-xl font-bold">₹{totalAmount.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Collected</p><p className="text-xl font-bold text-emerald-600">₹{paidAmount.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Pending</p><p className="text-xl font-bold text-amber-600">₹{pendingAmount.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Overdue</p><p className="text-xl font-bold text-red-600">₹{overdueAmount.toLocaleString()}</p></CardContent></Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'Paid', 'Pending', 'Overdue'].map(s => (
          <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm"
            onClick={() => setStatusFilter(s)}
            className={statusFilter === s ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >{s === 'all' ? 'All' : s}</Button>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Month/Year</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No fee records found</TableCell></TableRow>
                ) : fees.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.student?.name || '-'}</TableCell>
                    <TableCell>{f.student?.rollNo || '-'}</TableCell>
                    <TableCell>{f.month} {f.year}</TableCell>
                    <TableCell>₹{f.amount.toLocaleString()}</TableCell>
                    <TableCell><FeeStatusBadge status={f.status} /></TableCell>
                    <TableCell className="text-sm">{f.paidDate ? new Date(f.paidDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell className="text-right">
                      {f.status !== 'Paid' && (
                        <Button variant="ghost" size="sm" className="text-emerald-600" onClick={() => markAsPaid(f.id)}>
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Pay
                        </Button>
                      )}
                      {f.status === 'Pending' && (
                        <Button variant="ghost" size="sm" className="text-amber-600" onClick={() => markAsOverdue(f.id)}>
                          <AlertCircle className="h-4 w-4 mr-1" /> Overdue
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="text-red-600" onClick={() => { setDeletingId(f.id); setDeleteDialogOpen(true) }}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 md:hidden gap-4">
        {fees.map((f) => (
          <Card key={f.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{f.student?.name || '-'}</h3>
                  <p className="text-sm text-muted-foreground">{f.student?.rollNo} • {f.month} {f.year}</p>
                </div>
                <FeeStatusBadge status={f.status} />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-lg font-bold">₹{f.amount.toLocaleString()}</span>
                <div className="flex gap-1">
                  {f.status !== 'Paid' && (
                    <Button size="sm" variant="outline" className="text-emerald-600 h-7" onClick={() => markAsPaid(f.id)}>Pay</Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => { setDeletingId(f.id); setDeleteDialogOpen(true) }}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Fee Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Fee Entry</DialogTitle><DialogDescription>Assign a fee to a student</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><Label>Student</Label>
              <Select value={form.studentId} onValueChange={v => setForm(f => ({ ...f, studentId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.rollNo})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Amount (₹)</Label><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Month</Label>
                <Select value={form.month} onValueChange={v => setForm(f => ({ ...f, month: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Year</Label><Input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) || 2025 }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving ? 'Saving...' : 'Add Fee'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Fee Entry</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete this fee entry?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ===================== COMPLAINTS SECTION =====================
export function ComplaintsSection() {
  const [complaints, setComplaints] = useState<ComplaintType[]>([])
  const [students, setStudents] = useState<StudentType[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState({ studentId: '', title: '', description: '', category: 'Plumbing', priority: 'Medium' })
  const [saving, setSaving] = useState(false)

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (priorityFilter !== 'all') params.set('priority', priorityFilter)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      const data = await apiFetch<ComplaintType[]>(`/api/complaints?${params.toString()}`)
      setComplaints(data)
    } catch { toast.error('Failed to load complaints') }
    finally { setLoading(false) }
  }, [statusFilter, priorityFilter, categoryFilter])

  const fetchStudents = useCallback(async () => {
    try { setStudents(await apiFetch<StudentType[]>('/api/students')) } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchStudents(); fetchComplaints() }, [fetchStudents, fetchComplaints])

  const categories = ['Plumbing', 'Electrical', 'Cleaning', 'Internet', 'Other']

  const handleSave = async () => {
    if (!form.title.trim() || !form.studentId) { toast.error('Title and student are required'); return }
    try {
      setSaving(true)
      await apiFetch('/api/complaints', { method: 'POST', body: JSON.stringify(form) })
      toast.success('Complaint submitted successfully')
      setDialogOpen(false)
      fetchComplaints()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit complaint')
    } finally { setSaving(false) }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiFetch(`/api/complaints/${id}`, { method: 'PUT', body: JSON.stringify({ status }) })
      toast.success(`Complaint marked as ${status}`)
      fetchComplaints()
    } catch { toast.error('Failed to update complaint') }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await apiFetch(`/api/complaints/${deletingId}`, { method: 'DELETE' })
      toast.success('Complaint deleted')
      fetchComplaints()
    } catch { toast.error('Failed to delete complaint') }
    finally { setDeleteDialogOpen(false); setDeletingId(null) }
  }

  if (loading) return <ListSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Complaints</h2>
          <p className="text-muted-foreground">Track and resolve student complaints</p>
        </div>
        <Button onClick={() => { setForm({ studentId: students[0]?.id || '', title: '', description: '', category: 'Plumbing', priority: 'Medium' }); setDialogOpen(true) }} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> New Complaint
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaints.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No complaints found</TableCell></TableRow>
                ) : complaints.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium max-w-48 truncate">{c.title}</TableCell>
                    <TableCell>{c.student?.name || '-'}</TableCell>
                    <TableCell><CategoryBadge category={c.category} /></TableCell>
                    <TableCell><PriorityBadge priority={c.priority} /></TableCell>
                    <TableCell><ComplaintStatusBadge status={c.status} /></TableCell>
                    <TableCell className="text-sm">{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      {c.status === 'Open' && (
                        <Button variant="ghost" size="sm" className="text-amber-600" onClick={() => updateStatus(c.id, 'In Progress')}>Start</Button>
                      )}
                      {c.status === 'In Progress' && (
                        <Button variant="ghost" size="sm" className="text-emerald-600" onClick={() => updateStatus(c.id, 'Resolved')}>Resolve</Button>
                      )}
                      <Button variant="ghost" size="icon" className="text-red-600" onClick={() => { setDeletingId(c.id); setDeleteDialogOpen(true) }}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 lg:hidden gap-4">
        {complaints.map((c) => (
          <Card key={c.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm">{c.title}</h3>
                <ComplaintStatusBadge status={c.status} />
              </div>
              <p className="text-xs text-muted-foreground mb-3">{c.student?.name} • {new Date(c.createdAt).toLocaleDateString()}</p>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{c.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <CategoryBadge category={c.category} />
                  <PriorityBadge priority={c.priority} />
                </div>
                <div className="flex gap-1">
                  {c.status === 'Open' && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateStatus(c.id, 'In Progress')}>Start</Button>}
                  {c.status === 'In Progress' && <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600" onClick={() => updateStatus(c.id, 'Resolved')}>Resolve</Button>}
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => { setDeletingId(c.id); setDeleteDialogOpen(true) }}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Complaint Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Complaint</DialogTitle><DialogDescription>Submit a new complaint</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><Label>Student</Label>
              <Select value={form.studentId} onValueChange={v => setForm(f => ({ ...f, studentId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.rollNo})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Brief complaint title" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detailed description" rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving ? 'Submitting...' : 'Submit'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Complaint</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete this complaint?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ===================== NOTICES SECTION =====================
export function NoticesSection() {
  const [notices, setNotices] = useState<NoticeType[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingNotice, setEditingNotice] = useState<NoticeType | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', content: '', category: 'General', priority: 'Normal' })
  const [saving, setSaving] = useState(false)

  const fetchNotices = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiFetch<NoticeType[]>('/api/notices')
      setNotices(data)
    } catch { toast.error('Failed to load notices') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchNotices() }, [fetchNotices])

  const openCreate = () => {
    setEditingNotice(null)
    setForm({ title: '', content: '', category: 'General', priority: 'Normal' })
    setDialogOpen(true)
  }

  const openEdit = (n: NoticeType) => {
    setEditingNotice(n)
    setForm({ title: n.title, content: n.content, category: n.category, priority: n.priority })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) { toast.error('Title and content are required'); return }
    try {
      setSaving(true)
      if (editingNotice) {
        await apiFetch(`/api/notices/${editingNotice.id}`, { method: 'PUT', body: JSON.stringify(form) })
        toast.success('Notice updated')
      } else {
        await apiFetch('/api/notices', { method: 'POST', body: JSON.stringify(form) })
        toast.success('Notice published')
      }
      setDialogOpen(false)
      fetchNotices()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save notice')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await apiFetch(`/api/notices/${deletingId}`, { method: 'DELETE' })
      toast.success('Notice deleted')
      fetchNotices()
    } catch { toast.error('Failed to delete notice') }
    finally { setDeleteDialogOpen(false); setDeletingId(null) }
  }

  if (loading) return <ListSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notice Board</h2>
          <p className="text-muted-foreground">Publish and manage hostel notices</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> Add Notice
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notices.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-muted-foreground">No notices yet</div>
        ) : notices.map((n) => (
          <Card key={n.id} className={`hover:shadow-md transition-shadow ${n.priority === 'Urgent' ? 'border-red-200 border-2' : n.priority === 'Important' ? 'border-amber-200' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {n.title}
                    <NoticePriorityBadge priority={n.priority} />
                  </CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-2">
                    <CategoryBadge category={n.category} />
                    <span>• {new Date(n.createdAt).toLocaleDateString()}</span>
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(n)}><Pencil className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => { setDeletingId(n.id); setDeleteDialogOpen(true) }}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3">{n.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Notice Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNotice ? 'Edit Notice' : 'Publish Notice'}</DialogTitle>
            <DialogDescription>{editingNotice ? 'Update notice content' : 'Create a new notice for the hostel'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Notice title" /></div>
            <div><Label>Content</Label><Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Notice content" rows={4} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Event">Event</SelectItem>
                    <SelectItem value="Emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Important">Important</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving ? 'Saving...' : editingNotice ? 'Update' : 'Publish'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Notice</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete this notice?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ===================== SKELETON =====================
function ListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><Skeleton className="h-8 w-48 mb-2" /><Skeleton className="h-4 w-64" /></div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Card>
        <CardContent className="p-0">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-4 p-4 border-b last:border-0">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
