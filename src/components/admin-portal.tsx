'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import {
  LayoutDashboard, Users, DoorOpen, FileText, DollarSign, MessageSquare,
  Wrench, UserCog, Bell, BellRing, Radio, BarChart3, LogOut, Menu, Search, Moon, Sun,
  Plus, Edit, Trash2, Eye, CheckCircle, XCircle, ChevronDown, Activity,
  Download, RefreshCw, Home, Building2, AlertTriangle, Clock, ArrowUpRight,
  TrendingUp, Phone, Mail, MapPin, Calendar, CalendarDays, Shield, User, ArrowRightLeft, FileCheck,
  ChevronsLeft, ChevronsRight, Sparkles, Zap, X, Brain, Cpu, FileBarChart, Lightbulb, Search as SearchIcon, Wallet, BedDouble, UserCheck, Timer, ArrowRight, Lock, Key, Eye as EyeIcon, ShieldAlert, ShieldCheck, Fingerprint, AlertOctagon, ShieldOff, RotateCcw
} from 'lucide-react'

import {
  formatPKR, apiFetch,
  FeeStatusBadge, ComplaintStatusBadge, PriorityBadge, NoticePriorityBadge,
  ApplicationStatusBadge, RoomStatusBadge, CategoryBadge, StaffRoleBadge, MovementStatusBadge, LeaveReasonBadge,
  AlertSeverityBadge, AlertTypeBadge, ActivityActionBadge, ActivityCategoryBadge,
  PaymentMethodBadge, PaymentStatusBadge,
  StatCard, ListSkeleton, DashboardSkeleton, LiveClock, Breadcrumb,
  MONTHS, DEPARTMENTS, FEE_TYPES, PAYMENT_METHODS, COMPLAINT_CATEGORIES, MAINTENANCE_CATEGORIES, NOTICE_CATEGORIES, LEAVE_REASONS,
  type AdminPage, type HostelType, type RoomType, type StudentType, type FeeType,
  type FeeStructureType, type PaymentType,
  type ComplaintType, type NoticeType, type ApplicationType, type StaffType, type MaintenanceType, type MovementType, type MovementStats,
  type ActivityLogType, type SecurityAlertType, EmptyState,
} from '@/components/shared-components'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts'
import type { UserType } from '@/app/page'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// Sheet import removed - using manual overlay for mobile sidebar
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { SignatureCapture } from '@/components/signature-capture'
import { RoomVisualization } from '@/components/room-visualization'
import { SmartNotificationBell, NotificationCenter, AnnouncementBroadcast, NotificationAnalytics, SmartReminders, CommunicationSimulator } from '@/components/smart-notification-center'
import { AdminVisitors } from '@/components/visitor-management'
import { MobileBottomBar } from '@/components/mobile-bottom-bar'
import { AdminPaymentPanel } from '@/components/admin-payment-panel'

// ===================== NAV CONFIG =====================
const NAV_ITEMS: { key: AdminPage; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { key: 'students', label: 'Students', icon: <Users className="h-4 w-4" /> },
  { key: 'rooms', label: 'Rooms', icon: <DoorOpen className="h-4 w-4" /> },
  { key: 'room-viz', label: 'Room Visualization', icon: <Building2 className="h-4 w-4" /> },
  { key: 'applications', label: 'Applications', icon: <FileText className="h-4 w-4" /> },
  { key: 'fees', label: 'Fees', icon: <DollarSign className="h-4 w-4" /> },
  { key: 'complaints', label: 'Complaints', icon: <MessageSquare className="h-4 w-4" /> },
  { key: 'maintenance', label: 'Maintenance', icon: <Wrench className="h-4 w-4" /> },
  { key: 'staff', label: 'Staff', icon: <UserCog className="h-4 w-4" /> },
  { key: 'notices', label: 'Notices', icon: <Bell className="h-4 w-4" /> },
  { key: 'visitors', label: 'Visitors', icon: <Shield className="h-4 w-4" /> },
  { key: 'notifications', label: 'Notifications', icon: <BellRing className="h-4 w-4" /> },
  { key: 'announcements', label: 'Broadcasts', icon: <Radio className="h-4 w-4" /> },
  { key: 'movements', label: 'Movement Monitor', icon: <ArrowRightLeft className="h-4 w-4" /> },
  { key: 'notification-analytics', label: 'Notif. Analytics', icon: <BarChart3 className="h-4 w-4" /> },
  { key: 'reports', label: 'Reports', icon: <TrendingUp className="h-4 w-4" /> },
  { key: 'ai-automation', label: 'AI & Automation', icon: <Brain className="h-4 w-4" /> },
  { key: 'ai-usage', label: 'AI Usage Control', icon: <Zap className="h-4 w-4" /> },
  { key: 'security', label: 'Security', icon: <Shield className="h-4 w-4" /> },
]

const PAGE_TITLES: Record<AdminPage, string> = {
  dashboard: 'Dashboard',
  students: 'Student Management',
  rooms: 'Room Management',
  'room-viz': 'Room Visualization',
  applications: 'Applications',
  fees: 'Payment & Fee Management',
  complaints: 'Complaints',
  maintenance: 'Maintenance Requests',
  staff: 'Staff Management',
  notices: 'Notices',
  visitors: 'Visitor Management',
  notifications: 'Notification Center',
  announcements: 'Announcement Broadcasting',
  movements: 'Student Movement Monitoring',
  'notification-analytics': 'Notification Analytics',
  reports: 'Reports & Analytics',
  'ai-automation': 'AI & Automation',
  'ai-usage': 'AI Usage Control',
  security: 'Security & Access Control',
}

