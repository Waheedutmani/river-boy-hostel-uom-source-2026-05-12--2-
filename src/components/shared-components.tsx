'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

// ===================== CURRENCY =====================
export function formatPKR(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString()}`
}

// ===================== CONSTANTS =====================
export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
export const DEPARTMENTS = ['Computer Science','Electrical Engineering','Mechanical Engineering','Civil Engineering','BBA','Physics','Mathematics','Chemistry','Botany','Zoology']
export const FEE_TYPES = ['Monthly Hostel Fee','Security Fee','Mess Fee','Maintenance Charges','Electricity Charges','Internet/WiFi Charges','Room Rent','Other']
export const PAYMENT_METHODS = ['Cash','Bank Transfer','EasyPaisa','JazzCash']
export const COMPLAINT_CATEGORIES = ['Plumbing','Electrical','Cleaning','Internet','Other']
export const MAINTENANCE_CATEGORIES = ['Plumbing','Electrical','Furniture','Cleaning','AC','Other']
export const NOTICE_CATEGORIES = ['General','Maintenance','Event','Emergency']
export const LEAVE_REASONS = ['Going Home','Emergency Leave','University Work','Vacation','Other']
export const VISITOR_RELATIONS = ['Father','Mother','Brother','Sister','Uncle','Aunt','Cousin','Friend','Other']
export const VISIT_PURPOSES = ['Personal Visit','Family Gathering','Academic Discussion','Medical Emergency','Document Delivery','Other']

// ===================== API HELPER =====================
export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options })
  if (!res.ok) { const err = await res.json().catch(() => ({ error: 'Request failed' })); throw new Error(err.error || 'Request failed') }
  return res.json()
}

// ===================== BADGES =====================
export function FeeStatusBadge({ status }: { status: string }) {
  const c: Record<string, string> = { Paid: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800', Pending: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800', Overdue: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800', 'Partially Paid': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800' }
  return <Badge variant="outline" className={`${c[status] || c.Pending} font-medium`}>{status}</Badge>
}
export function PaymentMethodBadge({ method }: { method: string }) {
  const c: Record<string, string> = { Cash: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800', 'Bank Transfer': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800', EasyPaisa: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800', JazzCash: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' }
  return <Badge variant="outline" className={`${c[method] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'} font-medium`}>{method}</Badge>
}
export function PaymentStatusBadge({ status }: { status: string }) {
  const c: Record<string, string> = { Pending: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800', Verified: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800', Rejected: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' }
  return <Badge variant="outline" className={`${c[status] || c.Pending} font-medium`}>{status}</Badge>
}
export function ComplaintStatusBadge({ status }: { status: string }) {
  const c: Record<string, string> = { Open: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800', 'In Progress': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800', Resolved: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' }
  return <Badge variant="outline" className={`${c[status] || c.Open} font-medium`}>{status}</Badge>
}
export function PriorityBadge({ priority }: { priority: string }) {
  const c: Record<string, string> = { Low: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700', Medium: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800', High: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' }
  return <Badge variant="outline" className={`${c[priority] || c.Medium} font-medium`}>{priority}</Badge>
}
export function NoticePriorityBadge({ priority }: { priority: string }) {
  const c: Record<string, string> = { Normal: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800', Important: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800', Urgent: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' }
  return <Badge variant="outline" className={`${c[priority] || c.Normal} font-medium`}>{priority}</Badge>
}
export function ApplicationStatusBadge({ status }: { status: string }) {
  const c: Record<string, string> = { Pending: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800', Approved: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800', Rejected: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' }
  return <Badge variant="outline" className={`${c[status] || c.Pending} font-medium`}>{status}</Badge>
}
export function RoomStatusBadge({ status }: { status: string }) {
  const c: Record<string, string> = { Available: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800', Occupied: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800', Maintenance: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' }
  return <Badge variant="outline" className={`${c[status] || c.Available} font-medium`}>{status}</Badge>
}
export function CategoryBadge({ category }: { category: string }) {
  const c: Record<string, string> = { Plumbing:'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', Electrical:'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', Cleaning:'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', Internet:'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300', Other:'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', General:'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', Maintenance:'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', Event:'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300', Emergency:'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', Furniture:'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300', AC:'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300' }
  return <Badge className={`${c[category] || c.Other} font-medium`}>{category}</Badge>
}
export function StaffRoleBadge({ role }: { role: string }) {
  const c: Record<string, string> = { Warden:'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', Clerk:'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300', Security:'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', Cleaner:'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', Electrician:'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', Plumber:'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300' }
  return <Badge className={`${c[role] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'} font-medium`}>{role}</Badge>
}
export function MovementStatusBadge({ status }: { status: string }) {
  const c: Record<string, string> = {
    Pending: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    Approved: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    Rejected: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    Out: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
    Returned: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    'Late Return': 'bg-red-100 text-red-800 border-red-200 animate-subtle-pulse dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  }
  return <Badge variant="outline" className={`${c[status] || c.Pending} font-medium`}>{status}</Badge>
}
export function LeaveReasonBadge({ reason }: { reason: string }) {
  const c: Record<string, string> = {
    'Going Home': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'Emergency Leave': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    'University Work': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'Vacation': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'Other': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  }
  return <Badge className={`${c[reason] || c.Other} font-medium`}>{reason}</Badge>
}

export function VisitorStatusBadge({ status }: { status: string }) {
  const c: Record<string, string> = {
    Pending: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    Approved: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    Rejected: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    'Checked In': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    'Checked Out': 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  }
  return <Badge variant="outline" className={`${c[status] || c.Pending} font-medium`}>{status}</Badge>
}

export function VisitorRelationBadge({ relation }: { relation: string }) {
  const c: Record<string, string> = {
    Father: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    Mother: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    Brother: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    Sister: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    Uncle: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    Aunt: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
    Cousin: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    Friend: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    Other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  }
  return <Badge className={`${c[relation] || c.Other} font-medium`}>{relation}</Badge>
}

// ===================== SHARED TYPES =====================
export type AdminPage = 'dashboard' | 'students' | 'rooms' | 'room-viz' | 'applications' | 'fees' | 'complaints' | 'maintenance' | 'staff' | 'notices' | 'visitors' | 'movements' | 'reports' | 'notifications' | 'announcements' | 'notification-analytics' | 'ai-automation' | 'ai-usage' | 'security'
export type StudentPage = 'dashboard' | 'my-room' | 'apply' | 'fees' | 'complaints' | 'maintenance' | 'notices' | 'visitors' | 'movements' | 'rules' | 'profile' | 'notifications' | 'reminders' | 'communication' | 'security'

export interface HostelType { id: string; name: string; type: string; totalRooms: number; address: string | null; description: string | null }
export interface RoomType { id: string; number: string; floor: number; capacity: number; hostelId: string; status: string; hostel?: { name: string; type: string }; _count?: { students: number } }
export interface StudentType { id: string; userId: string; rollNo: string; department: string; semester: number; roomId: string | null; guardianName: string | null; guardianPhone: string | null; address: string | null; bloodGroup: string | null; emergencyContact: string | null; status: string; user?: { name: string; email: string; phone: string }; room?: { id?: string; number: string; floor?: number; capacity?: number; hostel?: { name: string } }; _count?: { fees: number; complaints: number } }
export interface FeeType { id: string; studentId: string; amount: number; month: string; year: number; status: string; paidDate: string | null; feeType: string; receiptNo: string | null; lateFine?: number; paymentMethod?: string | null; dueDate?: string | null; partiallyPaidAmount?: number; nextDueDate?: string | null; student?: { name: string; rollNo: string; department: string; room?: { number: string; hostel?: { name: string } } } }
export interface PaymentType { id: string; feeId: string; amount: number; paymentMethod: string; referenceNo: string | null; paidBy: string | null; verifiedBy: string | null; verifiedAt: string | null; status: string; notes: string | null; createdAt: string; updatedAt: string; fee?: FeeType }
export interface FeeStructureType { id: string; name: string; amount: number; feeType: string; description: string | null; isActive: boolean; createdAt: string; updatedAt: string }
export interface ComplaintType { id: string; studentId: string; title: string; description: string; category: string; status: string; priority: string; adminReply: string | null; createdAt: string; student?: { name: string; rollNo: string; department: string } }
export interface NoticeType { id: string; title: string; content: string; category: string; priority: string; createdBy: string | null; createdAt: string }
export interface ApplicationType { id: string; studentId: string; hostelId: string; preferredRoom: string | null; status: string; message: string | null; adminRemark: string | null; createdAt: string; student?: { name: string; rollNo: string; department: string }; hostel?: { name: string } }
export interface StaffType { id: string; name: string; role: string; phone: string; hostelId: string; salary: number | null; joinDate: string | null; status: string; hostel?: { name: string } }
export interface MaintenanceType { id: string; roomId: string; studentId: string; title: string; description: string; category: string; status: string; priority: string; createdAt: string; room?: { number: string; hostel?: { name: string } }; student?: { name: string; rollNo: string } }
export interface MovementType { id: string; studentId: string; reason: string; departureDate: string; expectedReturnDate: string; actualReturnDate: string | null; destination: string | null; guardianContact: string | null; notes: string | null; departureSignature: string | null; returnSignature: string | null; status: string; approvedBy: string | null; adminRemark: string | null; createdAt: string; updatedAt: string; student?: { id: string; name: string; email: string; rollNo: string; department: string; semester: number; room: { number: string; hostel: string } | null } }
export interface MovementStats { currentlyOutside: number; returnedToday: number; pendingApprovals: number; lateReturns: number; totalRecords: number }

export interface VisitorType { id: string; visitorName: string; cnic: string; contactNumber: string; relationWithStudent: string; studentId: string; roomId: string | null; visitPurpose: string; visitDate: string; entryTime: string | null; exitTime: string | null; status: string; approvedBy: string | null; adminRemark: string | null; createdAt: string; updatedAt: string; student?: { id: string; name: string; rollNo: string; department: string; room?: { number: string; hostel?: { name: string } } }; room?: { number: string; hostel?: { name: string } } }
export interface VisitorStats { totalToday: number; activeVisitors: number; pendingApprovals: number; totalAll: number; statusBreakdown: Record<string, number>; recentVisitors: VisitorType[] }

// ===================== PREMIUM STAT CARD =====================
export function StatCard({ title, value, icon, color, bg }: { title: string; value: string | number; icon: React.ReactNode; color: string; bg: string }) {
  return (
    <div className="dashboard-stat-card stat-card-shimmer">
      <div className="flex items-center gap-3 sm:gap-4 relative z-10">
        <div className={`stat-icon ${bg} shadow-sm shrink-0`}>
          <div className={color}>{icon}</div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-sm font-medium text-muted-foreground leading-tight">{title}</p>
          <p className="text-base sm:text-2xl font-bold truncate mt-0.5 animate-counter">{value}</p>
        </div>
      </div>
    </div>
  )
}

// ===================== PREMIUM LIST SKELETON =====================
export function ListSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex gap-3"><Skeleton className="h-10 flex-1 rounded-xl" /><Skeleton className="h-10 w-48 rounded-xl" /></div>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="premium-card p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4 rounded" /><Skeleton className="h-3 w-1/2 rounded" /></div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ===================== PREMIUM DASHBOARD SKELETON =====================
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Skeleton className="h-32 w-full rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="dashboard-stat-card p-5">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2"><Skeleton className="h-3 w-20 rounded" /><Skeleton className="h-6 w-16 rounded" /></div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-container p-5"><Skeleton className="h-56 w-full rounded-xl" /></div>
        <div className="chart-container p-5"><Skeleton className="h-56 w-full rounded-xl" /></div>
      </div>
    </div>
  )
}

// ===================== LIVE CLOCK COMPONENT =====================
export function LiveClock() {
  const [time, setTime] = React.useState('')
  const [date, setDate] = React.useState('')

  React.useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true }))
      setDate(now.toLocaleDateString('en-PK', { weekday: 'short', month: 'short', day: 'numeric' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="live-clock">
      <span className="clock-dot text-green-500">&#9679;</span>
      <span className="font-medium">{date}</span>
      <span className="text-muted-foreground">|</span>
      <span>{time}</span>
    </div>
  )
}

// ===================== BREADCRUMB COMPONENT =====================
export function Breadcrumb({ items }: { items: { label: string; active?: boolean }[] }) {
  return (
    <div className="breadcrumb-trail mb-4">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="separator">/</span>}
          <span className={item.active ? 'current' : ''}>{item.label}</span>
        </React.Fragment>
      ))}
    </div>
  )
}

// ===================== EMPTY STATE COMPONENT =====================
export function EmptyState({ icon, title, description, action }: { icon: React.ReactNode; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="premium-card p-8 text-center animate-fade-in">
      <div className="mx-auto w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-4 text-muted-foreground">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">{description}</p>
      {action}
    </div>
  )
}

// ===================== SECURITY BADGES =====================
export function AlertSeverityBadge({ severity }: { severity: string }) {
  const c: Record<string, string> = {
    low: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    medium: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    high: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
    critical: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800 animate-subtle-pulse',
  }
  return <Badge variant="outline" className={`${c[severity] || c.medium} font-medium`}>{severity}</Badge>
}

export function AlertTypeBadge({ type }: { type: string }) {
  const c: Record<string, string> = {
    failed_login: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    unauthorized_access: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    suspicious_activity: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    password_breach: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    account_locked: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  }
  const labels: Record<string, string> = {
    failed_login: 'Failed Login',
    unauthorized_access: 'Unauthorized Access',
    suspicious_activity: 'Suspicious Activity',
    password_breach: 'Password Reset',
    account_locked: 'Account Locked',
  }
  return <Badge className={`${c[type] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'} font-medium`}>{labels[type] || type}</Badge>
}

export function ActivityActionBadge({ action }: { action: string }) {
  const c: Record<string, string> = {
    login: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    logout: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    failed_login: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    create: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    update: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    delete: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    approve: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    reject: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    access_denied: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    password_change: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    resolve_alert: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  }
  return <Badge className={`${c[action] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'} font-medium text-[10px]`}>{action.replace(/_/g, ' ')}</Badge>
}

export function ActivityCategoryBadge({ category }: { category: string }) {
  const c: Record<string, string> = {
    auth: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    student: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    room: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    fee: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    complaint: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    maintenance: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    leave: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    visitor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    staff: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    notice: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    system: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  }
  return <Badge variant="outline" className={`${c[category] || c.system} font-medium text-[10px]`}>{category}</Badge>
}

// ===================== SECURITY TYPES =====================
export interface ActivityLogType {
  id: string
  userId: string | null
  userName: string
  userRole: string
  action: string
  category: string
  description: string
  ipAddress: string | null
  userAgent: string | null
  metadata: string | null
  createdAt: string
}

export interface SecurityAlertType {
  id: string
  type: string
  severity: string
  userId: string | null
  userName: string | null
  description: string
  ipAddress: string | null
  isResolved: boolean
  resolvedBy: string | null
  resolvedAt: string | null
  createdAt: string
}