// ===================== SIDEBAR COMPONENT =====================
function AdminSidebarContent({ page, setPage, onCloseSidebar, userName, userEmail, collapsed, onToggleCollapse }: { page: AdminPage; setPage: (p: AdminPage) => void; onCloseSidebar: () => void; userName: string; userEmail: string; collapsed: boolean; onToggleCollapse: () => void }) {
  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening'

  return (
    <div className="flex flex-col h-full">
      {/* Logo Header */}
      <div className="p-4 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative sidebar-logo-icon">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
                <Home className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse-soft border-2 border-[#1e3a5f]" />
            </div>
            <div className="sidebar-logo-text">
              <h2 className="text-white font-bold text-sm">RBH Admin</h2>
              <p className="text-blue-200/70 text-[10px] font-medium">River Boy Hostel UOM</p>
            </div>
          </div>
          <button className="lg:hidden text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors" onClick={onCloseSidebar}>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* User Greeting */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border-2 border-green-400/30">
              <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white text-xs font-bold">
                {userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 sidebar-user-info">
              <p className="text-[10px] text-blue-200/60">{greeting},</p>
              <p className="text-sm font-semibold text-white truncate">{userName}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2 overflow-hidden">
        <nav className="px-2 space-y-0.5">
          {!collapsed && <div className="px-3 py-1.5 sidebar-section-title"><span className="text-[10px] font-semibold text-blue-200/40 uppercase tracking-wider">Main Menu</span></div>}
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => { setPage(item.key); onCloseSidebar() }}
              className={`sidebar-item ${page === item.key ? 'active' : ''} ${collapsed ? 'justify-center !px-0' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
              {page === item.key && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse-soft" />
              )}
            </button>
          ))}
        </nav>

        {/* Portal badge */}
        {!collapsed && (
          <div className="p-3 mx-2 mb-2 glass-card-dark rounded-xl mt-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-green-400" />
              <p className="text-xs font-medium text-blue-100">Admin Portal</p>
            </div>
            <p className="text-[10px] text-blue-300/50">FYP &bull; UOM &bull; 2026</p>
          </div>
        )}
      </ScrollArea>

      {/* Bottom Section */}
      <div className="p-3 border-t border-white/10 shrink-0">
        {/* Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-blue-200/60 hover:text-white hover:bg-white/8 transition-all text-sm"
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {!collapsed && <span className="sidebar-label">Collapse</span>}
        </button>
      </div>
    </div>
  )
}

// ===================== MAIN COMPONENT =====================
export function AdminPortal({ user, onLogout, onUserUpdate }: { user: UserType; onLogout: () => void; onUserUpdate: (u: UserType) => void }) {
  const [page, setPage] = useState<AdminPage>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { theme, setTheme } = useTheme()

  const toggleCollapse = () => setSidebarCollapsed(c => !c)

  return (
    <div className="flex h-screen overflow-hidden bg-background dashboard-mesh-bg">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-[45] lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

      {/* Desktop Sidebar - hidden on mobile, visible on lg+ */}
      <aside className={`hidden lg:flex ${sidebarCollapsed ? 'w-[72px]' : 'w-64'} sidebar-gradient flex-shrink-0 sidebar-transition flex-col ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <AdminSidebarContent page={page} setPage={setPage} onCloseSidebar={() => setSidebarOpen(false)} userName={user.name} userEmail={user.email} collapsed={sidebarCollapsed} onToggleCollapse={toggleCollapse} />
      </aside>

      {/* Mobile Sidebar Overlay - only visible when opened */}
      {sidebarOpen && (
        <aside className="fixed top-0 left-0 z-50 h-full w-72 sidebar-gradient flex flex-col lg:hidden" style={{ animation: 'slideInLeft 0.25s ease-out' }}>
          <AdminSidebarContent page={page} setPage={setPage} onCloseSidebar={() => setSidebarOpen(false)} userName={user.name} userEmail={user.email} collapsed={false} onToggleCollapse={() => {}} />
        </aside>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Premium Header */}
        <header className="h-16 header-glass flex items-center px-4 lg:px-6 gap-3 flex-shrink-0 z-20">
          <Button variant="ghost" size="icon" className="lg:hidden hover:bg-[#1e3a5f]/5 touch-manipulation" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden sm:flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-[#1e3a5f] to-green-500 rounded-full" />
            <h1 className="text-lg font-bold">{PAGE_TITLES[page]}</h1>
          </div>
          <h1 className="text-lg font-semibold sm:hidden">{PAGE_TITLES[page]}</h1>
          <div className="flex-1" />
          <div className="hidden md:flex items-center relative max-w-xs flex-1">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 rounded-xl bg-background/50 border-border/50"
            />
          </div>
          <LiveClock />
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="hover:bg-[#1e3a5f]/5">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <SmartNotificationBell userId={user.id} role={user.role} onViewAll={() => setPage('notifications')} />
          <Button variant="outline" size="sm" className="hidden sm:flex text-xs" onClick={async () => {
            try { await apiFetch('/api/seed', { method: 'POST' }); toast.success('Database seeded successfully!'); setPage('dashboard') }
            catch { toast.error('Failed to seed data') }
          }}>
            <RefreshCw className="h-3 w-3 mr-1" /> Seed
          </Button>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 hover:bg-[#1e3a5f]/5 px-2">
                <Avatar className="h-8 w-8 border-2 border-green-400/20">
                  <AvatarFallback className="bg-gradient-to-br from-[#1e3a5f] to-[#2a5a8f] text-white text-xs font-bold">
                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium">{user.name}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="profile-dropdown">
              <div className="p-3 border-b bg-gradient-to-r from-[#1e3a5f]/5 to-green-500/5 dark:from-[#1e3a5f]/20 dark:to-green-500/10">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-green-400/30">
                    <AvatarFallback className="bg-gradient-to-br from-[#1e3a5f] to-[#2a5a8f] text-white text-sm font-bold">
                      {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <Badge className="mt-1 bg-[#1e3a5f]/10 text-[#1e3a5f] dark:bg-[#1e3a5f]/30 dark:text-blue-300 text-[10px] px-1.5 py-0">{user.role === 'admin' ? 'Administrator' : user.role}</Badge>
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-red-600 gap-2 cursor-pointer">
                <LogOut className="h-4 w-4" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Breadcrumb + Page Content */}
        <main className="flex-1 overflow-y-auto p-4 pb-20 lg:p-6 lg:pb-6 custom-scrollbar">
          <div className="animate-fade-in">
            <Breadcrumb items={[{ label: 'Home' }, { label: PAGE_TITLES[page], active: true }]} />
            {page === 'dashboard' && <AdminDashboard user={user} searchQuery={searchQuery} />}
            {page === 'students' && <AdminStudents searchQuery={searchQuery} />}
            {page === 'rooms' && <AdminRooms searchQuery={searchQuery} />}
            {page === 'room-viz' && <RoomVisualization />}
            {page === 'applications' && <AdminApplications searchQuery={searchQuery} />}
            {page === 'fees' && <AdminPaymentPanel user={user} searchQuery={searchQuery} />}
            {page === 'complaints' && <AdminComplaints searchQuery={searchQuery} />}
            {page === 'maintenance' && <AdminMaintenance searchQuery={searchQuery} />}
            {page === 'staff' && <AdminStaff searchQuery={searchQuery} />}
            {page === 'notices' && <AdminNotices searchQuery={searchQuery} />}
            {page === 'visitors' && <AdminVisitors searchQuery={searchQuery} user={user} />}
            {page === 'notifications' && <NotificationCenter userId={user.id} role={user.role} />}
            {page === 'announcements' && <AnnouncementBroadcast userId={user.id} userName={user.name} />}
            {page === 'movements' && <AdminMovements searchQuery={searchQuery} user={user} />}
            {page === 'notification-analytics' && <NotificationAnalytics userId={user.id} />}
            {page === 'reports' && <AdminReports searchQuery={searchQuery} />}
            {page === 'ai-automation' && <AIAutomationPage user={user} />}
            {page === 'ai-usage' && <AdminAiUsagePanel user={user} />}
            {page === 'security' && <AdminSecurityPanel user={user} />}
            
          </div>
        </main>

        {/* Footer - hidden on mobile */}
        <footer className="hidden lg:flex h-10 border-t items-center justify-center px-4 shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#1e3a5f]/5 to-transparent dark:via-[#1e3a5f]/10" />
          <div className="relative flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse-soft" />
            <p className="text-xs text-muted-foreground">River Boy Hostel UOM &copy; 2026 &bull; University of Malakand &bull; FYP</p>
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse-soft" />
          </div>
        </footer>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomBar
        items={NAV_ITEMS.map(item => ({ key: item.key, label: item.label, icon: item.icon }))}
        activeKey={page}
        onNavigate={setPage}
        role="admin"
      />
    </div>
  )
}

// ===================== 1. ADMIN DASHBOARD =====================
function AdminDashboard({ user, searchQuery }: { user: UserType; searchQuery: string }) {
  const [data, setData] = useState<{
    totalStudents: number; totalRooms: number; occupiedRooms: number; availableRooms: number; maintenanceRooms: number;
    pendingApplications: number; monthlyRevenue: number; pendingRevenue: number; overdueRevenue: number;
    openComplaints: number; totalHostels: number; totalStaff: number;
    studentsOutside: number; pendingLeaveRequests: number; lateReturns: number; returnedToday: number;
    feeBreakdown: { paid: number; pending: number; overdue: number; paidAmount: number; pendingAmount: number; overdueAmount: number };
    monthlyRevenueTrend: { month: string; revenue: number }[];
    roomStatusBreakdown: { name: string; value: number; color: string }[];
    hostelOccupancy: { name: string; type: string; totalRooms: number; totalCapacity: number; totalOccupancy: number; occupancyRate: number }[];
    complaintCategories: Record<string, number>;
    complaintStats: { open: number; inProgress: number; resolved: number };
    latestComplaints: { id: string; title: string; studentName: string; category: string; priority: string; status: string; createdAt: string }[];
    recentActivities: { id: string; type: string; message: string; time: string }[];
    recentMovements: { id: string; reason: string; status: string; departureDate: string; expectedReturnDate: string; destination: string; studentName: string; rollNo: string; roomNumber: string; hostelName: string; createdAt: string }[];
    departmentBreakdown: Record<string, number>;
    recentPayments: { id: string; amount: number; feeType: string; studentName: string; paidDate: string | null }[];
  } | null>(null)
  const [loading, setLoading] = useState(true)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch<typeof data>(`/api/dashboard?role=admin&userId=${user.id}`)
      setData(res)
    } catch { toast.error('Failed to load dashboard') }
    setLoading(false)
  }, [user.id])

  useEffect(() => { loadDashboard().catch(() => {}) }, [loadDashboard])

  if (loading || !data) return <DashboardSkeleton />

  const occupancyRate = data.totalRooms > 0 ? Math.round((data.occupiedRooms / data.totalRooms) * 100) : 0
  const feeTotalCount = data.feeBreakdown.paid + data.feeBreakdown.pending + data.feeBreakdown.overdue
  const totalFeeAmount = data.feeBreakdown.paidAmount + data.feeBreakdown.pendingAmount + data.feeBreakdown.overdueAmount

  const feePieData = [
    { name: 'Paid', value: data.feeBreakdown.paid, amount: data.feeBreakdown.paidAmount, fill: '#22c55e' },
    { name: 'Pending', value: data.feeBreakdown.pending, amount: data.feeBreakdown.pendingAmount, fill: '#f59e0b' },
    { name: 'Overdue', value: data.feeBreakdown.overdue, amount: data.feeBreakdown.overdueAmount, fill: '#ef4444' },
  ].filter(d => d.value > 0)

  const topDepartments = Object.entries(data.departmentBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  const activityTypeIcon = (type: string) => {
    switch (type) {
      case 'complaint': return <MessageSquare className="h-3.5 w-3.5" />
      case 'application': return <FileText className="h-3.5 w-3.5" />
      case 'payment': return <DollarSign className="h-3.5 w-3.5" />
      case 'movement': return <ArrowRightLeft className="h-3.5 w-3.5" />
      default: return <Activity className="h-3.5 w-3.5" />
    }
  }

  const activityTypeStyle = (type: string) => {
    switch (type) {
      case 'complaint': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
      case 'application': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
      case 'payment': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
      case 'movement': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  const formatTimeAgo = (time: string) => {
    const diff = Date.now() - new Date(time).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return new Date(time).toLocaleDateString()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ========== 1. HERO BANNER ========== */}
      <div className="hostel-hero-bg rounded-2xl p-4 sm:p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/60 via-transparent to-[#0a1628]/30" />
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 animate-float">
                <Home className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl md:text-3xl font-bold">River Boy Hostel UOM</h2>
                <p className="text-blue-200/80 text-xs sm:text-sm">Admin Dashboard — University of Malakand</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="btn-green-glow text-white text-xs" onClick={loadDashboard}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mt-4 sm:mt-6">
            <div className="glass-card-dark rounded-xl px-3 py-2 sm:px-4 sm:py-3">
              <p className="text-[9px] sm:text-[10px] text-blue-200/70 font-medium uppercase tracking-wider">Revenue</p>
              <p className="text-base sm:text-xl font-bold mt-0.5">{formatPKR(data.monthlyRevenue)}</p>
            </div>
            <div className="glass-card-dark rounded-xl px-3 py-2 sm:px-4 sm:py-3">
              <p className="text-[9px] sm:text-[10px] text-blue-200/70 font-medium uppercase tracking-wider">Occupancy</p>
              <p className="text-base sm:text-xl font-bold mt-0.5">{occupancyRate}%</p>
            </div>
            <div className="glass-card-dark rounded-xl px-3 py-2 sm:px-4 sm:py-3">
              <p className="text-[9px] sm:text-[10px] text-blue-200/70 font-medium uppercase tracking-wider">Hostels</p>
              <p className="text-base sm:text-xl font-bold mt-0.5">{data.totalHostels}</p>
            </div>
            <div className="glass-card-dark rounded-xl px-3 py-2 sm:px-4 sm:py-3">
              <p className="text-[9px] sm:text-[10px] text-blue-200/70 font-medium uppercase tracking-wider">Students</p>
              <p className="text-base sm:text-xl font-bold mt-0.5">{data.totalStudents}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========== 2. EIGHT ANIMATED STAT CARDS ========== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 stagger-children">
        <StatCard title="Total Students" value={data.totalStudents} icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-900/20" />
        <StatCard title="Occupied Rooms" value={data.occupiedRooms} icon={<DoorOpen className="h-4 w-4 sm:h-5 sm:w-5" />} color="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-900/20" />
        <StatCard title="Available Rooms" value={data.availableRooms} icon={<Home className="h-4 w-4 sm:h-5 sm:w-5" />} color="text-green-600" bg="bg-green-50 dark:bg-green-900/20" />
        <StatCard title="Outside" value={data.studentsOutside} icon={<ArrowRightLeft className="h-4 w-4 sm:h-5 sm:w-5" />} color="text-orange-600" bg="bg-orange-50 dark:bg-orange-900/20" />
        <StatCard title="Pending Leave" value={data.pendingLeaveRequests} icon={<Clock className="h-4 w-4 sm:h-5 sm:w-5" />} color="text-amber-600" bg="bg-amber-50 dark:bg-amber-900/20" />
        <StatCard title="Revenue" value={formatPKR(data.monthlyRevenue)} icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />} color="text-green-600" bg="bg-green-50 dark:bg-green-900/20" />
        <StatCard title="Complaints" value={data.openComplaints} icon={<MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />} color="text-red-600" bg="bg-red-50 dark:bg-red-900/20" />
        <StatCard title="Late Returns" value={data.lateReturns} icon={<AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />} color="text-rose-600" bg="bg-rose-50 dark:bg-rose-900/20" />
      </div>

      {/* ========== 3. REAL-TIME HOSTEL MONITORING ========== */}
      <Card className="premium-card overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                Real-Time Monitoring
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-xs mt-1">Live student movement and status tracking</CardDescription>
            </div>
            <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-[10px] sm:text-xs font-medium text-green-600 dark:text-green-400">Live</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-2.5 sm:p-3 border border-orange-200/50 dark:border-orange-800/30">
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowRightLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-orange-600 dark:text-orange-400" />
                <span className="text-[9px] sm:text-[10px] font-medium text-orange-600/70 dark:text-orange-400/70 uppercase tracking-wider">Outside</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-orange-700 dark:text-orange-300">{data.studentsOutside}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-2.5 sm:p-3 border border-green-200/50 dark:border-green-800/30">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600 dark:text-green-400" />
                <span className="text-[9px] sm:text-[10px] font-medium text-green-600/70 dark:text-green-400/70 uppercase tracking-wider">Returned</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-green-700 dark:text-green-300">{data.returnedToday}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-2.5 sm:p-3 border border-amber-200/50 dark:border-amber-800/30">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-[9px] sm:text-[10px] font-medium text-amber-600/70 dark:text-amber-400/70 uppercase tracking-wider">Pending</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-amber-700 dark:text-amber-300">{data.pendingLeaveRequests}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-2.5 sm:p-3 border border-red-200/50 dark:border-red-800/30">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-600 dark:text-red-400" />
                <span className="text-[9px] sm:text-[10px] font-medium text-red-600/70 dark:text-red-400/70 uppercase tracking-wider">Late</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-red-700 dark:text-red-300">{data.lateReturns}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Movements</p>
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {data.recentMovements.slice(0, 5).map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-8 w-8 border border-border/50">
                      <AvatarFallback className="bg-gradient-to-br from-[#1e3a5f] to-[#2a5a8f] text-white text-[10px] font-bold">
                        {m.studentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{m.studentName}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{m.rollNo} &middot; Room {m.roomNumber} &middot; {m.hostelName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-[11px] text-muted-foreground truncate max-w-[100px]">{m.reason}</p>
                    </div>
                    <MovementStatusBadge status={m.status} />
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatTimeAgo(m.createdAt)}</span>
                  </div>
                </div>
              ))}
              {data.recentMovements.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No recent movements</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========== 4. REVENUE ANALYTICS ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Trend */}
        <Card className="chart-container premium-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Monthly Revenue Trend
            </CardTitle>
            <CardDescription className="text-xs">Revenue collection over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.monthlyRevenueTrend} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.08)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="rgba(30,58,95,0.3)" />
                <YAxis tick={{ fontSize: 12 }} stroke="rgba(30,58,95,0.3)" tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ borderRadius: '0.75rem', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                  formatter={(value: number) => [formatPKR(value), 'Revenue']}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#22c55e"
                  strokeWidth={3}
                  dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#22c55e', strokeWidth: 2, fill: '#fff' }}
                  animationDuration={1200}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fee Collection Stats */}
        <Card className="chart-container premium-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#1e3a5f]" />
              Fee Collection Status
            </CardTitle>
            <CardDescription className="text-xs">Breakdown of fee payments across all students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={feePieData}
                    cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                    dataKey="value" stroke="none"
                    animationBegin={0} animationDuration={800}
                  >
                    {feePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value} fees`, name]}
                    contentStyle={{ borderRadius: '0.75rem', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 flex-1 w-full">
                {feePieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{item.value}</p>
                      <p className="text-[11px] text-muted-foreground">{formatPKR(item.amount)}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Total Fees</span>
                    <div className="text-right">
                      <p className="text-sm font-bold">{feeTotalCount}</p>
                      <p className="text-[11px] text-muted-foreground">{formatPKR(totalFeeAmount)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========== 5. ROOM MANAGEMENT OVERVIEW ========== */}
      <Card className="premium-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#1e3a5f]" />
            Room Management Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Cards */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200/50 dark:border-green-800/30 card-hover">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-green-600/70 dark:text-green-400/70 font-medium">Available Rooms</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">{data.availableRooms}</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/30 card-hover">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70 font-medium">Occupied Rooms</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{data.occupiedRooms}</p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200/50 dark:border-yellow-800/30 card-hover">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs text-yellow-600/70 dark:text-yellow-400/70 font-medium">Maintenance</p>
                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{data.maintenanceRooms}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Room Status Pie Chart */}
            <div className="flex flex-col items-center">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 self-start">Room Status Distribution</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.roomStatusBreakdown}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                    dataKey="value" stroke="none"
                    animationBegin={0} animationDuration={800}
                  >
                    {data.roomStatusBreakdown.map((entry, index) => (
                      <Cell key={`room-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value} rooms`, name]}
                    contentStyle={{ borderRadius: '0.75rem', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Hostel Occupancy Progress Bars */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Hostel Occupancy</p>
              <div className="space-y-3">
                {data.hostelOccupancy.map((h) => (
                  <div key={h.name}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium">{h.name}</span>
                      <span className="text-muted-foreground text-xs">{h.totalOccupancy}/{h.totalCapacity} &middot; {h.occupancyRate}%</span>
                    </div>
                    <div className="premium-progress">
                      <div className="premium-progress-bar" style={{ width: `${h.occupancyRate}%` }} />
                    </div>
                  </div>
                ))}
                {data.hostelOccupancy.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No hostels found</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========== 6. COMPLAINT MANAGEMENT WIDGET ========== */}
      <Card className="premium-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#1e3a5f]" />
            Complaint Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center border border-blue-200/50 dark:border-blue-800/30">
              <p className="text-[10px] font-medium text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wider">Open</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{data.complaintStats?.open ?? 0}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center border border-amber-200/50 dark:border-amber-800/30">
              <p className="text-[10px] font-medium text-amber-600/70 dark:text-amber-400/70 uppercase tracking-wider">In Progress</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{data.complaintStats?.inProgress ?? 0}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center border border-green-200/50 dark:border-green-800/30">
              <p className="text-[10px] font-medium text-green-600/70 dark:text-green-400/70 uppercase tracking-wider">Resolved</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{data.complaintStats?.resolved ?? 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Complaint Categories */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Categories Breakdown</p>
              <div className="space-y-2">
                {Object.entries(data.complaintCategories).sort(([, a], [, b]) => b - a).map(([cat, count]) => {
                  const maxCount = Math.max(...Object.values(data.complaintCategories), 1)
                  const pct = (count / maxCount) * 100
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="text-xs font-medium w-24 truncate shrink-0">{cat}</span>
                      <div className="flex-1 h-5 bg-muted/50 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#1e3a5f] to-[#2a5a8f] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-bold w-6 text-right">{count}</span>
                    </div>
                  )
                })}
                {Object.keys(data.complaintCategories).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No complaints</p>
                )}
              </div>
            </div>

            {/* Latest Complaints */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Latest Complaints</p>
              <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
                {(data.latestComplaints ?? []).slice(0, 4).map((c) => (
                  <div key={c.id} className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{c.title}</p>
                      <PriorityBadge priority={c.priority} />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] text-muted-foreground">{c.studentName}</span>
                      <CategoryBadge category={c.category} />
                      <ComplaintStatusBadge status={c.status} />
                    </div>
                  </div>
                ))}
                {(data.latestComplaints ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No complaints</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========== 7. SMART WIDGETS ROW ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hostel Occupancy % */}
        <Card className="premium-card card-hover">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Occupancy Rate</p>
              <Building2 className="h-4 w-4 text-[#1e3a5f]" />
            </div>
            <p className="text-3xl font-bold">{occupancyRate}%</p>
            <div className="mt-3 premium-progress">
              <div className="premium-progress-bar" style={{ width: `${occupancyRate}%` }} />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">{data.occupiedRooms} of {data.totalRooms} rooms occupied</p>
          </CardContent>
        </Card>

        {/* Daily Activity Tracker */}
        <Card className="premium-card card-hover">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Today&apos;s Activity</p>
              <Zap className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-3xl font-bold">{data.recentActivities.length}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {data.recentMovements.length} movements &middot; {data.recentPayments.length} payments
            </p>
          </CardContent>
        </Card>

        {/* Revenue Summary */}
        <Card className="premium-card card-hover">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Revenue Summary</p>
              <DollarSign className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatPKR(data.feeBreakdown.paidAmount)}</p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">{formatPKR(data.feeBreakdown.pendingAmount)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Overdue</span>
                <span className="font-medium text-red-600 dark:text-red-400">{formatPKR(data.feeBreakdown.overdueAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Growth by Department (Top 3) */}
        <Card className="premium-card card-hover">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top Departments</p>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <div className="space-y-2">
              {topDepartments.map(([dept, count], i) => (
                <div key={dept} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#1e3a5f]/10 dark:bg-[#1e3a5f]/30 flex items-center justify-center text-[10px] font-bold text-[#1e3a5f] dark:text-blue-300">{i + 1}</span>
                    <span className="text-xs font-medium truncate max-w-[100px]">{dept}</span>
                  </div>
                  <span className="text-xs font-bold">{count}</span>
                </div>
              ))}
              {topDepartments.length === 0 && (
                <p className="text-xs text-muted-foreground text-center">No data</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========== 8. RECENT ACTIVITIES ========== */}
      <Card className="premium-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#1e3a5f]" />
            Recent Activities
          </CardTitle>
          <CardDescription className="text-xs">Latest actions across the hostel system</CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No recent activities</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {data.recentActivities.slice(0, 8).map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${activityTypeStyle(a.type)}`}>
                    {activityTypeIcon(a.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">{a.message}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{formatTimeAgo(a.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ===================== 2. ADMIN STUDENTS =====================
function AdminStudents({ searchQuery }: { searchQuery: string }) {
  const [students, setStudents] = useState<StudentType[]>([])
  const [loading, setLoading] = useState(true)
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewDialog, setViewDialog] = useState<StudentType | null>(null)
  const [editStudent, setEditStudent] = useState<StudentType | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', rollNo: '', department: '', semester: '1', guardianName: '', guardianPhone: '', address: '', bloodGroup: '', emergencyContact: '', roomId: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (deptFilter !== 'all') params.set('department', deptFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await apiFetch<{ students: StudentType[] }>(`/api/students?${params}`)
      setStudents(res.students)
    } catch { toast.error('Failed to load students') }
    setLoading(false)
  }, [deptFilter, statusFilter])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load().catch(() => {}) }, [load])

  const filtered = students.filter(s => {
    const q = searchQuery.toLowerCase()
    return !q || s.user?.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q) || s.department.toLowerCase().includes(q)
  })

  const handleSubmit = async () => {
    try {
      if (editStudent) {
        await apiFetch(`/api/students/${editStudent.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name: form.name, phone: form.phone, department: form.department, semester: parseInt(form.semester), guardianName: form.guardianName, guardianPhone: form.guardianPhone, address: form.address, bloodGroup: form.bloodGroup, emergencyContact: form.emergencyContact, roomId: form.roomId || null, status: editStudent.status }),
        })
        toast.success('Student updated')
      } else {
        await apiFetch('/api/students', {
          method: 'POST',
          body: JSON.stringify({ ...form, semester: parseInt(form.semester) }),
        })
        toast.success('Student added')
      }
      setDialogOpen(false); setEditStudent(null); resetForm(); load()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Operation failed') }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try { await apiFetch(`/api/students/${deleteId}`, { method: 'DELETE' }); toast.success('Student deleted'); load() }
    catch { toast.error('Failed to delete') }
    setDeleteId(null)
  }

  const resetForm = () => setForm({ name: '', email: '', password: '', phone: '', rollNo: '', department: '', semester: '1', guardianName: '', guardianPhone: '', address: '', bloodGroup: '', emergencyContact: '', roomId: '' })

  const openEdit = (s: StudentType) => {
    setEditStudent(s)
    setForm({ name: s.user?.name || '', email: s.user?.email || '', password: '', phone: s.user?.phone || '', rollNo: s.rollNo, department: s.department, semester: String(s.semester), guardianName: s.guardianName || '', guardianPhone: s.guardianPhone || '', address: s.address || '', bloodGroup: s.bloodGroup || '', emergencyContact: s.emergencyContact || '', roomId: s.roomId || '' })
    setDialogOpen(true)
  }

  if (loading) return <ListSkeleton />

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Graduated">Graduated</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="bg-[#1e3a5f] hover:bg-[#16304f]" onClick={() => { resetForm(); setEditStudent(null); setDialogOpen(true) }}>
          <Plus className="h-4 w-4 mr-1" /> Add Student
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead><TableHead>Roll No</TableHead><TableHead>Department</TableHead><TableHead>Semester</TableHead><TableHead>Room</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.user?.name || 'N/A'}</TableCell>
                    <TableCell>{s.rollNo}</TableCell>
                    <TableCell>{s.department}</TableCell>
                    <TableCell>{s.semester}</TableCell>
                    <TableCell>{s.room ? `${s.room.number} (${s.room.hostel?.name || ''})` : '—'}</TableCell>
                    <TableCell><Badge variant="outline" className={s.status === 'Active' ? 'bg-green-100 text-green-800' : s.status === 'Inactive' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}>{s.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewDialog(s)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(s.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No students found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.map(s => (
          <Card key={s.id} className="card-hover">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{s.user?.name || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">{s.rollNo} · {s.department}</p>
                  <p className="text-sm text-muted-foreground">Sem {s.semester} · {s.room ? s.room.number : 'No Room'}</p>
                </div>
                <Badge variant="outline" className={s.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}>{s.status}</Badge>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => setViewDialog(s)}><Eye className="h-3 w-3 mr-1" /> View</Button>
                <Button variant="outline" size="sm" onClick={() => openEdit(s)}><Edit className="h-3 w-3 mr-1" /> Edit</Button>
                <Button variant="outline" size="sm" onClick={() => setDeleteId(s.id)} className="text-red-600"><Trash2 className="h-3 w-3 mr-1" /> Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Roll No *</Label><Input value={form.rollNo} onChange={e => setForm(p => ({ ...p, rollNo: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} disabled={!!editStudent} /></div>
              <div><Label>{editStudent ? 'Password (blank=keep)' : 'Password *'}</Label><Input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Department *</Label>
                <Select value={form.department} onValueChange={v => setForm(p => ({ ...p, department: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Semester *</Label><Input type="number" min="1" max="8" value={form.semester} onChange={e => setForm(p => ({ ...p, semester: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <div><Label>Blood Group</Label><Input value={form.bloodGroup} onChange={e => setForm(p => ({ ...p, bloodGroup: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Guardian Name</Label><Input value={form.guardianName} onChange={e => setForm(p => ({ ...p, guardianName: e.target.value }))} /></div>
              <div><Label>Guardian Phone</Label><Input value={form.guardianPhone} onChange={e => setForm(p => ({ ...p, guardianPhone: e.target.value }))} /></div>
            </div>
            <div><Label>Address</Label><Textarea value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
            <div><Label>Emergency Contact</Label><Input value={form.emergencyContact} onChange={e => setForm(p => ({ ...p, emergencyContact: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#1e3a5f] hover:bg-[#16304f]" onClick={handleSubmit}>{editStudent ? 'Update' : 'Add'} Student</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewDialog} onOpenChange={() => setViewDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Student Details</DialogTitle></DialogHeader>
          {viewDialog && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12"><AvatarFallback className="bg-[#1e3a5f] text-white">{viewDialog.user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'S'}</AvatarFallback></Avatar>
                <div>
                  <p className="font-semibold">{viewDialog.user?.name}</p>
                  <p className="text-sm text-muted-foreground">{viewDialog.rollNo} · {viewDialog.department}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Email:</span> {viewDialog.user?.email}</div>
                <div><span className="text-muted-foreground">Phone:</span> {viewDialog.user?.phone || '—'}</div>
                <div><span className="text-muted-foreground">Semester:</span> {viewDialog.semester}</div>
                <div><span className="text-muted-foreground">Status:</span> <Badge variant="outline">{viewDialog.status}</Badge></div>
                <div><span className="text-muted-foreground">Room:</span> {viewDialog.room ? `${viewDialog.room.number} (${viewDialog.room.hostel?.name})` : 'Not assigned'}</div>
                <div><span className="text-muted-foreground">Blood Group:</span> {viewDialog.bloodGroup || '—'}</div>
                <div><span className="text-muted-foreground">Guardian:</span> {viewDialog.guardianName || '—'}</div>
                <div><span className="text-muted-foreground">Guardian Phone:</span> {viewDialog.guardianPhone || '—'}</div>
              </div>
              <div className="text-sm"><span className="text-muted-foreground">Address:</span> {viewDialog.address || '—'}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this student? This action cannot be undone.</AlertDialogDescription>
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

// ===================== 3. ADMIN ROOMS =====================
function AdminRooms({ searchQuery }: { searchQuery: string }) {
  const [rooms, setRooms] = useState<RoomType[]>([])
  const [hostels, setHostels] = useState<HostelType[]>([])
  const [loading, setLoading] = useState(true)
  const [hostelFilter, setHostelFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editRoom, setEditRoom] = useState<RoomType | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ number: '', floor: '0', capacity: '2', hostelId: '', status: 'Available' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (hostelFilter !== 'all') params.set('hostelId', hostelFilter)
      const [roomsRes, hostelsRes] = await Promise.all([
        apiFetch<{ rooms: RoomType[] }>(`/api/rooms?${params}`),
        apiFetch<{ hostels: HostelType[] }>('/api/hostels'),
      ])
      setRooms(roomsRes.rooms)
      setHostels(hostelsRes.hostels)
    } catch { toast.error('Failed to load rooms') }
    setLoading(false)
  }, [hostelFilter])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load().catch(() => {}) }, [load])

  const filtered = rooms.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    const q = searchQuery.toLowerCase()
    return !q || r.number.toLowerCase().includes(q) || r.hostel?.name.toLowerCase().includes(q)
  })

  const handleSubmit = async () => {
    try {
      const body = { number: form.number, floor: parseInt(form.floor), capacity: parseInt(form.capacity), hostelId: form.hostelId, status: form.status }
      if (editRoom) {
        await apiFetch(`/api/rooms/${editRoom.id}`, { method: 'PUT', body: JSON.stringify(body) })
        toast.success('Room updated')
      } else {
        await apiFetch('/api/rooms', { method: 'POST', body: JSON.stringify(body) })
        toast.success('Room added')
      }
      setDialogOpen(false); setEditRoom(null); resetForm(); load()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Operation failed') }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try { await apiFetch(`/api/rooms/${deleteId}`, { method: 'DELETE' }); toast.success('Room deleted'); load() }
    catch { toast.error('Failed to delete') }
    setDeleteId(null)
  }

  const resetForm = () => setForm({ number: '', floor: '0', capacity: '2', hostelId: '', status: 'Available' })

  const openEdit = (r: RoomType) => {
    setEditRoom(r)
    setForm({ number: r.number, floor: String(r.floor), capacity: String(r.capacity), hostelId: r.hostelId, status: r.status })
    setDialogOpen(true)
  }

  if (loading) return <ListSkeleton />

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Select value={hostelFilter} onValueChange={setHostelFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Hostel" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Hostels</SelectItem>
              {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="Occupied">Occupied</SelectItem>
              <SelectItem value="Maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="bg-[#1e3a5f] hover:bg-[#16304f]" onClick={() => { resetForm(); setEditRoom(null); setDialogOpen(true) }}>
          <Plus className="h-4 w-4 mr-1" /> Add Room
        </Button>
      </div>

      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Room No</TableHead><TableHead>Hostel</TableHead><TableHead>Floor</TableHead><TableHead>Capacity</TableHead><TableHead>Occupancy</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.number}</TableCell>
                    <TableCell>{r.hostel?.name || '—'}</TableCell>
                    <TableCell>Floor {r.floor}</TableCell>
                    <TableCell>{r.capacity}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: r.capacity }).map((_, i) => (
                          <span key={i} className={`w-2.5 h-2.5 rounded-full ${(r._count?.students || 0) > i ? 'bg-amber-500' : 'bg-gray-200'}`} />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">{r._count?.students || 0}/{r.capacity}</span>
                      </div>
                    </TableCell>
                    <TableCell><RoomStatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No rooms found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map(r => (
          <Card key={r.id} className="card-hover">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{r.number}</p>
                  <p className="text-sm text-muted-foreground">{r.hostel?.name} · Floor {r.floor}</p>
                </div>
                <RoomStatusBadge status={r.status} />
              </div>
              <div className="flex items-center gap-1 mt-2">
                {Array.from({ length: r.capacity }).map((_, i) => (
                  <span key={i} className={`w-2.5 h-2.5 rounded-full ${(r._count?.students || 0) > i ? 'bg-amber-500' : 'bg-gray-200'}`} />
                ))}
                <span className="text-xs text-muted-foreground ml-1">{r._count?.students || 0}/{r.capacity}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => openEdit(r)}><Edit className="h-3 w-3 mr-1" /> Edit</Button>
                <Button variant="outline" size="sm" onClick={() => setDeleteId(r.id)} className="text-red-600"><Trash2 className="h-3 w-3 mr-1" /> Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editRoom ? 'Edit Room' : 'Add New Room'}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Room Number *</Label><Input value={form.number} onChange={e => setForm(p => ({ ...p, number: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Floor *</Label><Input type="number" value={form.floor} onChange={e => setForm(p => ({ ...p, floor: e.target.value }))} /></div>
              <div><Label>Capacity *</Label><Input type="number" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} /></div>
            </div>
            <div><Label>Hostel *</Label>
              <Select value={form.hostelId} onValueChange={v => setForm(p => ({ ...p, hostelId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select Hostel" /></SelectTrigger>
                <SelectContent>{hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Occupied">Occupied</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#1e3a5f] hover:bg-[#16304f]" onClick={handleSubmit}>{editRoom ? 'Update' : 'Add'} Room</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Room</AlertDialogTitle><AlertDialogDescription>Are you sure? This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ===================== 4. ADMIN APPLICATIONS =====================
function AdminApplications({ searchQuery }: { searchQuery: string }) {
  const [applications, setApplications] = useState<ApplicationType[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [remarkDialog, setRemarkDialog] = useState<{ id: string; action: 'Approved' | 'Rejected' } | null>(null)
  const [remark, setRemark] = useState('')
  const [viewApp, setViewApp] = useState<ApplicationType | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await apiFetch<{ applications: ApplicationType[] }>(`/api/applications?${params}`)
      setApplications(res.applications)
    } catch { toast.error('Failed to load applications') }
    setLoading(false)
  }, [statusFilter])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load().catch(() => {}) }, [load])

  const filtered = applications.filter(a => {
    const q = searchQuery.toLowerCase()
    return !q || a.student?.name.toLowerCase().includes(q) || a.hostel?.name.toLowerCase().includes(q) || a.student?.rollNo.toLowerCase().includes(q)
  })

  const handleAction = async () => {
    if (!remarkDialog) return
    try {
      await apiFetch(`/api/applications/${remarkDialog.id}`, { method: 'PUT', body: JSON.stringify({ status: remarkDialog.action, adminRemark: remark }) })
      toast.success(`Application ${remarkDialog.action.toLowerCase()}`)
      load()
    } catch { toast.error('Failed to update application') }
    setRemarkDialog(null); setRemark('')
  }

  if (loading) return <ListSkeleton />

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex gap-2 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(a => (
          <Card key={a.id} className="card-hover">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-medium">{a.student?.name || 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground">{a.student?.rollNo} · {a.student?.department}</p>
                </div>
                <ApplicationStatusBadge status={a.status} />
              </div>
              <div className="space-y-1 text-sm mb-3">
                <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-muted-foreground" /> {a.hostel?.name || 'Unknown'}</div>
                {a.preferredRoom && <div className="flex items-center gap-2"><DoorOpen className="h-3.5 w-3.5 text-muted-foreground" /> Preferred: {a.preferredRoom}</div>}
                <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-muted-foreground" /> {new Date(a.createdAt).toLocaleDateString()}</div>
              </div>
              {a.message && <p className="text-sm text-muted-foreground bg-muted/50 rounded p-2 mb-3 line-clamp-2">{a.message}</p>}
              {a.adminRemark && <p className="text-sm bg-blue-50 dark:bg-blue-950/30 rounded p-2 mb-3"><span className="font-medium">Admin:</span> {a.adminRemark}</p>}
              {a.status === 'Pending' && (
                <div className="flex gap-2">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 flex-1" onClick={() => { setRemarkDialog({ id: a.id, action: 'Approved' }); setRemark('') }}>
                    <CheckCircle className="h-3 w-3 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" className="flex-1" onClick={() => { setRemarkDialog({ id: a.id, action: 'Rejected' }); setRemark('') }}>
                    <XCircle className="h-3 w-3 mr-1" /> Reject
                  </Button>
                </div>
              )}
              <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setViewApp(a)}><Eye className="h-3 w-3 mr-1" /> View Details</Button>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">No applications found</div>}
      </div>

      {/* Remark Dialog */}
      <Dialog open={!!remarkDialog} onOpenChange={() => setRemarkDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{remarkDialog?.action === 'Approved' ? 'Approve' : 'Reject'} Application</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Admin Remark</Label><Textarea value={remark} onChange={e => setRemark(e.target.value)} placeholder="Add a remark..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemarkDialog(null)}>Cancel</Button>
            <Button className={remarkDialog?.action === 'Approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} onClick={handleAction}>
              {remarkDialog?.action === 'Approved' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewApp} onOpenChange={() => setViewApp(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Application Details</DialogTitle></DialogHeader>
          {viewApp && (
            <div className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">Student:</span> {viewApp.student?.name}</div>
              <div><span className="text-muted-foreground">Roll No:</span> {viewApp.student?.rollNo}</div>
              <div><span className="text-muted-foreground">Department:</span> {viewApp.student?.department}</div>
              <div><span className="text-muted-foreground">Hostel:</span> {viewApp.hostel?.name}</div>
              <div><span className="text-muted-foreground">Preferred Room:</span> {viewApp.preferredRoom || '—'}</div>
              <div><span className="text-muted-foreground">Status:</span> <ApplicationStatusBadge status={viewApp.status} /></div>
              <div><span className="text-muted-foreground">Date:</span> {new Date(viewApp.createdAt).toLocaleDateString()}</div>
              {viewApp.message && <div><span className="text-muted-foreground">Message:</span><p className="mt-1 bg-muted/50 p-2 rounded">{viewApp.message}</p></div>}
              {viewApp.adminRemark && <div><span className="text-muted-foreground">Admin Remark:</span><p className="mt-1 bg-blue-50 dark:bg-blue-950/30 p-2 rounded">{viewApp.adminRemark}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}


// ===================== 6. ADMIN COMPLAINTS =====================
function AdminComplaints({ searchQuery }: { searchQuery: string }) {
  const [complaints, setComplaints] = useState<ComplaintType[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [viewComplaint, setViewComplaint] = useState<ComplaintType | null>(null)
  const [replyDialog, setReplyDialog] = useState<ComplaintType | null>(null)
  const [reply, setReply] = useState('')
  const [newStatus, setNewStatus] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      const res = await apiFetch<{ complaints: ComplaintType[] }>(`/api/complaints?${params}`)
      setComplaints(res.complaints)
    } catch { toast.error('Failed to load complaints') }
    setLoading(false)
  }, [statusFilter, categoryFilter])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load().catch(() => {}) }, [load])

  const filtered = complaints.filter(c => {
    if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false
    const q = searchQuery.toLowerCase()
    return !q || c.title.toLowerCase().includes(q) || c.student?.name.toLowerCase().includes(q)
  })

  const handleReply = async () => {
    if (!replyDialog) return
    try {
      await apiFetch(`/api/complaints/${replyDialog.id}`, { method: 'PUT', body: JSON.stringify({ adminReply: reply, status: newStatus || replyDialog.status }) })
      toast.success('Reply submitted'); load()
    } catch { toast.error('Failed to submit reply') }
    setReplyDialog(null); setReply(''); setNewStatus('')
  }

  const openReply = (c: ComplaintType) => {
    setReplyDialog(c); setReply(c.adminReply || ''); setNewStatus(c.status)
  }

  if (loading) return <ListSkeleton />

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex gap-2 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {COMPLAINT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => (
          <Card key={c.id} className="card-hover">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{c.title}</p>
                  <p className="text-sm text-muted-foreground">{c.student?.name} · {c.student?.rollNo}</p>
                </div>
                <PriorityBadge priority={c.priority} />
              </div>
              <div className="flex gap-2 mb-3">
                <ComplaintStatusBadge status={c.status} />
                <CategoryBadge category={c.category} />
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{c.description}</p>
              {c.adminReply && <p className="text-sm bg-blue-50 dark:bg-blue-950/30 rounded p-2 mb-2"><span className="font-medium">Admin:</span> {c.adminReply}</p>}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setViewComplaint(c)}><Eye className="h-3 w-3 mr-1" /> View</Button>
                <Button variant="outline" size="sm" onClick={() => openReply(c)}><MessageSquare className="h-3 w-3 mr-1" /> Reply</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">No complaints found</div>}
      </div>

      {/* View Dialog */}
      <Dialog open={!!viewComplaint} onOpenChange={() => setViewComplaint(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Complaint Details</DialogTitle></DialogHeader>
          {viewComplaint && (
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-lg">{viewComplaint.title}</h3>
                <div className="flex gap-2 mt-1">
                  <ComplaintStatusBadge status={viewComplaint.status} />
                  <PriorityBadge priority={viewComplaint.priority} />
                  <CategoryBadge category={viewComplaint.category} />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Student:</span> {viewComplaint.student?.name}</div>
                <div><span className="text-muted-foreground">Roll No:</span> {viewComplaint.student?.rollNo}</div>
                <div><span className="text-muted-foreground">Department:</span> {viewComplaint.student?.department}</div>
                <div><span className="text-muted-foreground">Date:</span> {new Date(viewComplaint.createdAt).toLocaleDateString()}</div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Description:</span>
                <p className="mt-1 text-sm bg-muted/50 p-3 rounded-lg">{viewComplaint.description}</p>
              </div>
              {viewComplaint.adminReply && (
                <div>
                  <span className="text-sm text-muted-foreground">Admin Reply:</span>
                  <p className="mt-1 text-sm bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">{viewComplaint.adminReply}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={!!replyDialog} onOpenChange={() => setReplyDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Reply to Complaint</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Admin Reply</Label><Textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Type your reply..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialog(null)}>Cancel</Button>
            <Button className="bg-[#1e3a5f] hover:bg-[#16304f]" onClick={handleReply}>Submit Reply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ===================== 7. ADMIN MAINTENANCE =====================
function AdminMaintenance({ searchQuery }: { searchQuery: string }) {
  const [requests, setRequests] = useState<MaintenanceType[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [statusDialog, setStatusDialog] = useState<MaintenanceType | null>(null)
  const [newStatus, setNewStatus] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await apiFetch<{ maintenanceRequests: MaintenanceType[] }>(`/api/maintenance?${params}`)
      setRequests(res.maintenanceRequests)
    } catch { toast.error('Failed to load maintenance requests') }
    setLoading(false)
  }, [statusFilter])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load().catch(() => {}) }, [load])

  const filtered = requests.filter(r => {
    const q = searchQuery.toLowerCase()
    return !q || r.title.toLowerCase().includes(q) || r.room?.number.toLowerCase().includes(q)
  })

  const handleStatusUpdate = async () => {
    if (!statusDialog) return
    try {
      await apiFetch(`/api/maintenance/${statusDialog.id}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) })
      toast.success('Status updated'); load()
    } catch { toast.error('Failed to update status') }
    setStatusDialog(null)
  }

  if (loading) return <ListSkeleton />

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex gap-2 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(r => (
          <Card key={r.id} className="card-hover">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <p className="font-medium">{r.title}</p>
                <PriorityBadge priority={r.priority} />
              </div>
              <div className="flex gap-2 mb-2">
                <Badge variant="outline" className={
                  r.status === 'Completed' ? 'bg-green-100 text-green-800 border-green-200' :
                  r.status === 'In Progress' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                  'bg-blue-100 text-blue-800 border-blue-200'
                }>{r.status}</Badge>
                <CategoryBadge category={r.category} />
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{r.description}</p>
              <div className="text-sm text-muted-foreground space-y-1 mb-3">
                <div className="flex items-center gap-2"><DoorOpen className="h-3.5 w-3.5" /> {r.room?.number} — {r.room?.hostel?.name}</div>
                {r.student && <div className="flex items-center gap-2"><User className="h-3.5 w-3.5" /> {r.student.name} ({r.student.rollNo})</div>}
                <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> {new Date(r.createdAt).toLocaleDateString()}</div>
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={() => { setStatusDialog(r); setNewStatus(r.status) }}>
                Update Status
              </Button>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">No maintenance requests found</div>}
      </div>

      <Dialog open={!!statusDialog} onOpenChange={() => setStatusDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Update Status</DialogTitle></DialogHeader>
          <div>
            <Label>New Status</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialog(null)}>Cancel</Button>
            <Button className="bg-[#1e3a5f] hover:bg-[#16304f]" onClick={handleStatusUpdate}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ===================== 8. ADMIN STAFF =====================
function AdminStaff({ searchQuery }: { searchQuery: string }) {
  const [staff, setStaff] = useState<StaffType[]>([])
  const [hostels, setHostels] = useState<HostelType[]>([])
  const [loading, setLoading] = useState(true)
  const [hostelFilter, setHostelFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editStaff, setEditStaff] = useState<StaffType | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', role: 'Warden', phone: '', hostelId: '', salary: '', joinDate: '', status: 'Active' })

  const ROLES = ['Warden', 'Clerk', 'Security', 'Cleaner', 'Electrician', 'Plumber']

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (hostelFilter !== 'all') params.set('hostelId', hostelFilter)
      if (roleFilter !== 'all') params.set('role', roleFilter)
      const [staffRes, hostelsRes] = await Promise.all([
        apiFetch<{ staff: StaffType[] }>(`/api/staff?${params}`),
        apiFetch<{ hostels: HostelType[] }>('/api/hostels'),
      ])
      setStaff(staffRes.staff)
      setHostels(hostelsRes.hostels)
    } catch { toast.error('Failed to load staff') }
    setLoading(false)
  }, [hostelFilter, roleFilter])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load().catch(() => {}) }, [load])

  const filtered = staff.filter(s => {
    const q = searchQuery.toLowerCase()
    return !q || s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q)
  })

  const handleSubmit = async () => {
    try {
      const body = { name: form.name, role: form.role, phone: form.phone, hostelId: form.hostelId, salary: form.salary ? parseFloat(form.salary) : null, joinDate: form.joinDate || null, status: form.status }
      if (editStaff) {
        await apiFetch(`/api/staff/${editStaff.id}`, { method: 'PUT', body: JSON.stringify(body) })
        toast.success('Staff updated')
      } else {
        await apiFetch('/api/staff', { method: 'POST', body: JSON.stringify(body) })
        toast.success('Staff added')
      }
      setDialogOpen(false); setEditStaff(null); resetForm(); load()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Operation failed') }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try { await apiFetch(`/api/staff/${deleteId}`, { method: 'DELETE' }); toast.success('Staff deleted'); load() }
    catch { toast.error('Failed to delete') }
    setDeleteId(null)
  }

  const resetForm = () => setForm({ name: '', role: 'Warden', phone: '', hostelId: '', salary: '', joinDate: '', status: 'Active' })

  const openEdit = (s: StaffType) => {
    setEditStaff(s)
    setForm({ name: s.name, role: s.role, phone: s.phone, hostelId: s.hostelId, salary: s.salary ? String(s.salary) : '', joinDate: s.joinDate ? new Date(s.joinDate).toISOString().split('T')[0] : '', status: s.status })
    setDialogOpen(true)
  }

  if (loading) return <ListSkeleton />

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Select value={hostelFilter} onValueChange={setHostelFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Hostel" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Hostels</SelectItem>
              {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button className="bg-[#1e3a5f] hover:bg-[#16304f]" onClick={() => { resetForm(); setEditStaff(null); setDialogOpen(true) }}>
          <Plus className="h-4 w-4 mr-1" /> Add Staff
        </Button>
      </div>

      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Phone</TableHead><TableHead>Hostel</TableHead><TableHead>Salary</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell><StaffRoleBadge role={s.role} /></TableCell>
                    <TableCell>{s.phone}</TableCell>
                    <TableCell>{s.hostel?.name || '—'}</TableCell>
                    <TableCell>{s.salary ? formatPKR(s.salary) : '—'}</TableCell>
                    <TableCell><Badge variant="outline" className={s.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}>{s.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(s.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No staff found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="md:hidden space-y-3">
        {filtered.map(s => (
          <Card key={s.id} className="card-hover">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <StaffRoleBadge role={s.role} />
                </div>
                <Badge variant="outline" className={s.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}>{s.status}</Badge>
              </div>
              <div className="text-sm text-muted-foreground mt-2 space-y-1">
                <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {s.phone}</div>
                <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5" /> {s.hostel?.name || '—'}</div>
                {s.salary && <div className="flex items-center gap-2"><DollarSign className="h-3.5 w-3.5" /> {formatPKR(s.salary)}</div>}
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => openEdit(s)}><Edit className="h-3 w-3 mr-1" /> Edit</Button>
                <Button variant="outline" size="sm" onClick={() => setDeleteId(s.id)} className="text-red-600"><Trash2 className="h-3 w-3 mr-1" /> Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editStaff ? 'Edit Staff' : 'Add New Staff'}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Role *</Label>
                <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Phone *</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
            <div><Label>Hostel *</Label>
              <Select value={form.hostelId} onValueChange={v => setForm(p => ({ ...p, hostelId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select Hostel" /></SelectTrigger>
                <SelectContent>{hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Salary (Rs.)</Label><Input type="number" value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))} /></div>
              <div><Label>Join Date</Label><Input type="date" value={form.joinDate} onChange={e => setForm(p => ({ ...p, joinDate: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#1e3a5f] hover:bg-[#16304f]" onClick={handleSubmit}>{editStaff ? 'Update' : 'Add'} Staff</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Staff</AlertDialogTitle><AlertDialogDescription>Are you sure? This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ===================== 9. ADMIN NOTICES =====================
function AdminNotices({ searchQuery }: { searchQuery: string }) {
  const [notices, setNotices] = useState<NoticeType[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editNotice, setEditNotice] = useState<NoticeType | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', content: '', category: 'General', priority: 'Normal' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch<{ notices: NoticeType[] }>('/api/notices')
      setNotices(res.notices)
    } catch { toast.error('Failed to load notices') }
    setLoading(false)
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load().catch(() => {}) }, [load])

  const filtered = notices.filter(n => {
    const q = searchQuery.toLowerCase()
    return !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
  })

  const handleSubmit = async () => {
    try {
      if (editNotice) {
        await apiFetch(`/api/notices/${editNotice.id}`, { method: 'PUT', body: JSON.stringify({ ...form, createdBy: 'Admin' }) })
        toast.success('Notice updated')
      } else {
        await apiFetch('/api/notices', { method: 'POST', body: JSON.stringify({ ...form, createdBy: 'Admin' }) })
        toast.success('Notice added')
      }
      setDialogOpen(false); setEditNotice(null); resetForm(); load()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Operation failed') }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try { await apiFetch(`/api/notices/${deleteId}`, { method: 'DELETE' }); toast.success('Notice deleted'); load() }
    catch { toast.error('Failed to delete') }
    setDeleteId(null)
  }

  const resetForm = () => setForm({ title: '', content: '', category: 'General', priority: 'Normal' })

  const openEdit = (n: NoticeType) => {
    setEditNotice(n)
    setForm({ title: n.title, content: n.content, category: n.category, priority: n.priority })
    setDialogOpen(true)
  }

  if (loading) return <ListSkeleton />

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-end">
        <Button className="bg-[#1e3a5f] hover:bg-[#16304f]" onClick={() => { resetForm(); setEditNotice(null); setDialogOpen(true) }}>
          <Plus className="h-4 w-4 mr-1" /> Add Notice
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(n => (
          <Card key={n.id} className={`card-hover ${n.priority === 'Urgent' ? 'border-red-200 dark:border-red-900' : ''}`}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{n.title}</p>
                  <div className="flex gap-2 mt-1">
                    <CategoryBadge category={n.category} />
                    <NoticePriorityBadge priority={n.priority} />
                  </div>
                </div>
                {n.priority === 'Urgent' && <span className="animate-subtle-pulse text-red-500 text-xs font-bold">URGENT</span>}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3 my-2">{n.content}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                <span>{n.createdBy || 'Admin'}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => openEdit(n)}><Edit className="h-3 w-3 mr-1" /> Edit</Button>
                <Button variant="outline" size="sm" onClick={() => setDeleteId(n.id)} className="text-red-600"><Trash2 className="h-3 w-3 mr-1" /> Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">No notices found</div>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editNotice ? 'Edit Notice' : 'Add New Notice'}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
            <div><Label>Content *</Label><Textarea rows={5} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category *</Label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{NOTICE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
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
            <Button className="bg-[#1e3a5f] hover:bg-[#16304f]" onClick={handleSubmit}>{editNotice ? 'Update' : 'Add'} Notice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Notice</AlertDialogTitle><AlertDialogDescription>Are you sure? This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ===================== 10. ADMIN REPORTS =====================
function AdminReports({ searchQuery: _sq }: { searchQuery: string }) {
  const [fees, setFees] = useState<FeeType[]>([])
  const [hostels, setHostels] = useState<(HostelType & { totalCapacity?: number; totalOccupancy?: number; occupancyRate?: number; rooms?: RoomType[] })[]>([])
  const [complaints, setComplaints] = useState<ComplaintType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const [feesRes, hostelsRes, complaintsRes] = await Promise.all([
          apiFetch<{ fees: FeeType[] }>('/api/fees'),
          apiFetch<{ hostels: (HostelType & { totalCapacity?: number; totalOccupancy?: number; occupancyRate?: number; rooms?: RoomType[] })[] }>('/api/hostels'),
          apiFetch<{ complaints: ComplaintType[] }>('/api/complaints'),
        ])
        setFees(feesRes.fees)
        setHostels(hostelsRes.hostels)
        setComplaints(complaintsRes.complaints)
      } catch { toast.error('Failed to load reports') }
      setLoading(false)
    })()
  }, [])

  if (loading) return <DashboardSkeleton />

  // Fee collection by month
  const monthlyFees: Record<string, { paid: number; pending: number; overdue: number }> = {}
  MONTHS.forEach(m => { monthlyFees[m] = { paid: 0, pending: 0, overdue: 0 } })
  fees.forEach(f => {
    const m = f.month
    if (monthlyFees[m]) {
      if (f.status === 'Paid') monthlyFees[m].paid += f.amount
      else if (f.status === 'Pending') monthlyFees[m].pending += f.amount
      else if (f.status === 'Overdue') monthlyFees[m].overdue += f.amount
    }
  })
  const maxFeeAmount = Math.max(...Object.values(monthlyFees).map(v => v.paid + v.pending + v.overdue), 1)

  // Complaint stats
  const complaintByStatus: Record<string, number> = {}
  const complaintByCategory: Record<string, number> = {}
  complaints.forEach(c => {
    complaintByStatus[c.status] = (complaintByStatus[c.status] || 0) + 1
    complaintByCategory[c.category] = (complaintByCategory[c.category] || 0) + 1
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Fee Collection by Month */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-[#1e3a5f]" /> Fee Collection by Month</CardTitle>
          <CardDescription>Monthly breakdown of fee collection status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-48 overflow-x-auto pb-2">
            {MONTHS.map(m => {
              const data = monthlyFees[m]
              const total = data.paid + data.pending + data.overdue
              const paidH = maxFeeAmount > 0 ? (data.paid / maxFeeAmount) * 160 : 0
              const pendingH = maxFeeAmount > 0 ? (data.pending / maxFeeAmount) * 160 : 0
              const overdueH = maxFeeAmount > 0 ? (data.overdue / maxFeeAmount) * 160 : 0
              return (
                <div key={m} className="flex flex-col items-center gap-1 min-w-[40px] flex-1">
                  <div className="flex flex-col items-center gap-0 w-full" style={{ height: 160 }}>
                    {overdueH > 0 && <div className="w-full bg-red-400 rounded-t" style={{ height: overdueH }} />}
                    {pendingH > 0 && <div className="w-full bg-amber-400" style={{ height: pendingH }} />}
                    {paidH > 0 && <div className="w-full bg-green-400 rounded-b" style={{ height: paidH }} />}
                    {total === 0 && <div className="w-full bg-gray-200 rounded" style={{ height: 4 }} />}
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate w-full text-center">{m.slice(0, 3)}</span>
                </div>
              )
            })}
          </div>
          <div className="flex gap-4 mt-4 justify-center">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-400" /> <span className="text-xs">Paid</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400" /> <span className="text-xs">Pending</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-400" /> <span className="text-xs">Overdue</span></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Occupancy by Hostel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-[#1e3a5f]" /> Room Occupancy by Hostel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hostels.map(h => (
              <div key={h.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{h.name}</span>
                  <span className="text-muted-foreground">{h.totalOccupancy || 0}/{h.totalCapacity || 0} ({h.occupancyRate || 0}%)</span>
                </div>
                <div className="flex gap-1 h-6 items-center">
                  <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                    <div className="bg-[#1e3a5f] h-full rounded-full transition-all" style={{ width: `${h.occupancyRate || 0}%` }} />
                  </div>
                </div>
              </div>
            ))}
            {hostels.length === 0 && <p className="text-sm text-muted-foreground">No hostel data available</p>}
          </CardContent>
        </Card>

        {/* Complaint Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-[#1e3a5f]" /> Complaint Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">By Status</p>
              <div className="space-y-2">
                {Object.entries(complaintByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-3">
                    <ComplaintStatusBadge status={status} />
                    <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                      <div className={`h-full rounded-full ${status === 'Open' ? 'bg-blue-500' : status === 'In Progress' ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${complaints.length > 0 ? (count / complaints.length) * 100 : 0}%` }} />
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">By Category</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(complaintByCategory).map(([cat, count]) => (
                  <div key={cat} className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-3 py-1.5">
                    <CategoryBadge category={cat} />
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
            <div className="text-center">
              <p className="text-3xl font-bold text-[#1e3a5f]">{complaints.length}</p>
              <p className="text-sm text-muted-foreground">Total Complaints</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ===================== ADMIN MOVEMENT MONITORING =====================
function AdminMovements({ searchQuery, user }: { searchQuery: string; user: UserType }) {
  const [movements, setMovements] = useState<MovementType[]>([])
  const [stats, setStats] = useState<MovementStats>({ currentlyOutside: 0, returnedToday: 0, pendingApprovals: 0, lateReturns: 0, totalRecords: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewDialog, setViewDialog] = useState<MovementType | null>(null)
  const [approveDialog, setApproveDialog] = useState<MovementType | null>(null)
  const [rejectDialog, setRejectDialog] = useState<MovementType | null>(null)
  const [markOutDialog, setMarkOutDialog] = useState<MovementType | null>(null)
  const [markReturnedDialog, setMarkReturnedDialog] = useState<MovementType | null>(null)
  const [adminRemark, setAdminRemark] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await apiFetch<{ movements: MovementType[]; stats: MovementStats }>(`/api/movements?${params}`)
      setMovements(res.movements)
      setStats(res.stats)
    } catch { toast.error('Failed to load movement records') }
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const filtered = movements.filter(m => {
    const q = searchQuery.toLowerCase()
    return !q || m.student?.name?.toLowerCase().includes(q) || m.student?.rollNo?.toLowerCase().includes(q) || m.student?.room?.number?.includes(q)
  })

  const handleApprove = async () => {
    if (!approveDialog) return
    try {
      await apiFetch(`/api/movements/${approveDialog.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Approved', approvedBy: user.name, adminRemark: adminRemark || undefined }),
      })
      toast.success('Leave request approved')
      setApproveDialog(null); setAdminRemark(''); load()
    } catch { toast.error('Failed to approve') }
  }

  const handleReject = async () => {
    if (!rejectDialog) return
    try {
      await apiFetch(`/api/movements/${rejectDialog.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Rejected', adminRemark: adminRemark || undefined }),
      })
      toast.success('Leave request rejected')
      setRejectDialog(null); setAdminRemark(''); load()
    } catch { toast.error('Failed to reject') }
  }

  const handleMarkOut = async () => {
    if (!markOutDialog) return
    try {
      await apiFetch(`/api/movements/${markOutDialog.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Out', approvedBy: user.name }),
      })
      toast.success('Student marked as departed (Out)')
      setMarkOutDialog(null); load()
    } catch { toast.error('Failed to mark as out') }
  }

  const handleMarkReturned = async () => {
    if (!markReturnedDialog) return
    try {
      await apiFetch(`/api/movements/${markReturnedDialog.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Returned', actualReturnDate: new Date().toISOString() }),
      })
      toast.success('Student marked as returned')
      setMarkReturnedDialog(null); load()
    } catch { toast.error('Failed to mark as returned') }
  }

  if (loading) return <ListSkeleton />

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Out">Out of Hostel</SelectItem>
              <SelectItem value="Returned">Returned</SelectItem>
              <SelectItem value="Late Return">Late Return</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 stagger-children">
        <StatCard title="Outside Hostel" value={stats.currentlyOutside} icon={<ArrowRightLeft className="h-5 w-5" />} color="text-orange-600" bg="bg-orange-50 dark:bg-orange-900/20" />
        <StatCard title="Returned Today" value={stats.returnedToday} icon={<CheckCircle className="h-5 w-5" />} color="text-green-600" bg="bg-green-50 dark:bg-green-900/20" />
        <StatCard title="Pending Approvals" value={stats.pendingApprovals} icon={<Clock className="h-5 w-5" />} color="text-amber-600" bg="bg-amber-50 dark:bg-amber-900/20" />
        <StatCard title="Late Returns" value={stats.lateReturns} icon={<AlertTriangle className="h-5 w-5" />} color="text-red-600" bg="bg-red-50 dark:bg-red-900/20" />
        <StatCard title="Total Records" value={stats.totalRecords} icon={<Activity className="h-5 w-5" />} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-900/20" />
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card><CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Departure</TableHead>
                <TableHead>Expected Return</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No movement records found</TableCell></TableRow>
              ) : filtered.map(m => (
                <TableRow key={m.id} className={m.status === 'Late Return' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}>
                  <TableCell>
                    <div><p className="font-medium">{m.student?.name || '-'}</p><p className="text-xs text-muted-foreground">{m.student?.rollNo} · {m.student?.department}</p></div>
                  </TableCell>
                  <TableCell>{m.student?.room ? `${m.student.room.number} (${m.student.room.hostel})` : '-'}</TableCell>
                  <TableCell><LeaveReasonBadge reason={m.reason} /></TableCell>
                  <TableCell className="text-sm">{new Date(m.departureDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-sm">{new Date(m.expectedReturnDate).toLocaleDateString()}</TableCell>
                  <TableCell><MovementStatusBadge status={m.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setViewDialog(m)}><Eye className="h-4 w-4" /></Button>
                      {m.status === 'Pending' && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => { setApproveDialog(m); setAdminRemark('') }} className="text-green-600"><CheckCircle className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => { setRejectDialog(m); setAdminRemark('') }} className="text-red-600"><XCircle className="h-4 w-4" /></Button>
                        </>
                      )}
                      {m.status === 'Approved' && (
                        <Button variant="ghost" size="icon" onClick={() => setMarkOutDialog(m)} className="text-orange-600" title="Mark as Out"><ArrowUpRight className="h-4 w-4" /></Button>
                      )}
                      {(m.status === 'Out' || m.status === 'Late Return') && (
                        <Button variant="ghost" size="icon" onClick={() => setMarkReturnedDialog(m)} className="text-green-600" title="Mark as Returned"><FileCheck className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.map(m => (
          <Card key={m.id} className={`card-hover ${m.status === 'Late Return' ? 'border-red-300' : ''}`}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium">{m.student?.name || '-'}</p>
                  <p className="text-sm text-muted-foreground">{m.student?.rollNo} · {m.student?.room?.number || 'No Room'}</p>
                </div>
                <MovementStatusBadge status={m.status} />
              </div>
              <div className="flex items-center gap-2 mb-2"><LeaveReasonBadge reason={m.reason} /></div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Dep: {new Date(m.departureDate).toLocaleString()}</p>
                <p>Return: {new Date(m.expectedReturnDate).toLocaleString()}</p>
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => setViewDialog(m)}><Eye className="h-3 w-3 mr-1" /> View</Button>
                {m.status === 'Pending' && (
                  <>
                    <Button size="sm" onClick={() => { setApproveDialog(m); setAdminRemark('') }} className="bg-green-600 hover:bg-green-700 text-xs">Approve</Button>
                    <Button variant="outline" size="sm" onClick={() => { setRejectDialog(m); setAdminRemark('') }} className="text-red-600 text-xs">Reject</Button>
                  </>
                )}
                {m.status === 'Approved' && (
                  <Button size="sm" onClick={() => setMarkOutDialog(m)} className="bg-orange-600 hover:bg-orange-700 text-xs">Mark Out</Button>
                )}
                {(m.status === 'Out' || m.status === 'Late Return') && (
                  <Button size="sm" onClick={() => setMarkReturnedDialog(m)} className="bg-green-600 hover:bg-green-700 text-xs">Mark Returned</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Dialog */}
      <Dialog open={!!viewDialog} onOpenChange={() => setViewDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Movement Record Details</DialogTitle></DialogHeader>
          {viewDialog && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10"><AvatarFallback className="bg-[#1e3a5f] text-white">{viewDialog.student?.name?.charAt(0) || 'S'}</AvatarFallback></Avatar>
                <div>
                  <p className="font-semibold">{viewDialog.student?.name}</p>
                  <p className="text-sm text-muted-foreground">{viewDialog.student?.rollNo} · {viewDialog.student?.department}</p>
                  <p className="text-xs text-muted-foreground">Room: {viewDialog.student?.room ? `${viewDialog.student.room.number} (${viewDialog.student.room.hostel})` : 'Not assigned'}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-2"><LeaveReasonBadge reason={viewDialog.reason} /><MovementStatusBadge status={viewDialog.status} /></div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Departure:</span><p className="font-medium">{new Date(viewDialog.departureDate).toLocaleString()}</p></div>
                <div><span className="text-muted-foreground">Expected Return:</span><p className="font-medium">{new Date(viewDialog.expectedReturnDate).toLocaleString()}</p></div>
                {viewDialog.actualReturnDate && <div><span className="text-muted-foreground">Actual Return:</span><p className="font-medium text-green-600">{new Date(viewDialog.actualReturnDate).toLocaleString()}</p></div>}
                {viewDialog.destination && <div><span className="text-muted-foreground">Destination:</span><p className="font-medium">{viewDialog.destination}</p></div>}
                {viewDialog.guardianContact && <div><span className="text-muted-foreground">Guardian Contact:</span><p className="font-medium">{viewDialog.guardianContact}</p></div>}
              </div>
              {viewDialog.notes && <div className="bg-muted p-3 rounded-lg"><p className="text-xs font-medium text-muted-foreground mb-1">Notes:</p><p className="text-sm">{viewDialog.notes}</p></div>}
              {viewDialog.adminRemark && <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg"><p className="text-xs font-medium text-muted-foreground mb-1">Admin Remark:</p><p className="text-sm">{viewDialog.adminRemark}</p></div>}
              {viewDialog.departureSignature && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Departure Signature:</p>
                  <img src={viewDialog.departureSignature} alt="Departure signature" className="h-16 rounded border bg-white" />
                </div>
              )}
              {viewDialog.returnSignature && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Return Signature:</p>
                  <img src={viewDialog.returnSignature} alt="Return signature" className="h-16 rounded border bg-white" />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={!!approveDialog} onOpenChange={() => setApproveDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Approve Leave Request</DialogTitle></DialogHeader>
          {approveDialog && (
            <div className="space-y-3">
              <p>Approve leave request for <strong>{approveDialog.student?.name}</strong> ({approveDialog.reason})?</p>
              <div><Label>Admin Remark (optional)</Label><Textarea value={adminRemark} onChange={e => setAdminRemark(e.target.value)} placeholder="Add any remarks..." rows={2} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog(null)}>Cancel</Button>
            <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Leave Request</DialogTitle></DialogHeader>
          {rejectDialog && (
            <div className="space-y-3">
              <p>Reject leave request for <strong>{rejectDialog.student?.name}</strong> ({rejectDialog.reason})?</p>
              <div><Label>Rejection Reason (optional)</Label><Textarea value={adminRemark} onChange={e => setAdminRemark(e.target.value)} placeholder="Reason for rejection..." rows={2} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>Cancel</Button>
            <Button onClick={handleReject} className="bg-red-600 hover:bg-red-700">Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Out Dialog */}
      <Dialog open={!!markOutDialog} onOpenChange={() => setMarkOutDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mark as Departed (Out)</DialogTitle></DialogHeader>
          {markOutDialog && (
            <div className="space-y-3">
              <p>Mark <strong>{markOutDialog.student?.name}</strong> as departed? This confirms the student has left the hostel.</p>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                <p className="text-sm"><span className="text-muted-foreground">Reason:</span> {markOutDialog.reason}</p>
                <p className="text-sm"><span className="text-muted-foreground">Expected Return:</span> {new Date(markOutDialog.expectedReturnDate).toLocaleString()}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkOutDialog(null)}>Cancel</Button>
            <Button onClick={handleMarkOut} className="bg-orange-600 hover:bg-orange-700">Confirm Departure</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Returned Dialog */}
      <Dialog open={!!markReturnedDialog} onOpenChange={() => setMarkReturnedDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mark as Returned</DialogTitle></DialogHeader>
          {markReturnedDialog && (
            <div className="space-y-3">
              <p>Mark <strong>{markReturnedDialog.student?.name}</strong> as returned to the hostel? This is an admin override.</p>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <p className="text-sm"><span className="text-muted-foreground">Reason:</span> {markReturnedDialog.reason}</p>
                <p className="text-sm"><span className="text-muted-foreground">Departure:</span> {new Date(markReturnedDialog.departureDate).toLocaleString()}</p>
                <p className="text-sm"><span className="text-muted-foreground">Expected Return:</span> {new Date(markReturnedDialog.expectedReturnDate).toLocaleString()}</p>
              </div>
              {markReturnedDialog.status === 'Late Return' && (
                <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded border border-red-200">
                  <p className="text-xs text-red-700 dark:text-red-400 font-medium">This student has exceeded the expected return time.</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkReturnedDialog(null)}>Cancel</Button>
            <Button onClick={handleMarkReturned} className="bg-green-600 hover:bg-green-700">Confirm Return</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ===================== AI & AUTOMATION PAGE =====================
function AIAutomationPage({ user }: { user: UserType }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'search' | 'fees' | 'rooms' | 'reports'>('overview')
  const [dashStats, setDashStats] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch<Record<string, unknown>>('/api/automation?action=dashboard-stats')
      setDashStats(res)
    } catch { toast.error('Failed to load automation stats') }
    setLoading(false)
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  const tabs = [
    { key: 'overview' as const, label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { key: 'search' as const, label: 'Smart Search', icon: <SearchIcon className="h-4 w-4" /> },
    { key: 'fees' as const, label: 'Auto Fee System', icon: <Wallet className="h-4 w-4" /> },
    { key: 'rooms' as const, label: 'Room Suggest', icon: <BedDouble className="h-4 w-4" /> },
    { key: 'reports' as const, label: 'Smart Reports', icon: <FileBarChart className="h-4 w-4" /> },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#1e3a5f] via-[#2a5a8f] to-[#1e3a5f] p-5 sm:p-7 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 left-10 w-32 h-32 bg-green-400 rounded-full blur-3xl" />
          <div className="absolute bottom-2 right-10 w-24 h-24 bg-blue-400 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
              <Brain className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">AI & Automation Center</h2>
              <p className="text-blue-200/80 text-xs sm:text-sm">Smart tools for automated hostel management</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-0.5 bg-green-500/20 border border-green-400/30 rounded-full text-[10px] font-medium text-green-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Active
            </span>
            <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-400/30 rounded-full text-[10px] font-medium text-blue-300">Lightweight AI</span>
            <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-400/30 rounded-full text-[10px] font-medium text-purple-300">Real-time</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-[#1e3a5f] text-white shadow-md'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <AutomationOverview stats={dashStats} loading={loading} onRefresh={loadStats} />}
      {activeTab === 'search' && <SmartSearchSection />}
      {activeTab === 'fees' && <AutoFeeSystem user={user} />}
      {activeTab === 'rooms' && <RoomSuggestionSection />}
      {activeTab === 'reports' && <SmartReportsSection />}
    </div>
  )
}

// ===================== AUTOMATION OVERVIEW =====================
function AutomationOverview({ stats, loading, onRefresh }: { stats: Record<string, unknown> | null; loading: boolean; onRefresh: () => void }) {
  if (loading || !stats) return <DashboardSkeleton />

  const s = stats as {
    totalStudents: number; totalRooms: number; occupiedRooms: number; availableRooms: number; maintenanceRooms: number;
    occupancyRate: number; totalCollected: number; totalPending: number; totalOverdue: number; collectionRate: number;
    studentsOutside: number; lateReturns: number; pendingLeave: number; pendingVisitors: number; activeVisitors: number;
    openComplaints: number; pendingMaintenance: number; pendingApplications: number;
    paidCount: number; pendingCount: number; overdueCount: number;
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 stagger-children">
        <div className="premium-card p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Active Students</p>
              <p className="text-xl font-bold">{s.totalStudents}</p>
            </div>
          </div>
        </div>
        <div className="premium-card p-4 hover:border-green-300 dark:hover:border-green-700 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
              <Home className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Occupancy</p>
              <p className="text-xl font-bold">{s.occupancyRate}%</p>
            </div>
          </div>
        </div>
        <div className="premium-card p-4 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
              <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Collection Rate</p>
              <p className="text-xl font-bold">{s.collectionRate}%</p>
            </div>
          </div>
        </div>
        <div className="premium-card p-4 hover:border-amber-300 dark:hover:border-amber-700 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Pending Items</p>
              <p className="text-xl font-bold">{s.pendingLeave + s.pendingVisitors + s.pendingApplications + s.pendingMaintenance}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Automation Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Fee Health */}
        <Card className="premium-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wallet className="h-4 w-4 text-green-500" /> Fee Health Monitor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Collected</span>
              <span className="text-sm font-bold text-green-600">{formatPKR(s.totalCollected)}</span>
            </div>
            <Progress value={s.collectionRate} className="h-2" />
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Pending</p>
                <p className="text-sm font-bold text-amber-600">{formatPKR(s.totalPending)}</p>
                <p className="text-[10px] text-muted-foreground">{s.pendingCount} records</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Overdue</p>
                <p className="text-sm font-bold text-red-600">{formatPKR(s.totalOverdue)}</p>
                <p className="text-[10px] text-muted-foreground">{s.overdueCount} records</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Room Status */}
        <Card className="premium-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-500" /> Room Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Occupancy Rate</span>
              <span className="text-sm font-bold">{s.occupancyRate}%</span>
            </div>
            <Progress value={s.occupancyRate} className="h-2" />
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-green-600">{s.availableRooms}</p>
                <p className="text-[10px] text-muted-foreground">Available</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-blue-600">{s.occupiedRooms}</p>
                <p className="text-[10px] text-muted-foreground">Occupied</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-amber-600">{s.maintenanceRooms}</p>
                <p className="text-[10px] text-muted-foreground">Maint.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <Card className="premium-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" /> Pending Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'Leave Requests', count: s.pendingLeave, icon: <ArrowRightLeft className="h-3.5 w-3.5" />, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
              { label: 'Visitor Approvals', count: s.pendingVisitors, icon: <Shield className="h-3.5 w-3.5" />, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
              { label: 'Applications', count: s.pendingApplications, icon: <FileText className="h-3.5 w-3.5" />, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
              { label: 'Maintenance', count: s.pendingMaintenance, icon: <Wrench className="h-3.5 w-3.5" />, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
              { label: 'Complaints', count: s.openComplaints, icon: <MessageSquare className="h-3.5 w-3.5" />, color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
              { label: 'Late Returns', count: s.lateReturns, icon: <Timer className="h-3.5 w-3.5" />, color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.color}`}>{item.icon}</div>
                  <span className="text-xs font-medium">{item.label}</span>
                </div>
                <Badge variant="outline" className="text-xs">{item.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Automation Actions */}
      <Card className="premium-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" /> Quick Automation Actions
            </CardTitle>
            <Button variant="outline" size="sm" className="text-xs" onClick={onRefresh}>
              <RefreshCw className="h-3 w-3 mr-1" /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <QuickActionCard icon={<Wallet className="h-5 w-5" />} title="Calculate Late Fees" description="Auto-calculate overdue fines" color="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400" onClick={async () => {
              try {
                const res = await apiFetch<{ lateFees: unknown[]; totalLateFee: number; affectedStudents: number }>('/api/automation?action=calculate-late-fees')
                toast.success(`Found ${res.lateFees.length} overdue records. Total late fees: ${formatPKR(res.totalLateFee)}`)
              } catch { toast.error('Failed to calculate late fees') }
            }} />
            <QuickActionCard icon={<UserCheck className="h-5 w-5" />} title="Update Leave Status" description="Auto-mark late returns" color="bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" onClick={async () => {
              try {
                const res = await apiFetch<{ success: boolean; updated: number; message: string }>('/api/automation?action=update-leave-status')
                toast.success(res.message)
                onRefresh()
              } catch { toast.error('Failed to update leave status') }
            }} />
            <QuickActionCard icon={<DollarSign className="h-5 w-5" />} title="Mark Overdue Fees" description="Auto-flag overdue payments" color="bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400" onClick={async () => {
              try {
                const res = await apiFetch<{ success: boolean; updated: number; message: string }>('/api/automation', { method: 'POST', body: JSON.stringify({ action: 'mark-overdue' }) })
                toast.success(res.message)
                onRefresh()
              } catch { toast.error('Failed to mark overdue fees') }
            }} />
            <QuickActionCard icon={<BedDouble className="h-5 w-5" />} title="Suggest Rooms" description="Find best available rooms" color="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" onClick={() => {}} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Quick Action Card Component
function QuickActionCard({ icon, title, description, color, onClick }: { icon: React.ReactNode; title: string; description: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="premium-card p-3 text-left hover:shadow-md transition-all group cursor-pointer">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} mb-2 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <p className="text-xs font-semibold">{title}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
    </button>
  )
}

// ===================== SMART SEARCH SECTION =====================
function SmartSearchSection() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [results, setResults] = useState<{ type: string; id: string; title: string; subtitle: string; badge?: string; badgeColor?: string }[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const res = await apiFetch<{ results: typeof results }>(`/api/automation?action=smart-search&q=${encodeURIComponent(query)}&category=${category}`)
      setResults(res.results)
      setSearched(true)
    } catch { toast.error('Search failed') }
    setSearching(false)
  }

  const categoryOptions = [
    { value: 'all', label: 'All', icon: <SearchIcon className="h-3.5 w-3.5" /> },
    { value: 'students', label: 'Students', icon: <Users className="h-3.5 w-3.5" /> },
    { value: 'rooms', label: 'Rooms', icon: <DoorOpen className="h-3.5 w-3.5" /> },
    { value: 'payments', label: 'Payments', icon: <DollarSign className="h-3.5 w-3.5" /> },
    { value: 'complaints', label: 'Complaints', icon: <MessageSquare className="h-3.5 w-3.5" /> },
  ]

  const typeIcons: Record<string, React.ReactNode> = {
    Student: <Users className="h-4 w-4" />,
    Room: <DoorOpen className="h-4 w-4" />,
    Payment: <DollarSign className="h-4 w-4" />,
    Complaint: <MessageSquare className="h-4 w-4" />,
  }

  const typeColors: Record<string, string> = {
    Student: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    Room: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    Payment: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    Complaint: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  }

  const badgeColors: Record<string, string> = {
    green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  }

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <Card className="premium-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" /> Smart Search
          </CardTitle>
          <CardDescription className="text-xs">Search across students, rooms, payments, and complaints with one query</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {categoryOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setCategory(opt.value)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  category === opt.value
                    ? 'bg-[#1e3a5f] text-white'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, roll no, room, status..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9 h-10 rounded-xl"
              />
            </div>
            <Button onClick={handleSearch} disabled={searching || !query.trim()} className="btn-primary-glow text-white rounded-xl px-6">
              {searching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {searched && (
        <Card className="premium-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Cpu className="h-4 w-4 text-purple-500" /> Search Results
              </CardTitle>
              <Badge variant="outline" className="text-xs">{results.length} found</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <SearchIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No results found for &ldquo;{query}&rdquo;</p>
                <p className="text-xs mt-1">Try different keywords or category</p>
              </div>
            ) : (
              <div className="space-y-2">
                {results.map((r, i) => (
                  <div key={`${r.type}-${r.id}-${i}`} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${typeColors[r.type] || 'bg-gray-100 text-gray-600'}`}>
                      {typeIcons[r.type] || <SearchIcon className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{r.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{r.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.badge && (
                        <Badge className={`text-[10px] ${badgeColors[r.badgeColor || 'blue'] || 'bg-gray-100 text-gray-700'}`}>
                          {r.badge}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px]">{r.type}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ===================== AUTO FEE SYSTEM =====================
function AutoFeeSystem({ user }: { user: UserType }) {
  const [lateFees, setLateFees] = useState<{
    id: string; studentName: string; rollNo: string; feeType: string;
    originalAmount: number; monthsOverdue: number; lateFee: number;
    totalDue: number; feeMonth: string; feeYear: number; currentStatus: string;
    room: string | null; hostel: string | null;
  }[]>([])
  const [summary, setSummary] = useState({ totalLateFee: 0, totalOriginal: 0, totalDue: 0, affectedStudents: 0, lateFeeRate: 500 })
  const [loading, setLoading] = useState(false)
  const [calculated, setCalculated] = useState(false)
  const [applying, setApplying] = useState(false)

  const calculateLateFees = async () => {
    setLoading(true)
    try {
      const res = await apiFetch<{
        lateFees: typeof lateFees;
        totalLateFee: number; totalOriginal: number; totalDue: number;
        affectedStudents: number; lateFeeRate: number;
      }>('/api/automation?action=calculate-late-fees')
      setLateFees(res.lateFees)
      setSummary({ totalLateFee: res.totalLateFee, totalOriginal: res.totalOriginal, totalDue: res.totalDue, affectedStudents: res.affectedStudents, lateFeeRate: res.lateFeeRate })
      setCalculated(true)
      toast.success(`Found ${res.lateFees.length} overdue fee records`)
    } catch { toast.error('Failed to calculate late fees') }
    setLoading(false)
  }

  const applyLateFees = async () => {
    setApplying(true)
    try {
      const res = await apiFetch<{ success: boolean; updated: number; totalLateFeeApplied: number; message: string }>('/api/automation?action=apply-late-fees')
      toast.success(res.message)
      calculateLateFees()
    } catch { toast.error('Failed to apply late fees') }
    setApplying(false)
  }

  const markOverdue = async () => {
    try {
      const res = await apiFetch<{ success: boolean; updated: number; message: string }>('/api/automation', { method: 'POST', body: JSON.stringify({ action: 'mark-overdue' }) })
      toast.success(res.message)
      calculateLateFees()
    } catch { toast.error('Failed to mark overdue fees') }
  }

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card className="premium-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wallet className="h-4 w-4 text-green-500" /> Auto Fee System
          </CardTitle>
          <CardDescription className="text-xs">Automatically calculate pending dues, add late fines, and update payment status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-200/50 dark:border-blue-800/30">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <p><strong>Late Fee Rate:</strong> Rs. {summary.lateFeeRate}/month (capped at 50% of original amount)</p>
                <p>The system automatically calculates months overdue and applies proportional late fees to all pending payments.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button onClick={calculateLateFees} disabled={loading} className="h-12 rounded-xl bg-[#1e3a5f] hover:bg-[#2a5a8f] text-white">
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Cpu className="h-4 w-4 mr-2" />}
              Calculate Late Fees
            </Button>
            <Button onClick={markOverdue} variant="outline" className="h-12 rounded-xl border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20">
              <AlertTriangle className="h-4 w-4 mr-2" /> Mark Overdue
            </Button>
            <Button onClick={applyLateFees} disabled={!calculated || applying || lateFees.length === 0} className="h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white">
              {applying ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <DollarSign className="h-4 w-4 mr-2" />}
              Apply Late Fees
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {calculated && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
          <div className="premium-card p-4 text-center">
            <p className="text-[10px] text-muted-foreground font-medium uppercase">Affected Students</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{summary.affectedStudents}</p>
          </div>
          <div className="premium-card p-4 text-center">
            <p className="text-[10px] text-muted-foreground font-medium uppercase">Original Amount</p>
            <p className="text-lg font-bold mt-1">{formatPKR(summary.totalOriginal)}</p>
          </div>
          <div className="premium-card p-4 text-center">
            <p className="text-[10px] text-muted-foreground font-medium uppercase">Total Late Fee</p>
            <p className="text-lg font-bold text-red-600 mt-1">{formatPKR(summary.totalLateFee)}</p>
          </div>
          <div className="premium-card p-4 text-center">
            <p className="text-[10px] text-muted-foreground font-medium uppercase">Total Due</p>
            <p className="text-lg font-bold text-orange-600 mt-1">{formatPKR(summary.totalDue)}</p>
          </div>
        </div>
      )}

      {/* Late Fee Records */}
      {calculated && (
        <Card className="premium-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileBarChart className="h-4 w-4 text-[#1e3a5f]" /> Overdue Fee Records
              </CardTitle>
              <Badge variant="outline" className="text-xs">{lateFees.length} records</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {lateFees.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-500 opacity-50" />
                <p className="text-sm font-medium">No overdue fees found!</p>
                <p className="text-xs mt-1">All payments are up to date</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Student</TableHead>
                      <TableHead className="text-xs">Fee Type</TableHead>
                      <TableHead className="text-xs">Month</TableHead>
                      <TableHead className="text-xs text-right">Original</TableHead>
                      <TableHead className="text-xs text-center">Months Overdue</TableHead>
                      <TableHead className="text-xs text-right">Late Fee</TableHead>
                      <TableHead className="text-xs text-right">Total Due</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lateFees.map(fee => (
                      <TableRow key={fee.id}>
                        <TableCell>
                          <div>
                            <p className="text-xs font-medium">{fee.studentName}</p>
                            <p className="text-[10px] text-muted-foreground">{fee.rollNo}{fee.room ? ` · Room ${fee.room}` : ''}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{fee.feeType}</TableCell>
                        <TableCell className="text-xs">{fee.feeMonth} {fee.feeYear}</TableCell>
                        <TableCell className="text-xs text-right">{formatPKR(fee.originalAmount)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-[10px] bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">{fee.monthsOverdue}mo</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-right text-red-600 font-medium">{formatPKR(fee.lateFee)}</TableCell>
                        <TableCell className="text-xs text-right font-bold">{formatPKR(fee.totalDue)}</TableCell>
                        <TableCell><FeeStatusBadge status={fee.currentStatus} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ===================== ROOM SUGGESTION SECTION =====================
function RoomSuggestionSection() {
  const [hostels, setHostels] = useState<HostelType[]>([])
  const [selectedHostel, setSelectedHostel] = useState('all')
  const [selectedFloor, setSelectedFloor] = useState('any')
  const [suggestions, setSuggestions] = useState<{
    id: string; number: string; floor: number; capacity: number; currentOccupancy: number;
    remainingCapacity: number; hostel: string; hostelType: string; hasMaintenance: boolean;
    score: number; reason: string; occupants: string[];
  }[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch<{ hostels: HostelType[] }>('/api/hostels')
        setHostels(res.hostels)
      } catch { /* ignore */ }
    })()
  }, [])

  const getSuggestions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedHostel !== 'all') params.set('hostelId', selectedHostel)
      if (selectedFloor !== 'any') params.set('floor', selectedFloor)
      const res = await apiFetch<{ suggestions: typeof suggestions }>(`/api/automation?action=room-suggestion&${params}`)
      setSuggestions(res.suggestions)
      setSearched(true)
      toast.success(`Found ${res.suggestions.length} available rooms`)
    } catch { toast.error('Failed to get suggestions') }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Filter Card */}
      <Card className="premium-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-blue-500" /> Auto Room Suggestion
          </CardTitle>
          <CardDescription className="text-xs">AI-powered room matching based on preferences, availability, and maintenance status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs font-medium">Hostel</Label>
              <Select value={selectedHostel} onValueChange={setSelectedHostel}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Hostels</SelectItem>
                  {hostels.map(h => (
                    <SelectItem key={h.id} value={h.id}>{h.name} ({h.type})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Floor Preference</Label>
              <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Floor</SelectItem>
                  <SelectItem value="0">Ground Floor</SelectItem>
                  <SelectItem value="1">First Floor</SelectItem>
                  <SelectItem value="2">Second Floor</SelectItem>
                  <SelectItem value="3">Third Floor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={getSuggestions} disabled={loading} className="w-full h-10 rounded-xl bg-[#1e3a5f] hover:bg-[#2a5a8f] text-white">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Lightbulb className="h-4 w-4 mr-2" />}
                Get Suggestions
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggestions */}
      {searched && (
        <div className="space-y-3">
          {suggestions.length === 0 ? (
            <Card className="premium-card">
              <CardContent className="py-8 text-center">
                <BedDouble className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="text-sm font-medium">No rooms available matching your criteria</p>
                <p className="text-xs text-muted-foreground mt-1">Try adjusting filters</p>
              </CardContent>
            </Card>
          ) : (
            suggestions.map((room, index) => (
              <Card key={room.id} className="premium-card overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  {/* Score Badge */}
                  <div className={`sm:w-20 flex sm:flex-col items-center justify-center p-3 sm:p-4 ${
                    index === 0 ? 'bg-green-500' : index < 3 ? 'bg-blue-500' : 'bg-gray-400'
                  } text-white`}>
                    <span className="text-2xl font-bold">{room.score}</span>
                    <span className="text-[10px] font-medium opacity-80">Score</span>
                    {index === 0 && <span className="text-[9px] bg-white/20 px-1.5 rounded-full mt-1">BEST</span>}
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm">Room {room.number}</h3>
                          <Badge variant="outline" className="text-[10px]">
                            Floor {room.floor}
                          </Badge>
                          <Badge className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            Available
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{room.hostel} ({room.hostelType})</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Capacity</p>
                        <p className="text-sm font-bold">{room.currentOccupancy}/{room.capacity}</p>
                        <p className="text-[10px] text-green-600 font-medium">{room.remainingCapacity} bed(s) free</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Lightbulb className="h-3 w-3 text-yellow-500" /> {room.reason}
                      </span>
                    </div>
                    {room.hasMaintenance && (
                      <div className="mt-2 bg-amber-50 dark:bg-amber-900/20 p-1.5 rounded border border-amber-200/50 dark:border-amber-800/30">
                        <p className="text-[10px] text-amber-700 dark:text-amber-400 flex items-center gap-1">
                          <Wrench className="h-3 w-3" /> Has pending maintenance requests
                        </p>
                      </div>
                    )}
                    {room.occupants.length > 0 && (
                      <div className="mt-2 flex items-center gap-1 flex-wrap">
                        <UserCheck className="h-3 w-3 text-muted-foreground" />
                        {room.occupants.map((name, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">{name}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ===================== SMART REPORTS SECTION =====================
function SmartReportsSection() {
  const [reportType, setReportType] = useState('students')
  const [reportData, setReportData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)

  const reportTypes = [
    { value: 'students', label: 'Student Report', icon: <Users className="h-4 w-4" />, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
    { value: 'rooms', label: 'Room Occupancy', icon: <Building2 className="h-4 w-4" />, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
    { value: 'payments', label: 'Payment Report', icon: <DollarSign className="h-4 w-4" />, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { value: 'leaves', label: 'Leave Report', icon: <ArrowRightLeft className="h-4 w-4" />, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400' },
  ]

  const generateReport = async () => {
    setLoading(true)
    try {
      const res = await apiFetch<Record<string, unknown>>(`/api/automation?action=report&type=${reportType}`)
      setReportData(res)
      setGenerated(true)
      toast.success('Report generated successfully')
    } catch { toast.error('Failed to generate report') }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Report Type Selection */}
      <Card className="premium-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileBarChart className="h-4 w-4 text-purple-500" /> Smart Reports Generator
          </CardTitle>
          <CardDescription className="text-xs">Auto-generate comprehensive reports from live data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {reportTypes.map(rt => (
              <button
                key={rt.value}
                onClick={() => { setReportType(rt.value); setGenerated(false) }}
                className={`p-3 rounded-xl border-2 transition-all text-left ${
                  reportType === rt.value
                    ? 'border-[#1e3a5f] bg-[#1e3a5f]/5 dark:bg-[#1e3a5f]/20'
                    : 'border-transparent bg-muted/30 hover:bg-muted/60'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${rt.color} mb-2`}>{rt.icon}</div>
                <p className="text-xs font-semibold">{rt.label}</p>
              </button>
            ))}
          </div>
          <Button onClick={generateReport} disabled={loading} className="w-full sm:w-auto h-10 rounded-xl bg-[#1e3a5f] hover:bg-[#2a5a8f] text-white">
            {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Cpu className="h-4 w-4 mr-2" />}
            Generate {reportTypes.find(r => r.value === reportType)?.label}
          </Button>
        </CardContent>
      </Card>

      {/* Report Output */}
      {generated && reportData && (
        <Card className="premium-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" /> Report Generated
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {new Date((reportData as { generatedAt: string }).generatedAt).toLocaleString()}
                </Badge>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => {
                  const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `${reportType}-report-${new Date().toISOString().slice(0, 10)}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                  toast.success('Report downloaded')
                }}>
                  <Download className="h-3 w-3 mr-1" /> Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Student Report */}
            {reportType === 'students' && <StudentReportView data={reportData} />}
            {/* Room Report */}
            {reportType === 'rooms' && <RoomReportView data={reportData} />}
            {/* Payment Report */}
            {reportType === 'payments' && <PaymentReportView data={reportData} />}
            {/* Leave Report */}
            {reportType === 'leaves' && <LeaveReportView data={reportData} />}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ===================== REPORT VIEW COMPONENTS =====================
function StudentReportView({ data }: { data: Record<string, unknown> }) {
  const d = data as {
    totalStudents: number; activeStudents: number; withRoom: number; withDues: number;
    report: { id: string; name: string; rollNo: string; department: string; semester: number; status: string; room: string; hostel: string; totalFees: number; paidFees: number; pendingFees: number; totalDue: number; openComplaints: number; lastMovement: string }[]
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{d.totalStudents}</p>
          <p className="text-[10px] text-muted-foreground">Total Students</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{d.activeStudents}</p>
          <p className="text-[10px] text-muted-foreground">Active</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{d.withRoom}</p>
          <p className="text-[10px] text-muted-foreground">With Room</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-red-600">{d.withDues}</p>
          <p className="text-[10px] text-muted-foreground">With Dues</p>
        </div>
      </div>

      {/* Student Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Roll No</TableHead>
              <TableHead className="text-xs">Dept / Sem</TableHead>
              <TableHead className="text-xs">Room</TableHead>
              <TableHead className="text-xs text-center">Fees</TableHead>
              <TableHead className="text-xs text-right">Due</TableHead>
              <TableHead className="text-xs">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {d.report.slice(0, 20).map(s => (
              <TableRow key={s.id}>
                <TableCell className="text-xs font-medium">{s.name}</TableCell>
                <TableCell className="text-xs">{s.rollNo}</TableCell>
                <TableCell className="text-xs">{s.department} · Sem {s.semester}</TableCell>
                <TableCell className="text-xs">{s.room !== 'Not Assigned' ? s.room : <span className="text-muted-foreground">-</span>}</TableCell>
                <TableCell className="text-center">
                  <span className="text-[10px] text-green-600">{s.paidFees}p</span>
                  <span className="text-[10px] mx-0.5">/</span>
                  <span className="text-[10px] text-red-600">{s.pendingFees}u</span>
                </TableCell>
                <TableCell className="text-xs text-right font-medium">{s.totalDue > 0 ? formatPKR(s.totalDue) : '-'}</TableCell>
                <TableCell><Badge className={`text-[10px] ${s.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>{s.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function RoomReportView({ data }: { data: Record<string, unknown> }) {
  const d = data as {
    totalRooms: number; availableRooms: number; occupiedRooms: number; maintenanceRooms: number; overallOccupancy: number;
    report: { id: string; number: string; floor: number; capacity: number; status: string; hostel: string; currentOccupancy: number; remainingCapacity: number; occupancyPercent: number; pendingMaintenance: number; totalDueFromOccupants: number; occupants: { name: string; rollNo: string; department: string }[] }[]
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{d.totalRooms}</p>
          <p className="text-[10px] text-muted-foreground">Total Rooms</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{d.availableRooms}</p>
          <p className="text-[10px] text-muted-foreground">Available</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-amber-600">{d.occupiedRooms}</p>
          <p className="text-[10px] text-muted-foreground">Occupied</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-red-600">{d.maintenanceRooms}</p>
          <p className="text-[10px] text-muted-foreground">Maintenance</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-purple-600">{d.overallOccupancy}%</p>
          <p className="text-[10px] text-muted-foreground">Occupancy</p>
        </div>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {d.report.slice(0, 18).map(room => (
          <div key={room.id} className={`p-3 rounded-xl border ${
            room.status === 'Available' ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10' :
            room.status === 'Occupied' ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10' :
            'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Room {room.number}</span>
                <Badge className={`text-[9px] ${
                  room.status === 'Available' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                  room.status === 'Occupied' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}>{room.status}</Badge>
              </div>
              <span className="text-[10px] text-muted-foreground">F{room.floor}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">{room.hostel}</p>
            <div className="mt-2">
              <div className="flex justify-between text-[10px] mb-1">
                <span>{room.currentOccupancy}/{room.capacity} beds</span>
                <span>{room.occupancyPercent}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className={`h-full rounded-full ${room.occupancyPercent === 100 ? 'bg-red-400' : room.occupancyPercent > 50 ? 'bg-amber-400' : 'bg-green-400'}`} style={{ width: `${room.occupancyPercent}%` }} />
              </div>
            </div>
            {room.pendingMaintenance > 0 && (
              <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1"><Wrench className="h-3 w-3" /> {room.pendingMaintenance} pending maint.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function PaymentReportView({ data }: { data: Record<string, unknown> }) {
  const d = data as {
    totalFees: number; totalAmount: number; totalCollected: number; totalPending: number; totalOverdue: number;
    byType: Record<string, { count: number; total: number; paid: number; pending: number; overdue: number }>;
    byMonth: Record<string, { collected: number; pending: number; overdue: number }>;
    recentPayments: { id: string; student: string; rollNo: string; amount: number; feeType: string; month: string; year: number; paidDate: string | null; room: string; hostel: string }[];
  }

  const collectionRate = d.totalAmount > 0 ? Math.round((d.totalCollected / d.totalAmount) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-blue-600">{d.totalFees}</p>
          <p className="text-[10px] text-muted-foreground">Total Records</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
          <p className="text-sm font-bold text-emerald-600">{formatPKR(d.totalCollected)}</p>
          <p className="text-[10px] text-muted-foreground">Collected</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
          <p className="text-sm font-bold text-amber-600">{formatPKR(d.totalPending)}</p>
          <p className="text-[10px] text-muted-foreground">Pending</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center">
          <p className="text-sm font-bold text-red-600">{formatPKR(d.totalOverdue)}</p>
          <p className="text-[10px] text-muted-foreground">Overdue</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-purple-600">{collectionRate}%</p>
          <p className="text-[10px] text-muted-foreground">Collection Rate</p>
        </div>
      </div>

      {/* Fee Type Breakdown */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">By Fee Type</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(d.byType).map(([type, data]) => (
            <div key={type} className="bg-muted/30 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold">{type}</span>
                <Badge variant="outline" className="text-[10px]">{data.count} records</Badge>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-green-600">Paid</span><span className="font-medium">{formatPKR(data.paid)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-amber-600">Pending</span><span className="font-medium">{formatPKR(data.pending)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-red-600">Overdue</span><span className="font-medium">{formatPKR(data.overdue)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-xs font-bold">
                  <span>Total</span><span>{formatPKR(data.total)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Payments */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Payments</p>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Student</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Month</TableHead>
                <TableHead className="text-xs text-right">Amount</TableHead>
                <TableHead className="text-xs">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.recentPayments.slice(0, 10).map(p => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div>
                      <p className="text-xs font-medium">{p.student}</p>
                      <p className="text-[10px] text-muted-foreground">{p.rollNo}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{p.feeType}</TableCell>
                  <TableCell className="text-xs">{p.month} {p.year}</TableCell>
                  <TableCell className="text-xs text-right font-medium">{formatPKR(p.amount)}</TableCell>
                  <TableCell className="text-[10px] text-muted-foreground">{p.paidDate ? new Date(p.paidDate).toLocaleDateString() : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

function LeaveReportView({ data }: { data: Record<string, unknown> }) {
  const d = data as {
    totalMovements: number; byReason: Record<string, number>; byStatus: Record<string, number>;
    avgDurationDays: number; currentlyOutside: number; pendingApprovals: number; lateReturns: number;
    recentMovements: { id: string; student: string; rollNo: string; reason: string; destination: string; departureDate: string; expectedReturnDate: string; actualReturnDate: string | null; status: string; room: string; hostel: string }[];
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{d.totalMovements}</p>
          <p className="text-[10px] text-muted-foreground">Total Records</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-orange-600">{d.currentlyOutside}</p>
          <p className="text-[10px] text-muted-foreground">Currently Outside</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-amber-600">{d.pendingApprovals}</p>
          <p className="text-[10px] text-muted-foreground">Pending</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-red-600">{d.lateReturns}</p>
          <p className="text-[10px] text-muted-foreground">Late Returns</p>
        </div>
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-muted/30 rounded-xl p-4">
          <p className="text-xs font-semibold mb-3">By Reason</p>
          <div className="space-y-2">
            {Object.entries(d.byReason).sort(([,a],[,b]) => b - a).map(([reason, count]) => (
              <div key={reason} className="flex items-center justify-between">
                <LeaveReasonBadge reason={reason} />
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-muted rounded-full h-2 overflow-hidden">
                    <div className="bg-[#1e3a5f] h-full rounded-full" style={{ width: `${d.totalMovements > 0 ? (count / d.totalMovements) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs font-medium w-6 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-muted/30 rounded-xl p-4">
          <p className="text-xs font-semibold mb-3">By Status</p>
          <div className="space-y-2">
            {Object.entries(d.byStatus).sort(([,a],[,b]) => b - a).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <MovementStatusBadge status={status} />
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-muted rounded-full h-2 overflow-hidden">
                    <div className={`h-full rounded-full ${
                      status === 'Returned' ? 'bg-green-500' : status === 'Out' ? 'bg-orange-500' : status === 'Late Return' ? 'bg-red-500' : status === 'Approved' ? 'bg-blue-500' : 'bg-amber-500'
                    }`} style={{ width: `${d.totalMovements > 0 ? (count / d.totalMovements) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs font-medium w-6 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
          {d.avgDurationDays > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground">Average Trip Duration: <span className="font-bold text-foreground">{d.avgDurationDays} days</span></p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Movements */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Student</TableHead>
              <TableHead className="text-xs">Reason</TableHead>
              <TableHead className="text-xs">Departure</TableHead>
              <TableHead className="text-xs">Expected Return</TableHead>
              <TableHead className="text-xs">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {d.recentMovements.slice(0, 15).map(m => (
              <TableRow key={m.id}>
                <TableCell>
                  <div>
                    <p className="text-xs font-medium">{m.student}</p>
                    <p className="text-[10px] text-muted-foreground">{m.rollNo}</p>
                  </div>
                </TableCell>
                <TableCell><LeaveReasonBadge reason={m.reason} /></TableCell>
                <TableCell className="text-[10px]">{new Date(m.departureDate).toLocaleDateString()}</TableCell>
                <TableCell className="text-[10px]">{new Date(m.expectedReturnDate).toLocaleDateString()}</TableCell>
                <TableCell><MovementStatusBadge status={m.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// ===================== ADMIN SECURITY PANEL =====================
function AdminSecurityPanel({ user }: { user: UserType }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'alerts' | 'access'>('overview')
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)
  const [logs, setLogs] = useState<ActivityLogType[]>([])
  const [alerts, setAlerts] = useState<SecurityAlertType[]>([])
  const [loading, setLoading] = useState(true)
  const [alertsLoading, setAlertsLoading] = useState(false)
  const [logsLoading, setLogsLoading] = useState(false)
  const [alertError, setAlertError] = useState('')
  const [logFilter, setLogFilter] = useState({ category: 'all', actionType: 'all', role: 'all' })
  const [alertFilter, setAlertFilter] = useState({ severity: 'all', type: 'all' })
  const [logSearch, setLogSearch] = useState('')

  const statsLoadedRef = useRef(false)

  const loadStats = useCallback(async () => {
    try {
      const res = await apiFetch<Record<string, unknown>>('/api/security?action=dashboard-stats')
      setStats(res)
      if (!statsLoadedRef.current) {
        setLoading(false)
        statsLoadedRef.current = true
      }
    } catch {
      toast.error('Failed to load security stats')
      setLoading(false)
    }
  }, [])

  const loadLogs = useCallback(async () => {
    setLogsLoading(true)
    try {
      const params = new URLSearchParams({ action: 'activity-logs', ...logFilter, search: logSearch, limit: '100' })
      const res = await apiFetch<{ logs: ActivityLogType[]; total: number }>(`/api/security?${params}`)
      setLogs(res.logs)
    } catch { toast.error('Failed to load activity logs') }
    setLogsLoading(false)
  }, [logFilter, logSearch])

  const loadAlerts = useCallback(async () => {
    setAlertsLoading(true)
    setAlertError('')
    try {
      const params = new URLSearchParams({ action: 'alerts', ...alertFilter, limit: '100' })
      const res = await apiFetch<{ alerts: SecurityAlertType[]; total: number; unresolvedCount: number }>(`/api/security?${params}`)
      setAlerts(res.alerts)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load security alerts'
      setAlertError(msg)
    }
    setAlertsLoading(false)
  }, [alertFilter])

  useEffect(() => { loadStats() }, [loadStats])
  useEffect(() => { if (activeTab === 'logs') loadLogs() }, [activeTab, loadLogs])
  useEffect(() => { if (activeTab === 'alerts') loadAlerts() }, [activeTab, loadAlerts])

  // Auto-refresh stats every 30 seconds to keep dashboard and alert badges current
  useEffect(() => {
    const interval = setInterval(() => { loadStats() }, 30000)
    return () => clearInterval(interval)
  }, [loadStats])

  // Auto-refresh alerts tab every 15 seconds
  useEffect(() => {
    if (activeTab !== 'alerts') return
    const interval = setInterval(() => { loadAlerts() }, 15000)
    return () => clearInterval(interval)
  }, [activeTab, loadAlerts])

  const resolveAlert = async (alertId: string) => {
    try {
      await apiFetch('/api/security', {
        method: 'POST',
        body: JSON.stringify({ action: 'resolve-alert', alertId, resolvedBy: user.name }),
        headers: { 'Content-Type': 'application/json' },
      })
      toast.success('Alert resolved successfully')
      loadAlerts()
      loadStats()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resolve alert')
    }
  }

  const resolveAllAlerts = async () => {
    try {
      const res = await apiFetch<{ success: boolean; resolved: number }>('/api/security', {
        method: 'POST',
        body: JSON.stringify({ action: 'resolve-all-alerts', resolvedBy: user.name }),
        headers: { 'Content-Type': 'application/json' },
      })
      toast.success(`Resolved ${res.resolved || 'all'} alerts successfully`)
      loadAlerts()
      loadStats()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resolve alerts')
    }
  }

  const createTestAlert = async () => {
    try {
      await apiFetch('/api/security', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create-alert',
          type: 'suspicious_activity',
          severity: 'medium',
          userName: user.name,
          description: `Test security alert created by ${user.name} to verify alert system`,
        }),
        headers: { 'Content-Type': 'application/json' },
      })
      toast.success('Test alert created')
      loadAlerts()
      loadStats()
    } catch { toast.error('Failed to create test alert') }
  }

  const formatTimeAgo = (time: string) => {
    const diff = Date.now() - new Date(time).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return new Date(time).toLocaleDateString()
  }

  const actionIcon = (action: string) => {
    switch (action) {
      case 'login': return <LogOut className="h-3.5 w-3.5" />
      case 'logout': return <LogOut className="h-3.5 w-3.5" />
      case 'failed_login': return <AlertOctagon className="h-3.5 w-3.5" />
      case 'create': return <Plus className="h-3.5 w-3.5" />
      case 'update': return <Edit className="h-3.5 w-3.5" />
      case 'delete': return <Trash2 className="h-3.5 w-3.5" />
      case 'approve': return <CheckCircle className="h-3.5 w-3.5" />
      case 'reject': return <XCircle className="h-3.5 w-3.5" />
      case 'access_denied': return <ShieldAlert className="h-3.5 w-3.5" />
      case 'password_change': return <Key className="h-3.5 w-3.5" />
      default: return <Activity className="h-3.5 w-3.5" />
    }
  }

  const tabs = [
    { key: 'overview' as const, label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { key: 'logs' as const, label: 'Activity Logs', icon: <Activity className="h-4 w-4" /> },
    { key: 'alerts' as const, label: 'Security Alerts', icon: <ShieldAlert className="h-4 w-4" /> },
    { key: 'access' as const, label: 'Access Control', icon: <Lock className="h-4 w-4" /> },
  ]

  const s = stats as {
    totalActivities?: number; todayActivities?: number; weekActivities?: number;
    totalLogins?: number; todayLogins?: number; todayStudentLogins?: number; todayAdminLogins?: number;
    totalFailedAttempts?: number; todayFailedAttempts?: number; weekFailedAttempts?: number;
    totalAlerts?: number; unresolvedAlerts?: number; criticalAlerts?: number; highAlerts?: number; mediumAlerts?: number; lowAlerts?: number;
    recentAlerts?: SecurityAlertType[]; recentLogs?: ActivityLogType[];
    activeUsers?: { userId: string; userName: string; userRole: string; createdAt: string }[];
    uniqueActiveUsers?: number;
    categoryBreakdown?: Record<string, number>; actionBreakdown?: Record<string, number>;
  } | null

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#1e3a5f] via-[#2a5a8f] to-[#1a2a4a] p-5 sm:p-7 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 left-10 w-32 h-32 bg-green-400 rounded-full blur-3xl" />
          <div className="absolute bottom-2 right-10 w-24 h-24 bg-red-400 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
              <Shield className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Security & Access Control</h2>
              <p className="text-blue-200/80 text-xs sm:text-sm">Monitor activity, manage access, and protect the hostel system</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-0.5 bg-green-500/20 border border-green-400/30 rounded-full text-[10px] font-medium text-green-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Secure
            </span>
            <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-400/30 rounded-full text-[10px] font-medium text-blue-300">Role-Based Access</span>
            <span className="px-2 py-0.5 bg-red-500/20 border border-red-400/30 rounded-full text-[10px] font-medium text-red-300">Activity Monitoring</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-[#1e3a5f] text-white shadow-md'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {tab.icon} {tab.label}
            {tab.key === 'alerts' && s && s.unresolvedAlerts ? s.unresolvedAlerts > 0 && (
              <span className="ml-1 px-1.5 py-0 bg-red-500 text-white text-[9px] rounded-full font-bold">{s.unresolvedAlerts}</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === 'overview' && (
        loading || !s ? <DashboardSkeleton /> : (
          <div className="space-y-6">
            {/* Security Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 stagger-children">
              <StatCard title="Today's Logins" value={s.todayLogins || 0} icon={<LogOut className="h-4 w-4 sm:h-5 sm:w-5" />} color="text-green-600" bg="bg-green-50 dark:bg-green-900/20" />
              <StatCard title="Active Users" value={s.uniqueActiveUsers || 0} icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-900/20" />
              <StatCard title="Failed Attempts" value={s.todayFailedAttempts || 0} icon={<AlertOctagon className="h-4 w-4 sm:h-5 sm:w-5" />} color="text-red-600" bg="bg-red-50 dark:bg-red-900/20" />
              <StatCard title="Unresolved Alerts" value={s.unresolvedAlerts || 0} icon={<ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5" />} color="text-amber-600" bg="bg-amber-50 dark:bg-amber-900/20" />
              <StatCard title="Student Logins" value={s.todayStudentLogins || 0} icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />} color="text-purple-600" bg="bg-purple-50 dark:bg-purple-900/20" />
              <StatCard title="Admin Logins" value={s.todayAdminLogins || 0} icon={<Shield className="h-4 w-4 sm:h-5 sm:w-5" />} color="text-[#1e3a5f]" bg="bg-blue-50 dark:bg-blue-900/20" />
              <StatCard title="Total Activities" value={s.todayActivities || 0} icon={<Activity className="h-4 w-4 sm:h-5 sm:w-5" />} color="text-teal-600" bg="bg-teal-50 dark:bg-teal-900/20" />
              <StatCard title="Critical Alerts" value={s.criticalAlerts || 0} icon={<AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />} color="text-red-600" bg="bg-red-50 dark:bg-red-900/20" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Users */}
              <Card className="premium-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <UserCheck className="h-4 w-4 text-green-500" /> Active Users (Last 24h)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {(s.activeUsers || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No active users in the last 24 hours</p>
                    ) : (
                      (s.activeUsers || []).map((au, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="h-7 w-7 border border-border/50">
                              <AvatarFallback className={`text-[10px] font-bold ${au.userRole === 'admin' ? 'bg-gradient-to-br from-[#1e3a5f] to-[#2a5a8f] text-white' : 'bg-gradient-to-br from-green-400 to-green-600 text-white'}`}>
                                {au.userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{au.userName}</p>
                              <p className="text-[10px] text-muted-foreground capitalize">{au.userRole}</p>
                            </div>
                          </div>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatTimeAgo(au.createdAt)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Alerts */}
              <Card className="premium-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                      <AlertTriangle className="h-4 w-4 text-red-500" /> Recent Security Alerts
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => setActiveTab('alerts')}>View All</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {(s.recentAlerts || []).length === 0 ? (
                      <div className="text-center py-8">
                        <ShieldCheck className="h-10 w-10 text-green-400 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No security alerts</p>
                        <p className="text-xs text-muted-foreground">System is secure</p>
                      </div>
                    ) : (
                      (s.recentAlerts || []).map((alert: SecurityAlertType) => (
                        <div key={alert.id} className={`flex items-start gap-3 p-2.5 rounded-lg border transition-colors ${alert.isResolved ? 'bg-muted/20 border-border/30' : alert.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30'}`}>
                          <div className="mt-0.5">{actionIcon(alert.type === 'failed_login' ? 'failed_login' : 'access_denied')}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <AlertTypeBadge type={alert.type} />
                              <AlertSeverityBadge severity={alert.severity} />
                              {alert.isResolved && <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-[10px]">Resolved</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 truncate">{alert.description}</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-0.5">{formatTimeAgo(alert.createdAt)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity Logs */}
            <Card className="premium-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <Activity className="h-4 w-4 text-blue-500" /> Recent Activity
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => setActiveTab('logs')}>View All</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                  {(s.recentLogs || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                  ) : (
                    (s.recentLogs || []).map((log: ActivityLogType) => (
                      <div key={log.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors">
                        <div className="shrink-0 w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center">
                          {actionIcon(log.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium truncate">{log.userName}</span>
                            <ActivityActionBadge action={log.action} />
                            <ActivityCategoryBadge category={log.category} />
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">{log.description}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">{formatTimeAgo(log.createdAt)}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )
      )}

      {/* ===== ACTIVITY LOGS TAB ===== */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Filters */}
          <Card className="premium-card">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[200px]">
                  <Label className="text-xs font-medium mb-1.5 block">Search</Label>
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search by name, description..." value={logSearch} onChange={e => setLogSearch(e.target.value)} className="pl-9 h-9 rounded-lg text-sm" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">Category</Label>
                  <Select value={logFilter.category} onValueChange={v => setLogFilter(f => ({ ...f, category: v }))}>
                    <SelectTrigger className="h-9 w-36 rounded-lg text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="auth">Auth</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="room">Room</SelectItem>
                      <SelectItem value="fee">Fee</SelectItem>
                      <SelectItem value="complaint">Complaint</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="leave">Leave</SelectItem>
                      <SelectItem value="visitor">Visitor</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">Action</Label>
                  <Select value={logFilter.actionType} onValueChange={v => setLogFilter(f => ({ ...f, actionType: v }))}>
                    <SelectTrigger className="h-9 w-36 rounded-lg text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="login">Login</SelectItem>
                      <SelectItem value="logout">Logout</SelectItem>
                      <SelectItem value="failed_login">Failed Login</SelectItem>
                      <SelectItem value="create">Create</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="delete">Delete</SelectItem>
                      <SelectItem value="approve">Approve</SelectItem>
                      <SelectItem value="reject">Reject</SelectItem>
                      <SelectItem value="password_change">Password Change</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">Role</Label>
                  <Select value={logFilter.role} onValueChange={v => setLogFilter(f => ({ ...f, role: v }))}>
                    <SelectTrigger className="h-9 w-28 rounded-lg text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" className="h-9" onClick={loadLogs}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Logs List */}
          <Card className="premium-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Activity className="h-4 w-4 text-blue-500" /> Activity Logs ({logs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading && logs.length === 0 ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 animate-pulse">
                      <div className="w-8 h-8 bg-muted/50 rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 w-1/3 bg-muted/50 rounded mb-1" />
                        <div className="h-3 w-2/3 bg-muted/50 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : logs.length === 0 ? (
                <EmptyState icon={<Activity className="h-10 w-10" />} title="No Activity Logs" description="No activity logs match your current filters" />
              ) : (
                <div className="space-y-1.5 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {logsLoading && (
                    <div className="flex items-center gap-2 px-1 py-1.5 text-xs text-muted-foreground">
                      <RefreshCw className="h-3 w-3 animate-spin" /> Updating logs...
                    </div>
                  )}
                  {logs.map(log => (
                    <div key={log.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
                        {actionIcon(log.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium truncate max-w-[150px]">{log.userName}</span>
                          <Badge className={`text-[9px] ${log.userRole === 'admin' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>{log.userRole}</Badge>
                          <ActivityActionBadge action={log.action} />
                          <ActivityCategoryBadge category={log.category} />
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{log.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-muted-foreground">{formatTimeAgo(log.createdAt)}</p>
                        {log.ipAddress && <p className="text-[9px] text-muted-foreground/50 font-mono">{log.ipAddress}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== SECURITY ALERTS TAB ===== */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {/* Filters */}
          <Card className="premium-card">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">Severity</Label>
                  <Select value={alertFilter.severity} onValueChange={v => setAlertFilter(f => ({ ...f, severity: v }))}>
                    <SelectTrigger className="h-9 w-32 rounded-lg text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severity</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">Type</Label>
                  <Select value={alertFilter.type} onValueChange={v => setAlertFilter(f => ({ ...f, type: v }))}>
                    <SelectTrigger className="h-9 w-40 rounded-lg text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="failed_login">Failed Login</SelectItem>
                      <SelectItem value="unauthorized_access">Unauthorized Access</SelectItem>
                      <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                      <SelectItem value="password_breach">Password Reset</SelectItem>
                      <SelectItem value="account_locked">Account Locked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" className="h-9" onClick={loadAlerts} disabled={alertsLoading}>
                  <RefreshCw className={`h-3.5 w-3.5 mr-1 ${alertsLoading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
                {alerts.some(a => !a.isResolved) && (
                  <Button size="sm" className="h-9 btn-green-glow text-white" onClick={resolveAllAlerts}>
                    <CheckCircle className="h-3.5 w-3.5 mr-1" /> Resolve All
                  </Button>
                )}
                <Button variant="outline" size="sm" className="h-9 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20" onClick={createTestAlert}>
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Test Alert
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Error Banner */}
          {alertError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 flex items-center gap-3">
              <AlertOctagon className="h-5 w-5 text-red-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">Failed to load alerts</p>
                <p className="text-xs text-red-600/70 dark:text-red-400/70">{alertError}</p>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={loadAlerts}>Retry</Button>
            </div>
          )}

          {/* Alerts List */}
          <Card className="premium-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <ShieldAlert className="h-4 w-4 text-red-500" /> Security Alerts ({alerts.length})
                </CardTitle>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse-soft" />
                  Auto-refresh 15s
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {alertsLoading && alerts.length === 0 ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-3 rounded-xl border bg-muted/20 animate-pulse">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-5 w-20 bg-muted/50 rounded" />
                        <div className="h-5 w-16 bg-muted/50 rounded" />
                      </div>
                      <div className="h-4 w-3/4 bg-muted/50 rounded" />
                    </div>
                  ))}
                </div>
              ) : alerts.length === 0 ? (
                <EmptyState icon={<ShieldCheck className="h-10 w-10" />} title="No Security Alerts" description="All clear! No security alerts match your filters. Try clicking 'Test Alert' to create a test alert." />
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {alertsLoading && (
                    <div className="flex items-center gap-2 px-1 py-1.5 text-xs text-muted-foreground">
                      <RefreshCw className="h-3 w-3 animate-spin" /> Updating alerts...
                    </div>
                  )}
                  {alerts.map(alert => (
                    <div key={alert.id} className={`p-3 rounded-xl border transition-colors ${alert.isResolved ? 'bg-muted/20 border-border/30 opacity-70' : alert.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30' : alert.severity === 'high' ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800/30' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <AlertTypeBadge type={alert.type} />
                            <AlertSeverityBadge severity={alert.severity} />
                            {alert.isResolved ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-[10px]">Resolved</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-[10px] animate-subtle-pulse">Active</Badge>
                            )}
                          </div>
                          <p className="text-sm text-foreground/90">{alert.description}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                            {alert.userName && <span className="font-medium">User: {alert.userName}</span>}
                            {alert.ipAddress && <span className="font-mono">IP: {alert.ipAddress}</span>}
                            <span>{formatTimeAgo(alert.createdAt)}</span>
                            {alert.isResolved && alert.resolvedBy && <span>Resolved by: {alert.resolvedBy}</span>}
                          </div>
                        </div>
                        {!alert.isResolved && (
                          <Button variant="outline" size="sm" className="h-7 text-xs shrink-0" onClick={() => resolveAlert(alert.id)}>
                            <CheckCircle className="h-3 w-3 mr-1" /> Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== ACCESS CONTROL TAB ===== */}
      {activeTab === 'access' && (
        <div className="space-y-6">
          {/* Role-Based Access Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Admin Access */}
            <Card className="premium-card border-blue-200 dark:border-blue-800/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#1e3a5f]" /> Admin / Warden Access
                </CardTitle>
                <CardDescription className="text-xs">Full system access with administrative privileges</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {[
                    'Dashboard with full analytics',
                    'Student management (CRUD)',
                    'Room allocation & management',
                    'Fee collection & reporting',
                    'Complaint resolution',
                    'Leave/movement approval',
                    'Visitor management',
                    'Staff management',
                    'Notice & announcement creation',
                    'Security panel access',
                    'Activity log review',
                    'AI & Automation tools',
                  ].map((perm, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      <span>{perm}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Fingerprint className="h-3.5 w-3.5" />
                    <span>Role: <b className="text-foreground">admin / warden</b></span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Student Access */}
            <Card className="premium-card border-green-200 dark:border-green-800/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-green-600" /> Student Access
                </CardTitle>
                <CardDescription className="text-xs">Limited access to own data and hostel services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {[
                    'Personal dashboard',
                    'View own room details',
                    'Apply for room allocation',
                    'View & pay own fees',
                    'Submit complaints',
                    'Request leave/movement',
                    'Register visitors',
                    'View notices',
                    'Edit own profile',
                    'View own notifications',
                  ].map((perm, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      <span>{perm}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Restricted Actions:</p>
                  {[
                    'Cannot access other students data',
                    'Cannot modify fee records',
                    'Cannot approve/reject applications',
                    'Cannot access admin security panel',
                  ].map((rest, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-red-600/70 dark:text-red-400/70">
                      <XCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{rest}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Features Info */}
          <Card className="premium-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-[#1e3a5f]" /> Security Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { icon: <Key className="h-5 w-5" />, title: 'Password Encryption', desc: 'All passwords are encoded before storage using base64 hashing for secure authentication.' },
                  { icon: <Shield className="h-5 w-5" />, title: 'Role-Based Access', desc: 'Separate access levels ensure students only see their own data while admins manage the full system.' },
                  { icon: <EyeIcon className="h-5 w-5" />, title: 'Activity Monitoring', desc: 'Every login, logout, and system action is logged with timestamps and user details.' },
                  { icon: <AlertTriangle className="h-5 w-5" />, title: 'Threat Detection', desc: 'Automatic security alerts for failed login attempts, unauthorized access, and suspicious activity.' },
                  { icon: <Fingerprint className="h-5 w-5" />, title: 'Session Management', desc: 'User sessions are managed via secure localStorage with automatic validation on each page load.' },
                  { icon: <ShieldCheck className="h-5 w-5" />, title: 'Account Lockout', desc: 'After 5 failed login attempts, accounts are flagged with critical security alerts for admin review.' },
                ].map((feature, i) => (
                  <div key={i} className="p-4 rounded-xl bg-muted/30 border border-border/30 hover:border-[#1e3a5f]/20 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-[#1e3a5f] dark:text-blue-400">{feature.icon}</div>
                      <h4 className="font-semibold text-sm">{feature.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// ===================== AI USAGE CONTROL PANEL =====================
function AdminAiUsagePanel({ user }: { user: UserType }) {
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'logs'>('overview')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    stats: { totalUsers: number; activeToday: number; totalQueriesToday: number; disabledUsers: number; highUsageUsers: number }
    highUsage: { id: string; userId: string; userName: string; userEmail: string; userRole: string; queryCount: number; isDisabled: boolean; lastResetDate: string }[]
    allUsers: { id: string; userId: string; userName: string; userEmail: string; userRole: string; queryCount: number; isDisabled: boolean; disabledReason: string | null; lastResetDate: string }[]
    recentLogs: { id: string; userId: string; userName: string; userRole: string; query: string; intent: string | null; mode: string | null; createdAt: string }[]
  } | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [disableDialog, setDisableDialog] = useState<{ open: boolean; userId: string; userName: string }>({ open: false, userId: '', userName: '' })
  const [disableReason, setDisableReason] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch<typeof data>('/api/ai/usage-logs?action=overview')
      setData(res)
    } catch {
      toast.error('Failed to load AI usage data')
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleResetUser = async (userId: string, userName: string) => {
    setActionLoading(userId)
    try {
      await apiFetch('/api/ai/query-limit', {
        method: 'PUT',
        body: JSON.stringify({ action: 'reset', userId, adminUserId: user.id }),
      })
      toast.success(`Reset query limit for ${userName}`)
      loadData()
    } catch {
      toast.error('Failed to reset limit')
    }
    setActionLoading(null)
  }

  const handleDisableUser = async () => {
    setActionLoading(disableDialog.userId)
    try {
      await apiFetch('/api/ai/query-limit', {
        method: 'PUT',
        body: JSON.stringify({ action: 'disable', userId: disableDialog.userId, adminUserId: user.id, reason: disableReason || 'Disabled by admin' }),
      })
      toast.success(`Disabled AI access for ${disableDialog.userName}`)
      setDisableDialog({ open: false, userId: '', userName: '' })
      setDisableReason('')
      loadData()
    } catch {
      toast.error('Failed to disable AI access')
    }
    setActionLoading(null)
  }

  const handleEnableUser = async (userId: string, userName: string) => {
    setActionLoading(userId)
    try {
      await apiFetch('/api/ai/query-limit', {
        method: 'PUT',
        body: JSON.stringify({ action: 'enable', userId, adminUserId: user.id }),
      })
      toast.success(`Enabled AI access for ${userName}`)
      loadData()
    } catch {
      toast.error('Failed to enable AI access')
    }
    setActionLoading(null)
  }

  const handleResetAll = async () => {
    setActionLoading('all')
    try {
      await apiFetch('/api/ai/query-limit', {
        method: 'PUT',
        body: JSON.stringify({ action: 'reset_all', userId: 'all', adminUserId: user.id }),
      })
      toast.success('Reset all users query limits')
      loadData()
    } catch {
      toast.error('Failed to reset all limits')
    }
    setActionLoading(null)
  }

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: <Activity className="h-4 w-4" /> },
    { key: 'users' as const, label: 'User Management', icon: <Users className="h-4 w-4" /> },
    { key: 'logs' as const, label: 'Query Logs', icon: <FileBarChart className="h-4 w-4" /> },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Banner */}
      <div className="hostel-hero-bg rounded-2xl p-4 sm:p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/60 via-transparent to-[#0a1628]/30" />
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold">AI Usage Control</h2>
                <p className="text-blue-200/80 text-xs sm:text-sm">15 Queries Per Day Limit System</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="btn-green-glow text-white text-xs" onClick={loadData}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
              </Button>
              <Button size="sm" variant="outline" className="text-xs bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={handleResetAll} disabled={actionLoading === 'all'}>
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset All
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard title="Total Users" value={data.stats.totalUsers} icon={<Users className="h-4 w-4" />} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-900/20" />
        <StatCard title="Active Today" value={data.stats.activeToday} icon={<Activity className="h-4 w-4" />} color="text-green-600" bg="bg-green-50 dark:bg-green-900/20" />
        <StatCard title="Queries Today" value={data.stats.totalQueriesToday} icon={<Zap className="h-4 w-4" />} color="text-amber-600" bg="bg-amber-50 dark:bg-amber-900/20" />
        <StatCard title="High Usage" value={data.stats.highUsageUsers} icon={<AlertTriangle className="h-4 w-4" />} color="text-orange-600" bg="bg-orange-50 dark:bg-orange-900/20" />
        <StatCard title="Disabled" value={data.stats.disabledUsers} icon={<ShieldOff className="h-4 w-4" />} color="text-red-600" bg="bg-red-50 dark:bg-red-900/20" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-0">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab.key
                ? 'border-[#1e3a5f] text-[#1e3a5f] dark:text-blue-300 dark:border-blue-400'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* High Usage Users */}
          <Card className="premium-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                High Usage Users (10+ queries today)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.highUsage.length === 0 ? (
                <EmptyState icon={<CheckCircle className="h-8 w-8" />} title="No High Usage Users" description="All users are within normal usage range" />
              ) : (
                <div className="space-y-2">
                  {data.highUsage.map(u => (
                    <div key={u.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9 border border-border/50">
                          <AvatarFallback className={`text-xs font-bold ${u.isDisabled ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                            {u.userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{u.userName}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{u.userEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Progress value={(u.queryCount / 15) * 100} className="w-20 h-2" />
                            <span className="text-xs font-medium">{u.queryCount}/15</span>
                          </div>
                        </div>
                        <Badge className={u.isDisabled ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'} variant="secondary">
                          {u.isDisabled ? 'Disabled' : 'Active'}
                        </Badge>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => handleResetUser(u.userId, u.userName)} disabled={actionLoading === u.userId}>
                            <RotateCcw className="h-3 w-3 mr-0.5" /> Reset
                          </Button>
                          {u.isDisabled ? (
                            <Button size="sm" variant="outline" className="h-7 text-[10px] text-green-600 border-green-200" onClick={() => handleEnableUser(u.userId, u.userName)} disabled={actionLoading === u.userId}>
                              Enable
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" className="h-7 text-[10px] text-red-600 border-red-200" onClick={() => setDisableDialog({ open: true, userId: u.userId, userName: u.userName })}>
                              Disable
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="premium-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-blue-500" />
                Recent AI Queries
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentLogs.length === 0 ? (
                <EmptyState icon={<Zap className="h-8 w-8" />} title="No Queries Yet" description="AI query logs will appear here" />
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                  {data.recentLogs.map(log => (
                    <div key={log.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-gradient-to-br from-[#1e3a5f] to-[#2a5a8f] text-white text-[9px] font-bold">
                          {log.userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{log.userName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{log.query}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {log.mode && (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                            {log.mode}
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <Card className="premium-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-[#1e3a5f]" />
                All Users AI Usage
              </CardTitle>
              <Badge variant="secondary">{data.allUsers.length} users</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Queries Today</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.allUsers.map(u => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className={`text-[9px] font-bold ${u.isDisabled ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-[#1e3a5f]/10 text-[#1e3a5f] dark:bg-[#1e3a5f]/30 dark:text-blue-300'}`}>
                              {u.userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-medium">{u.userName}</p>
                            <p className="text-[10px] text-muted-foreground">{u.userEmail}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">{u.userRole}</Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{u.queryCount} / 15</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={(u.queryCount / 15) * 100} className="w-16 h-1.5" />
                          <span className="text-[10px] text-muted-foreground">{Math.round((u.queryCount / 15) * 100)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${u.isDisabled ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : u.queryCount >= 15 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`} variant="secondary">
                          {u.isDisabled ? 'Disabled' : u.queryCount >= 15 ? 'Limit Reached' : 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-6 text-[9px] px-2" onClick={() => handleResetUser(u.userId, u.userName)} disabled={actionLoading === u.userId}>
                            <RotateCcw className="h-2.5 w-2.5 mr-0.5" /> Reset
                          </Button>
                          {u.isDisabled ? (
                            <Button size="sm" variant="outline" className="h-6 text-[9px] px-2 text-green-600 border-green-200" onClick={() => handleEnableUser(u.userId, u.userName)} disabled={actionLoading === u.userId}>
                              Enable
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" className="h-6 text-[9px] px-2 text-red-600 border-red-200" onClick={() => setDisableDialog({ open: true, userId: u.userId, userName: u.userName })}>
                              Disable
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <Card className="premium-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileBarChart className="h-4 w-4 text-purple-500" />
              Query Log History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentLogs.length === 0 ? (
              <EmptyState icon={<FileBarChart className="h-8 w-8" />} title="No Query Logs" description="AI query logs will appear here when users interact with the AI assistant" />
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                {data.recentLogs.map(log => (
                  <div key={log.id} className="p-3 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-gradient-to-br from-[#1e3a5f] to-[#2a5a8f] text-white text-[8px] font-bold">
                            {log.userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">{log.userName}</span>
                        <Badge variant="secondary" className="text-[9px] px-1 py-0">{log.userRole}</Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/80 ml-8">{log.query}</p>
                    {log.intent && log.mode && (
                      <div className="flex items-center gap-2 ml-8 mt-1">
                        <Badge variant="secondary" className="text-[8px] px-1 py-0">Intent: {log.intent}</Badge>
                        <Badge variant="secondary" className="text-[8px] px-1 py-0">Mode: {log.mode}</Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Disable User Dialog */}
      <Dialog open={disableDialog.open} onOpenChange={(open) => setDisableDialog({ open, userId: '', userName: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldOff className="h-5 w-5 text-red-500" />
              Disable AI Access
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              You are about to disable AI access for <strong>{disableDialog.userName}</strong>. This user will not be able to use the RBH AI Assistant until you re-enable it.
            </p>
            <div className="space-y-2">
              <Label htmlFor="disableReason">Reason (optional)</Label>
              <Textarea
                id="disableReason"
                placeholder="e.g., Excessive usage, misuse of AI, etc."
                value={disableReason}
                onChange={(e) => setDisableReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisableDialog({ open: false, userId: '', userName: '' })}>Cancel</Button>
            <Button variant="destructive" onClick={handleDisableUser} disabled={actionLoading !== null}>
              Disable Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
