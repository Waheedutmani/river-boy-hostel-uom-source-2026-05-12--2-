'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import {
  LayoutDashboard, BedDouble, Building2, Receipt, MessageSquareWarning,
  Wrench, Bell, BookOpen, User, Plus, Eye, Clock, AlertCircle,
  CheckCircle2, Menu, Search, Moon, Sun, LogOut, Home, Shield,
  Phone, Pencil, X, ChevronRight, LogOut as SignOut, MapPin,
  ArrowRightLeft, CalendarDays, FileCheck, PenTool, ArrowUpRight,
  Activity, Sparkles, Zap, TrendingUp, ChevronDown, Lock, Key, ShieldAlert, ShieldCheck, Fingerprint, DollarSign, Download
} from 'lucide-react'
import {
  formatPKR, apiFetch,
  FeeStatusBadge, ComplaintStatusBadge, PriorityBadge, NoticePriorityBadge,
  ApplicationStatusBadge, CategoryBadge, MovementStatusBadge, LeaveReasonBadge,
  ActivityActionBadge, ActivityCategoryBadge, AlertSeverityBadge, AlertTypeBadge,
  PaymentMethodBadge,
  StatCard, ListSkeleton, DashboardSkeleton,
  MONTHS, DEPARTMENTS, COMPLAINT_CATEGORIES, MAINTENANCE_CATEGORIES, NOTICE_CATEGORIES,
  LEAVE_REASONS,
  Breadcrumb, LiveClock, EmptyState,
  type StudentPage, type HostelType, type RoomType, type FeeType,
  type ComplaintType, type NoticeType, type ApplicationType, type MaintenanceType,
  type MovementType, type MovementStats, type ActivityLogType,
} from '@/components/shared-components'
import type { UserType } from '@/app/page'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// Sheet import removed - using manual overlay for mobile sidebar
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SignatureCapture } from '@/components/signature-capture'
import { SmartNotificationBell, NotificationCenter, SmartReminders, CommunicationSimulator } from '@/components/smart-notification-center'
import { StudentVisitors } from '@/components/visitor-management'
import { MobileBottomBar } from '@/components/mobile-bottom-bar'
import { StudentPaymentPortal } from '@/components/student-payment-portal'

// ======================== STUDENT NAV ITEMS ========================
const studentNavItems: { page: StudentPage; label: string; icon: React.ReactNode }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { page: 'my-room', label: 'My Room', icon: <BedDouble className="h-5 w-5" /> },
  { page: 'apply', label: 'Apply for Room', icon: <Building2 className="h-5 w-5" /> },
  { page: 'movements', label: 'Leave & Movement', icon: <ArrowRightLeft className="h-5 w-5" /> },
  { page: 'fees', label: 'My Fees', icon: <Receipt className="h-5 w-5" /> },
  { page: 'complaints', label: 'Complaints', icon: <MessageSquareWarning className="h-5 w-5" /> },
  { page: 'maintenance', label: 'Maintenance', icon: <Wrench className="h-5 w-5" /> },
  { page: 'notices', label: 'Notices', icon: <Bell className="h-5 w-5" /> },
  { page: 'visitors', label: 'Visitors', icon: <Shield className="h-5 w-5" /> },
  { page: 'notifications', label: 'Notifications', icon: <Activity className="h-5 w-5" /> },
  { page: 'reminders', label: 'Reminders', icon: <Clock className="h-5 w-5" /> },
  { page: 'communication', label: 'Communication', icon: <Phone className="h-5 w-5" /> },
  { page: 'rules', label: 'Hostel Rules', icon: <BookOpen className="h-5 w-5" /> },
  { page: 'security', label: 'Security', icon: <Shield className="h-5 w-5" /> },
  { page: 'profile', label: 'My Profile', icon: <User className="h-5 w-5" /> },
]

const pageTitles: Record<StudentPage, string> = {
  dashboard: 'Dashboard', 'my-room': 'My Room', apply: 'Apply for Room',
  fees: 'My Fees & Payments', complaints: 'Complaints', maintenance: 'Maintenance',
  notices: 'Notices', visitors: 'Visitor Management', notifications: 'Notification Center', reminders: 'Smart Reminders',
  communication: 'Communication Center', movements: 'Leave & Movement Register', rules: 'Hostel Rules', security: 'Security & Activity', profile: 'My Profile',
}

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

// ======================== PREMIUM STAT CARD WITH ANIMATION ========================
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
export function StudentPortal({ user, onLogout, onUserUpdate }: { user: UserType; onLogout: () => void; onUserUpdate: (u: UserType) => void }) {
  const [currentPage, setCurrentPage] = useState<StudentPage>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <StudentDashboard user={user} onNavigate={setCurrentPage} />
      case 'my-room': return <StudentMyRoom user={user} />
      case 'apply': return <StudentApplyRoom user={user} />
      case 'fees': return <StudentPaymentPortal user={user} />
      case 'complaints': return <StudentComplaints user={user} />
      case 'maintenance': return <StudentMaintenance user={user} />
      case 'movements': return <StudentMovements user={user} />
      case 'notices': return <StudentNotices />
      case 'visitors': return <StudentVisitors user={user} />
      case 'notifications': return <NotificationCenter userId={user.id} role={user.role} />
      case 'reminders': return <SmartReminders userId={user.id} role={user.role} />
      case 'communication': return <CommunicationSimulator userId={user.id} />
      case 'rules': return <HostelRules />
      case 'security': return <StudentSecurityPage user={user} />
      case 'profile': return <StudentProfile user={user} onUpdate={onUserUpdate} />
      default: return <StudentDashboard user={user} onNavigate={setCurrentPage} />
    }
  }

  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening'

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-[45] lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

      {/* ==================== DESKTOP SIDEBAR (hidden on mobile) ==================== */}
      <aside className="hidden lg:flex w-72 sidebar-gradient text-white flex-col flex-shrink-0">
        {/* Logo Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
                <Home className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse-soft border-2 border-[#1e3a5f]" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight tracking-tight">RBH</h1>
              <p className="text-[10px] text-blue-200/80 font-medium">River Boy Hostel</p>
            </div>
          </div>
          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-[9px] px-1.5 py-0">v2.0</Badge>
        </div>

        {/* User Greeting */}
        <div className="px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-green-400/30">
              <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white text-sm font-bold">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs text-blue-200/70">{greeting},</p>
              <p className="text-sm font-semibold truncate">{user.name}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 overflow-hidden">
          <nav className="p-3 space-y-0.5">
            {studentNavItems.map((item, index) => (
              <button
                key={item.page}
                onClick={() => setCurrentPage(item.page)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                  currentPage === item.page
                    ? 'bg-gradient-to-r from-green-500/20 to-green-500/5 text-white shadow-sm border-l-[3px] border-green-400'
                    : 'text-blue-200/80 hover:bg-white/8 hover:text-white'
                }`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <span className={`transition-transform duration-200 ${currentPage === item.page ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</span>
                <span>{item.label}</span>
                {currentPage === item.page && (
                  <span className="ml-auto w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse-soft" />
                )}
              </button>
            ))}
          </nav>

          {/* Version & Portal Badge */}
          <div className="p-3 mx-3 mb-3 glass-card-dark rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-green-400" />
              <p className="text-xs font-medium text-blue-100">Student Portal</p>
            </div>
            <p className="text-[10px] text-blue-300/60">Final Year Project &bull; UOM &bull; 2026</p>
          </div>
        </ScrollArea>
      </aside>

      {/* ==================== MOBILE SIDEBAR (overlay only when open) ==================== */}
      {sidebarOpen && (
        <aside className="fixed top-0 left-0 z-50 h-full w-72 sidebar-gradient text-white flex flex-col lg:hidden animate-slide-in-left">
          {/* Logo Header with Close */}
          <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
                  <Home className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-base font-bold leading-tight tracking-tight">RBH</h1>
                <p className="text-[10px] text-blue-200/80 font-medium">River Boy Hostel</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-8 w-8 touch-manipulation" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* User Greeting */}
          <div className="px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-green-400/30">
                <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white text-sm font-bold">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs text-blue-200/70">{greeting},</p>
                <p className="text-sm font-semibold truncate">{user.name}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 overflow-hidden">
            <nav className="p-3 space-y-0.5">
              {studentNavItems.map((item) => (
                <button
                  key={item.page}
                  onClick={() => { setCurrentPage(item.page); setSidebarOpen(false) }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group touch-manipulation ${
                    currentPage === item.page
                      ? 'bg-gradient-to-r from-green-500/20 to-green-500/5 text-white shadow-sm border-l-[3px] border-green-400'
                      : 'text-blue-200/80 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  <span className={`transition-transform duration-200 ${currentPage === item.page ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </ScrollArea>
        </aside>
      )}

      {/* ==================== MAIN CONTENT AREA ==================== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ==================== PREMIUM HEADER ==================== */}
        <header className="h-16 glass-card border-b border-border/50 flex items-center justify-between px-4 lg:px-6 shrink-0 z-20">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden hover:bg-[#1e3a5f]/5 touch-manipulation" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-1 h-6 bg-gradient-to-b from-[#1e3a5f] to-green-500 rounded-full" />
              <h2 className="text-lg font-bold text-foreground">{pageTitles[currentPage]}</h2>
            </div>
            <h2 className="text-lg font-semibold sm:hidden">{pageTitles[currentPage]}</h2>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <LiveClock />
            <SmartNotificationBell userId={user.id} role={user.role} onViewAll={() => setCurrentPage('notifications')} />
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="hover:bg-[#1e3a5f]/5">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 hover:bg-[#1e3a5f]/5 px-2">
                  <Avatar className="h-8 w-8 border-2 border-green-400/20">
                    <AvatarFallback className="bg-gradient-to-br from-[#1e3a5f] to-[#2a5a8f] text-white text-sm font-bold">{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium">{user.name}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setCurrentPage('profile')} className="gap-2"><User className="h-4 w-4" />Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrentPage('rules')} className="gap-2"><BookOpen className="h-4 w-4" />Hostel Rules</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-red-600 gap-2"><LogOut className="h-4 w-4" />Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 pb-20 lg:p-6 lg:pb-6 custom-scrollbar">
          <div className="animate-fade-in">{renderPage()}</div>
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
        items={studentNavItems.map(item => ({ key: item.page, label: item.label, icon: item.icon }))}
        activeKey={currentPage}
        onNavigate={(key) => setCurrentPage(key as StudentPage)}
        role="student"
      />
    </div>
  )
}

// ======================== STUDENT DASHBOARD ========================
function StudentDashboard({ user, onNavigate }: { user: UserType; onNavigate: (p: StudentPage) => void }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true)
        const res = await apiFetch<any>(`/api/dashboard?role=student&userId=${user.id}`)
        setData(res)
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    fetchDashboard()
  }, [user.id])

  if (loading || !data) return <DashboardSkeleton />

  const { student, myRoom, myFees, myComplaints, notices, presenceStatus, activeMovement, notifications, activityTimeline, leaveRequestCount, complaintStats, movements } = data

  const presenceColor = presenceStatus === 'Present' ? 'bg-green-500' : presenceStatus === 'Outside' ? 'bg-red-500' : 'bg-amber-500'
  const presenceLabel = presenceStatus === 'Present' ? 'Present in Hostel' : presenceStatus === 'Outside' ? 'Outside Hostel' : 'Late Return Warning'
  const presenceTextColor = presenceStatus === 'Present' ? 'text-green-600 dark:text-green-400' : presenceStatus === 'Outside' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'

  const paidPercent = myFees.total > 0 ? Math.round((myFees.paid / myFees.total) * 100) : 0
  const recentPaidFees = (myFees.breakdown || []).filter((f: FeeType) => f.status === 'Paid').slice(0, 3)

  const timelineIconMap: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    payment: { icon: <Receipt className="h-3.5 w-3.5" />, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
    complaint: { icon: <MessageSquareWarning className="h-3.5 w-3.5" />, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
    movement: { icon: <ArrowRightLeft className="h-3.5 w-3.5" />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    application: { icon: <FileCheck className="h-3.5 w-3.5" />, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  }

  const unreadNotifications = (notifications || []).filter((n: any) => !n.read)

  const quickActions = [
    { title: 'Apply Leave', desc: 'Request leave of absence', icon: <ArrowRightLeft className="h-5 w-5" />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', page: 'movements' as StudentPage },
    { title: 'Pay Fee', desc: 'View and manage fees', icon: <Receipt className="h-5 w-5" />, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', page: 'fees' as StudentPage },
    { title: 'Submit Complaint', desc: 'Report an issue', icon: <MessageSquareWarning className="h-5 w-5" />, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', page: 'complaints' as StudentPage },
    { title: 'View Notices', desc: 'Latest announcements', icon: <Bell className="h-5 w-5" />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', page: 'notices' as StudentPage },
    { title: 'Mark Return', desc: 'Register hostel return', icon: <MapPin className="h-5 w-5" />, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/20', page: 'movements' as StudentPage },
    { title: 'Edit Profile', desc: 'Update personal info', icon: <Pencil className="h-5 w-5" />, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', page: 'profile' as StudentPage },
  ]

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Home' }, { label: 'Dashboard', active: true }]} />

      {/* ===== 1. HERO BANNER WITH STUDENT OVERVIEW ===== */}
      <div className="hostel-hero-bg rounded-2xl p-6 md:p-8 text-white relative overflow-hidden animate-fade-in-up">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
            {/* Profile Avatar */}
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-green-500/25 border-2 border-white/20">
                {student?.name?.charAt(0) || user.name.charAt(0)}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 ${presenceColor} rounded-full border-2 border-[#1e3a5f] animate-pulse-soft`} title={presenceLabel} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{student?.name || user.name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge className="bg-white/15 text-white border-white/20 text-xs">{student?.rollNo || user.email}</Badge>
                <Badge className="bg-white/15 text-white border-white/20 text-xs">{student?.department || 'N/A'}</Badge>
                {student?.status && <Badge className={`${student.status === 'Active' ? 'bg-green-500/30 text-green-200 border-green-400/30' : 'bg-red-500/30 text-red-200 border-red-400/30'} text-xs`}>{student.status}</Badge>}
              </div>
            </div>
            {/* Room Info Badges */}
            {myRoom && (
              <div className="flex items-center gap-2">
                <Badge className="bg-white/15 text-white border-white/20 gap-1.5 text-xs">
                  <BedDouble className="h-3 w-3" /> Room {myRoom.number}
                </Badge>
                <Badge className="bg-white/15 text-white border-white/20 gap-1.5 text-xs">
                  <Building2 className="h-3 w-3" /> Floor {myRoom.floor}
                </Badge>
              </div>
            )}
          </div>
          <p className="text-blue-300/70 text-sm max-w-md">Manage your room, fees, complaints, leave requests and more from your personalized dashboard.</p>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <Button onClick={() => onNavigate('apply')} className="btn-green-glow text-white gap-2 h-9 text-sm">
              <Building2 className="h-4 w-4" /> Apply for Room
            </Button>
            <Button onClick={() => onNavigate('movements')} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-2 h-9 text-sm">
              <ArrowRightLeft className="h-4 w-4" /> Leave Request
            </Button>
          </div>
        </div>
      </div>

      {/* ===== 2. SIX ANIMATED STAT CARDS ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 stagger-children">
        <AnimatedStatCard title="Current Hostel Fee" value={formatPKR(myFees.total)} icon={<Receipt className="h-6 w-6" />} color="text-[#1e3a5f]" bg="bg-blue-50 dark:bg-blue-900/20" isCurrency numericValue={myFees.total} />
        <AnimatedStatCard title="Pending Dues" value={formatPKR(myFees.pending)} icon={<AlertCircle className="h-6 w-6" />} color="text-amber-600" bg="bg-amber-50 dark:bg-amber-900/20" isCurrency numericValue={myFees.pending} />
        <AnimatedStatCard title="Leave Requests" value={leaveRequestCount} icon={<ArrowRightLeft className="h-6 w-6" />} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-900/20" />
        <AnimatedStatCard title="Complaint Status" value={complaintStats.total} icon={<MessageSquareWarning className="h-6 w-6" />} color="text-red-600" bg="bg-red-50 dark:bg-red-900/20" />
        <AnimatedStatCard title="Attendance" value={presenceStatus === 'Present' ? 'Present' : presenceStatus === 'Outside' ? 'Outside' : 'Late'} icon={<Activity className="h-6 w-6" />} color={presenceStatus === 'Present' ? 'text-green-600' : presenceStatus === 'Outside' ? 'text-red-600' : 'text-amber-600'} bg={presenceStatus === 'Present' ? 'bg-green-50 dark:bg-green-900/20' : presenceStatus === 'Outside' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-amber-50 dark:bg-amber-900/20'} />
        <AnimatedStatCard title="Upcoming Notices" value={notices?.length || 0} icon={<Bell className="h-6 w-6" />} color="text-green-600" bg="bg-green-50 dark:bg-green-900/20" />
      </div>

      {/* ===== 3. PRESENCE STATUS + FEE SUMMARY (2-COLUMN) ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-children">
        {/* Presence Status Card */}
        <div className="premium-card p-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-[#1e3a5f]/5 dark:bg-[#1e3a5f]/20 rounded-lg">
              <MapPin className="h-4 w-4 text-[#1e3a5f]" />
            </div>
            <h3 className="font-semibold">Presence Status</h3>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-4 h-4 ${presenceColor} rounded-full animate-pulse-soft`} />
            <span className={`text-lg font-bold ${presenceTextColor}`}>{presenceLabel}</span>
          </div>
          {activeMovement && presenceStatus === 'Outside' && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl">
              <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">Active Movement</p>
              <div className="space-y-1 text-xs text-red-600/80 dark:text-red-400/80">
                <p><span className="font-medium">Reason:</span> {activeMovement.reason}</p>
                {activeMovement.expectedReturnDate && (
                  <p><span className="font-medium">Expected Return:</span> {new Date(activeMovement.expectedReturnDate).toLocaleDateString()}</p>
                )}
                <p><span className="font-medium">Status:</span> {activeMovement.status}</p>
              </div>
            </div>
          )}
          {presenceStatus === 'Late Return' && (
            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm font-medium">Late Return Warning</p>
              </div>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">Your return is overdue. Please mark your return immediately.</p>
              <Button size="sm" className="mt-2 h-7 text-xs btn-primary-glow text-white" onClick={() => onNavigate('movements')}>Mark Return</Button>
            </div>
          )}
          {presenceStatus === 'Present' && (
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-xl">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle2 className="h-4 w-4" />
                <p className="text-sm font-medium">You are currently in the hostel</p>
              </div>
            </div>
          )}
        </div>

        {/* Fee Summary Card */}
        <div className="premium-card p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#1e3a5f]/5 dark:bg-[#1e3a5f]/20 rounded-lg">
                <TrendingUp className="h-4 w-4 text-[#1e3a5f]" />
              </div>
              <h3 className="font-semibold">Fee Summary</h3>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => onNavigate('fees')}>
              View All <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Fee</span>
              <span className="font-bold text-base">{formatPKR(myFees.total)}</span>
            </div>
            {/* Animated progress bar */}
            <div className="premium-progress h-3">
              <div className="premium-progress-bar bg-gradient-to-r from-green-500 to-green-400" style={{ width: `${paidPercent}%`, transition: 'width 1s ease-in-out' }} />
            </div>
            <p className="text-xs text-muted-foreground">{paidPercent}% paid</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-xl">
                <p className="text-xs text-muted-foreground">Paid</p>
                <p className="font-bold text-green-600 dark:text-green-400 text-sm">{formatPKR(myFees.paid)}</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl">
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="font-bold text-amber-600 dark:text-amber-400 text-sm">{formatPKR(myFees.pending)}</p>
              </div>
            </div>
            {myFees.overdue > 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-red-700 dark:text-red-300">Overdue Amount</p>
                  <p className="font-bold text-red-600 dark:text-red-400 text-sm">{formatPKR(myFees.overdue)}</p>
                </div>
              </div>
            )}
            {/* Recent 3 payments mini-timeline */}
            {recentPaidFees.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">Recent Payments</p>
                <div className="space-y-2">
                  {recentPaidFees.map((f: FeeType) => (
                    <div key={f.id} className="flex items-center gap-2 text-xs">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full shrink-0" />
                      <span className="text-muted-foreground flex-1 truncate">{f.feeType} &mdash; {f.month} {f.year}</span>
                      <span className="font-medium text-green-600 dark:text-green-400">{formatPKR(f.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== 4. QUICK ACTION BUTTONS (6-BUTTON GRID) ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 stagger-children">
        {quickActions.map((action) => (
          <button
            key={action.title}
            onClick={() => onNavigate(action.page)}
            className="premium-card p-4 text-center card-hover group transition-all duration-200 hover:shadow-md"
          >
            <div className={`mx-auto w-10 h-10 ${action.bg} rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200`}>
              <span className={action.color}>{action.icon}</span>
            </div>
            <h4 className="font-medium text-xs sm:text-sm">{action.title}</h4>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{action.desc}</p>
          </button>
        ))}
      </div>

      {/* ===== 5. ACTIVITY TIMELINE + NOTIFICATIONS (2-COLUMN) ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 stagger-children">
        {/* Activity Timeline (wider) */}
        <div className="lg:col-span-3 premium-card p-0 overflow-hidden animate-fade-in">
          <div className="p-5 border-b border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#1e3a5f]/5 dark:bg-[#1e3a5f]/20 rounded-lg">
                <Activity className="h-4 w-4 text-[#1e3a5f]" />
              </div>
              <h3 className="font-semibold">Activity Timeline</h3>
            </div>
          </div>
          <div className="p-4 max-h-96 overflow-y-auto custom-scrollbar">
            {!activityTimeline || activityTimeline.length === 0 ? (
              <div className="py-8 text-center">
                <Activity className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border/60" />
                <div className="space-y-4">
                  {(activityTimeline as any[]).slice(0, 8).map((item, idx) => {
                    const config = timelineIconMap[item.type] || timelineIconMap.application
                    return (
                      <div key={item.id || idx} className="flex items-start gap-3 relative animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                        <div className={`w-[30px] h-[30px] rounded-full ${config.bg} flex items-center justify-center shrink-0 z-10 border-2 border-background`}>
                          <span className={config.color}>{config.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                          <p className="text-[10px] text-muted-foreground/70 mt-0.5">{new Date(item.date).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notifications Panel */}
        <div className="lg:col-span-2 premium-card p-0 overflow-hidden animate-fade-in">
          <div className="p-5 border-b border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <Bell className="h-4 w-4 text-amber-600" />
                </div>
                {unreadNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadNotifications.length}</span>
                )}
              </div>
              <h3 className="font-semibold">Notifications</h3>
            </div>
          </div>
          <div className="p-2 max-h-96 overflow-y-auto custom-scrollbar">
            {(!notifications || notifications.length === 0) ? (
              <div className="py-8 text-center">
                <Bell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No notifications</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {(notifications as any[]).slice(0, 8).map((n: any, idx: number) => (
                  <div key={n.id || idx} className="flex items-start gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-muted-foreground/30' : n.type === 'notice' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm truncate ${n.read ? 'text-muted-foreground' : 'font-medium'}`}>{n.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">{new Date(n.createdAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== 6. RECENT NOTICES + COMPLAINT STATUS (2-COLUMN) ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-children">
        {/* Recent Notices */}
        <div className="premium-card p-0 overflow-hidden animate-fade-in">
          <div className="p-5 border-b border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#1e3a5f]/5 dark:bg-[#1e3a5f]/20 rounded-lg">
                <Bell className="h-4 w-4 text-[#1e3a5f]" />
              </div>
              <h3 className="font-semibold">Recent Notices</h3>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => onNavigate('notices')}>
              View All <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          <div className="p-2">
            {(!notices || notices.length === 0) ? (
              <div className="py-8 text-center">
                <Bell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No notices yet</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-72 overflow-y-auto custom-scrollbar">
                {(notices as NoticeType[]).slice(0, 5).map(n => (
                  <div key={n.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.category} &bull; {new Date(n.createdAt).toLocaleDateString()}</p>
                    </div>
                    <NoticePriorityBadge priority={n.priority} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Complaint Status Summary */}
        <div className="premium-card p-0 overflow-hidden animate-fade-in">
          <div className="p-5 border-b border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <MessageSquareWarning className="h-4 w-4 text-red-600" />
              </div>
              <h3 className="font-semibold">Complaint Status</h3>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => onNavigate('complaints')}>
              View All <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          <div className="p-4">
            {/* 3 mini stat cards */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl text-center">
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{complaintStats.open}</p>
                <p className="text-[10px] text-muted-foreground font-medium">Open</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl text-center">
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{complaintStats.inProgress}</p>
                <p className="text-[10px] text-muted-foreground font-medium">In Progress</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-xl text-center">
                <p className="text-lg font-bold text-green-600 dark:text-green-400">{complaintStats.resolved}</p>
                <p className="text-[10px] text-muted-foreground font-medium">Resolved</p>
              </div>
            </div>
            {/* Latest 3 complaints */}
            {(!myComplaints || myComplaints.length === 0) ? (
              <div className="py-4 text-center">
                <p className="text-sm text-muted-foreground">No complaints filed</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {(myComplaints as ComplaintType[]).slice(0, 3).map(c => (
                  <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.category}</p>
                    </div>
                    <ComplaintStatusBadge status={c.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== 7. ROOM INFO CARD (if room assigned) ===== */}
      {myRoom && (
        <div className="premium-card p-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-[#1e3a5f]/5 dark:bg-[#1e3a5f]/20 rounded-lg">
              <BedDouble className="h-4 w-4 text-[#1e3a5f]" />
            </div>
            <h3 className="font-semibold">My Room</h3>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs ml-auto">Assigned</Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/10 dark:to-blue-800/5 rounded-xl text-center">
              <BedDouble className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Room No</p>
              <p className="font-bold text-sm">{myRoom.number}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/10 dark:to-green-800/5 rounded-xl text-center">
              <Building2 className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Floor</p>
              <p className="font-bold text-sm">{myRoom.floor}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/10 dark:to-purple-800/5 rounded-xl text-center">
              <User className="h-5 w-5 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Capacity</p>
              <p className="font-bold text-sm">{myRoom.capacity} Seater</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/10 dark:to-amber-800/5 rounded-xl text-center">
              <Home className="h-5 w-5 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Hostel</p>
              <p className="font-bold text-sm truncate">{myRoom.hostel || '-'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ======================== MY ROOM ========================
function StudentMyRoom({ user }: { user: UserType }) {
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true)
        const data = await apiFetch<{ students: any[] }>('/api/students')
        setStudent(data.students.find((s: any) => s.userId === user.id) || null)
      } catch { toast.error('Failed to load room info') }
      finally { setLoading(false) }
    }
    fetch()
  }, [user.id])

  if (loading) return <ListSkeleton />

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Home' }, { label: 'My Room', active: true }]} />

      {/* Hero Banner */}
      <div className="hostel-interior-bg rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 animate-float">
              <BedDouble className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">My Room</h2>
              <p className="text-blue-200/80 mt-0.5 text-sm">View your room assignment details</p>
            </div>
          </div>
        </div>
      </div>

      {student?.room ? (
        <div className="glass-card-glow rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="p-4 bg-gradient-to-br from-[#1e3a5f]/10 to-green-500/5 dark:from-[#1e3a5f]/20 dark:to-green-500/10 rounded-2xl">
              <BedDouble className="h-10 w-10 text-[#1e3a5f] dark:text-blue-300" />
            </div>
            <div className="space-y-4 flex-1 w-full">
              <div>
                <h3 className="text-2xl font-bold">Room {student.room.number}</h3>
                <p className="text-muted-foreground">{student.room.hostel?.name || 'Hostel'}</p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="premium-card p-3">
                  <span className="text-muted-foreground text-xs">Room Number</span>
                  <p className="font-bold mt-1">{student.room.number}</p>
                </div>
                <div className="premium-card p-3">
                  <span className="text-muted-foreground text-xs">Hostel</span>
                  <p className="font-bold mt-1">{student.room.hostel?.name || '-'}</p>
                </div>
                <div className="premium-card p-3">
                  <span className="text-muted-foreground text-xs">Floor</span>
                  <p className="font-bold mt-1">{student.room.floor || '-'}</p>
                </div>
                <div className="premium-card p-3">
                  <span className="text-muted-foreground text-xs">Capacity</span>
                  <p className="font-bold mt-1">{student.room.capacity || '-'} seater</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Assigned</Badge>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<BedDouble className="h-8 w-8" />}
          title="No Room Assigned"
          description="You haven't been assigned a room yet. Go to 'Apply for Room' to submit your application."
        />
      )}
    </div>
  )
}

// ======================== APPLY FOR ROOM ========================
function StudentApplyRoom({ user }: { user: UserType }) {
  const [hostels, setHostels] = useState<HostelType[]>([])
  const [rooms, setRooms] = useState<RoomType[]>([])
  const [applications, setApplications] = useState<ApplicationType[]>([])
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ hostelId: '', preferredRoom: '', message: '' })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [hstls, rms, apps, students] = await Promise.all([
        apiFetch<{ hostels: HostelType[] }>('/api/hostels'),
        apiFetch<{ rooms: RoomType[] }>('/api/rooms'),
        apiFetch<{ applications: ApplicationType[] }>('/api/applications'),
        apiFetch<{ students: any[] }>('/api/students'),
      ])
      setHostels(hstls.hostels); setRooms(rms.rooms); setApplications(apps.applications)
      const me = students.students.find((s: any) => s.userId === user.id) || null
      setStudent(me)
      if (hstls.hostels.length > 0) setForm(f => ({ ...f, hostelId: hstls.hostels[0].id }))
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }, [user.id])

  useEffect(() => { fetchData() }, [fetchData])

  const myApps = applications.filter(a => a.studentId === student?.id)

  const handleSubmit = async () => {
    if (!form.hostelId || !student) { toast.error('Please select a hostel'); return }
    try {
      setSaving(true)
      await apiFetch('/api/applications', { method: 'POST', body: JSON.stringify({ studentId: student.id, hostelId: form.hostelId, preferredRoom: form.preferredRoom || undefined, message: form.message || undefined }) })
      toast.success('Application submitted'); setDialogOpen(false); fetchData()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to submit') }
    finally { setSaving(false) }
  }

  if (loading) return <ListSkeleton />

  const availableHostels = hostels.map(h => ({ ...h, availableRooms: rooms.filter(r => r.hostelId === h.id && (r._count?.students || 0) < r.capacity).length }))

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Home' }, { label: 'Apply for Room', active: true }]} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Apply for Room</h2>
          <p className="text-muted-foreground text-sm">Submit and track room applications</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2 btn-primary-glow text-white"><Plus className="h-4 w-4" /> New Application</Button>
      </div>

      {/* Available Hostels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        {availableHostels.map(h => (
          <div key={h.id} className="premium-card p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold">{h.name}</h3>
                <Badge variant="outline" className="mt-1">{h.type}</Badge>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{h.availableRooms}</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BedDouble className="h-3.5 w-3.5" />
              <span>Total Rooms: {h.totalRooms}</span>
            </div>
          </div>
        ))}
      </div>

      {/* My Applications */}
      <div>
        <h3 className="text-lg font-semibold mb-3">My Applications</h3>
        {myApps.length === 0 ? (
          <EmptyState icon={<Building2 className="h-8 w-8" />} title="No Applications" description="You haven't submitted any room applications yet." />
        ) : (
          <div className="space-y-3 stagger-children">{myApps.map(a => (
            <div key={a.id} className="premium-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{a.hostel?.name || '-'}</h4>
                  {a.preferredRoom && <p className="text-sm text-muted-foreground">Preferred: {a.preferredRoom}</p>}
                  {a.message && <p className="text-sm text-muted-foreground italic">&quot;{a.message}&quot;</p>}
                  {a.adminRemark && <p className="text-sm mt-1"><span className="text-muted-foreground">Admin:</span> {a.adminRemark}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{new Date(a.createdAt).toLocaleDateString()}</p>
                </div>
                <ApplicationStatusBadge status={a.status} />
              </div>
            </div>
          ))}</div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="animate-bounce-in">
          <DialogHeader><DialogTitle>New Room Application</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="premium-input"><Label>Hostel *</Label><Select value={form.hostelId} onValueChange={v => setForm(f => ({ ...f, hostelId: v }))}><SelectTrigger><SelectValue placeholder="Select hostel" /></SelectTrigger><SelectContent>{hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="premium-input"><Label>Preferred Room (optional)</Label><Input value={form.preferredRoom} onChange={e => setForm(f => ({ ...f, preferredRoom: e.target.value }))} placeholder="e.g., 101" /></div>
            <div className="premium-input"><Label>Message (optional)</Label><Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Any special request..." rows={3} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSubmit} disabled={saving} className="btn-primary-glow text-white">{saving ? 'Submitting...' : 'Submit'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ======================== MY FEES ========================
// StudentPaymentPortal is now imported from @/components/student-payment-portal

// ======================== COMPLAINTS ========================
function StudentComplaints({ user }: { user: UserType }) {
  const [complaints, setComplaints] = useState<ComplaintType[]>([])
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selected, setSelected] = useState<ComplaintType | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', category: 'Plumbing', priority: 'Medium' })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [comp, students] = await Promise.all([apiFetch<{ complaints: ComplaintType[] }>('/api/complaints'), apiFetch<{ students: any[] }>('/api/students')])
      const me = students.students.find((s: any) => s.userId === user.id) || null
      setStudent(me); setComplaints(comp.complaints.filter(c => c.studentId === me?.id))
    } catch { toast.error('Failed to load complaints') }
    finally { setLoading(false) }
  }, [user.id])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim() || !student) { toast.error('Title and description are required'); return }
    try {
      setSaving(true)
      await apiFetch('/api/complaints', { method: 'POST', body: JSON.stringify({ studentId: student.id, ...form }) })
      toast.success('Complaint submitted'); setDialogOpen(false); setForm({ title: '', description: '', category: 'Plumbing', priority: 'Medium' }); fetchData()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to submit') }
    finally { setSaving(false) }
  }

  if (loading) return <ListSkeleton />

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Home' }, { label: 'Complaints', active: true }]} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Complaints</h2>
          <p className="text-muted-foreground text-sm">Submit and track your complaints</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2 btn-primary-glow text-white"><Plus className="h-4 w-4" /> New Complaint</Button>
      </div>

      {complaints.length === 0 ? (
        <EmptyState icon={<MessageSquareWarning className="h-8 w-8" />} title="No Complaints" description="You haven't filed any complaints yet. Click the button above to submit one." />
      ) : (
        <div className="space-y-3 stagger-children">{complaints.map(c => (
          <div key={c.id} className="premium-card p-4 cursor-pointer" onClick={() => { setSelected(c); setViewDialogOpen(true) }}>
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <h3 className="font-semibold">{c.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{c.description}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
                <ComplaintStatusBadge status={c.status} />
                <PriorityBadge priority={c.priority} />
              </div>
            </div>
          </div>
        ))}</div>
      )}

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="animate-bounce-in">
          <DialogHeader><DialogTitle>Complaint Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selected.title}</h3>
                <p className="text-sm mt-2">{selected.description}</p>
                <div className="flex gap-2 mt-3 flex-wrap"><CategoryBadge category={selected.category} /><PriorityBadge priority={selected.priority} /><ComplaintStatusBadge status={selected.status} /></div>
              </div>
              {selected.adminReply && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">Admin Reply:</p>
                  <p className="text-sm">{selected.adminReply}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">Filed: {new Date(selected.createdAt).toLocaleDateString()}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Submit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="animate-bounce-in">
          <DialogHeader><DialogTitle>Submit Complaint</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="premium-input"><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Brief title" /></div>
            <div className="premium-input"><Label>Description *</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the issue..." rows={4} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="premium-input"><Label>Category</Label><Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COMPLAINT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div className="premium-input"><Label>Priority</Label><Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem></SelectContent></Select></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSubmit} disabled={saving} className="btn-primary-glow text-white">{saving ? 'Submitting...' : 'Submit'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ======================== MAINTENANCE ========================
function StudentMaintenance({ user }: { user: UserType }) {
  const [requests, setRequests] = useState<MaintenanceType[]>([])
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', category: 'Plumbing', priority: 'Medium', roomId: '' })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [maint, students] = await Promise.all([apiFetch<{ maintenanceRequests: MaintenanceType[] }>('/api/maintenance'), apiFetch<{ students: any[] }>('/api/students')])
      const me = students.students.find((s: any) => s.userId === user.id) || null
      setStudent(me)
      if (me?.roomId) setForm(f => ({ ...f, roomId: me.roomId }))
      setRequests(maint.maintenanceRequests.filter(m => m.studentId === me?.id))
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [user.id])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim() || !student || !form.roomId) { toast.error('All fields are required'); return }
    try {
      setSaving(true)
      await apiFetch('/api/maintenance', { method: 'POST', body: JSON.stringify({ studentId: student.id, ...form }) })
      toast.success('Request submitted'); setDialogOpen(false); setForm(f => ({ ...f, title: '', description: '' })); fetchData()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  if (loading) return <ListSkeleton />

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Home' }, { label: 'Maintenance', active: true }]} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Maintenance</h2>
          <p className="text-muted-foreground text-sm">Submit and track maintenance requests</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2 btn-primary-glow text-white" disabled={!student?.roomId}><Plus className="h-4 w-4" /> New Request</Button>
      </div>

      {!student?.roomId && (
        <div className="premium-card p-4 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-400">You need a room assignment to submit maintenance requests.</p>
          </div>
        </div>
      )}

      {requests.length === 0 ? (
        <EmptyState icon={<Wrench className="h-8 w-8" />} title="No Maintenance Requests" description="You haven't submitted any maintenance requests yet." />
      ) : (
        <div className="space-y-3 stagger-children">{requests.map(r => (
          <div key={r.id} className="premium-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{r.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">{r.description}</p>
                <div className="flex gap-2 mt-2"><CategoryBadge category={r.category} /><PriorityBadge priority={r.priority} /></div>
              </div>
              <Badge variant="outline" className="shrink-0 ml-3">{r.status}</Badge>
            </div>
          </div>
        ))}</div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="animate-bounce-in">
          <DialogHeader><DialogTitle>Submit Maintenance Request</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="premium-input"><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Brief title" /></div>
            <div className="premium-input"><Label>Description *</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Describe the issue..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="premium-input"><Label>Category</Label><Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{MAINTENANCE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div className="premium-input"><Label>Priority</Label><Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem></SelectContent></Select></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSubmit} disabled={saving} className="btn-primary-glow text-white">{saving ? 'Submitting...' : 'Submit'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ======================== NOTICES ========================
function StudentNotices() {
  const [notices, setNotices] = useState<NoticeType[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedNotice, setSelectedNotice] = useState<NoticeType | null>(null)

  useEffect(() => {
    async function fetch() {
      try { setLoading(true); const data = await apiFetch<{ notices: NoticeType[] }>('/api/notices'); setNotices(data.notices) }
      catch { toast.error('Failed to load notices') }
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  const filtered = notices.filter(n => categoryFilter === 'all' || n.category === categoryFilter)

  if (loading) return <ListSkeleton />

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Home' }, { label: 'Notices', active: true }]} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Notices</h2>
          <p className="text-muted-foreground text-sm">View hostel notices and announcements</p>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-44 premium-input"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Categories</SelectItem>{NOTICE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Bell className="h-8 w-8" />} title="No Notices" description="There are no notices to display at this time." />
      ) : (
        <div className="space-y-3 stagger-children">{filtered.map(n => (
          <div key={n.id} className="premium-card p-4 cursor-pointer" onClick={() => setSelectedNotice(n)}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{n.title}</h3>
                  <NoticePriorityBadge priority={n.priority} />
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{n.content}</p>
                <div className="flex items-center gap-2 mt-2">
                  <CategoryBadge category={n.category} />
                  <span className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}</div>
      )}

      <Dialog open={!!selectedNotice} onOpenChange={() => setSelectedNotice(null)}>
        <DialogContent className="animate-bounce-in">
          <DialogHeader><DialogTitle>{selectedNotice?.title}</DialogTitle></DialogHeader>
          {selectedNotice && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap"><CategoryBadge category={selectedNotice.category} /><NoticePriorityBadge priority={selectedNotice.priority} /></div>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{selectedNotice.content}</p>
              <p className="text-xs text-muted-foreground">{new Date(selectedNotice.createdAt).toLocaleDateString()}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ======================== HOSTEL RULES ========================
function HostelRules() {
  const ruleSections = [
    { title: 'Timing Rules', icon: <Clock className="h-5 w-5" />, rules: ['Main gate closes at 10:00 PM sharp. Late entry requires warden permission.', 'Students must return to the hostel before 10:00 PM.', 'Silence hours: 11:00 PM to 6:00 AM.', 'Weekend curfew extended to 11:00 PM on Fridays and Saturdays.'] },
    { title: 'Visitor Rules', icon: <Shield className="h-5 w-5" />, rules: ['Visitors must register at the security desk with valid ID.', 'Visiting hours: 10:00 AM to 6:00 PM only.', 'No overnight guests allowed without prior written approval from warden.', 'Visitors are not allowed in rooms without the resident being present.'] },
    { title: 'Room Maintenance', icon: <Wrench className="h-5 w-5" />, rules: ['Keep rooms clean and tidy at all times.', 'Report any damage or maintenance issues immediately.', 'Do not make structural changes to the room.', 'Room inspection may be conducted with 24-hour notice.', 'Students are responsible for any damage to hostel property.'] },
    { title: 'Mess Rules', icon: <Home className="h-5 w-5" />, rules: ['Mess timings: Breakfast 7-9 AM, Lunch 12-2 PM, Dinner 7-9 PM.', 'Wastage of food is strictly prohibited.', 'Maintain cleanliness in the dining area.', 'Guest meals require prior arrangement with the mess manager.'] },
    { title: 'Emergency Procedures', icon: <AlertCircle className="h-5 w-5" />, rules: ['Know the location of fire extinguishers and emergency exits.', 'In case of fire, evacuate immediately and assemble at the designated area.', 'Report any emergency to the warden or security immediately.', 'Keep emergency contact numbers saved in your phone.'] },
    { title: 'Contact Numbers', icon: <Phone className="h-5 w-5" />, rules: ['Warden Office: 0945-XXXXXX', 'Security Desk: 0945-XXXXXX', 'Emergency: 1122', 'University Admin: 0945-XXXXXX', 'Maintenance Cell: 0945-XXXXXX'] },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Home' }, { label: 'Hostel Rules', active: true }]} />

      <div>
        <h2 className="text-2xl font-bold">Hostel Rules</h2>
        <p className="text-muted-foreground text-sm">River Boy Hostel UOM &mdash; Rules and Regulations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
        {ruleSections.map((section, i) => (
          <div key={i} className="premium-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-[#1e3a5f]/5 dark:bg-[#1e3a5f]/20 rounded-lg text-[#1e3a5f] dark:text-blue-300">{section.icon}</div>
              <h3 className="text-lg font-semibold text-[#1e3a5f] dark:text-blue-300">{section.title}</h3>
            </div>
            <ul className="space-y-2.5">
              {section.rules.map((rule, j) => (
                <li key={j} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 mt-1 shrink-0">&#8226;</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

// ======================== STUDENT PROFILE ========================
function StudentProfile({ user, onUpdate }: { user: UserType; onUpdate: (u: UserType) => void }) {
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', guardianName: '', guardianPhone: '', address: '', bloodGroup: '', emergencyContact: '' })

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true)
        const data = await apiFetch<{ students: any[] }>('/api/students')
        const me = data.students.find((s: any) => s.userId === user.id) || null
        setStudent(me)
        if (me) {
          setForm({ name: user.name, phone: user.phone || '', guardianName: me.guardianName || '', guardianPhone: me.guardianPhone || '', address: me.address || '', bloodGroup: me.bloodGroup || '', emergencyContact: me.emergencyContact || '' })
        }
      } catch { toast.error('Failed to load profile') }
      finally { setLoading(false) }
    }
    fetch()
  }, [user.id, user.name, user.phone])

  const handleSave = async () => {
    try {
      setSaving(true)
      await apiFetch(`/api/auth/${user.id}`, { method: 'PUT', body: JSON.stringify({ name: form.name, phone: form.phone }) })
      if (student) {
        await apiFetch(`/api/students/${student.id}`, { method: 'PUT', body: JSON.stringify({ guardianName: form.guardianName, guardianPhone: form.guardianPhone, address: form.address, bloodGroup: form.bloodGroup, emergencyContact: form.emergencyContact }) })
      }
      toast.success('Profile updated')
      onUpdate({ ...user, name: form.name, phone: form.phone })
      setEditing(false)
    } catch { toast.error('Failed to update profile') }
    finally { setSaving(false) }
  }

  if (loading) return <ListSkeleton />

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Home' }, { label: 'My Profile', active: true }]} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Profile</h2>
          <p className="text-muted-foreground text-sm">View and edit your personal information</p>
        </div>
        <Button onClick={() => setEditing(!editing)} variant={editing ? 'outline' : 'default'} className={editing ? '' : 'btn-primary-glow text-white'}>
          {editing ? 'Cancel' : <><Pencil className="h-4 w-4 mr-2" />Edit Profile</>}
        </Button>
      </div>

      <div className="glass-card-glow rounded-2xl p-6">
        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border/40">
          <Avatar className="h-20 w-20 border-4 border-green-400/20 shadow-lg shadow-green-500/10">
            <AvatarFallback className="bg-gradient-to-br from-[#1e3a5f] to-green-600 text-white text-2xl font-bold">{user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-bold">{user.name}</h3>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">{student?.rollNo || '-'}</Badge>
              <Badge variant="outline" className="text-xs">{student?.department || '-'}</Badge>
              <Badge variant="outline" className="text-xs">Semester {student?.semester || '-'}</Badge>
            </div>
          </div>
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="premium-input"><Label>Full Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="premium-input"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div className="premium-input"><Label>Guardian Name</Label><Input value={form.guardianName} onChange={e => setForm(f => ({ ...f, guardianName: e.target.value }))} /></div>
              <div className="premium-input"><Label>Guardian Phone</Label><Input value={form.guardianPhone} onChange={e => setForm(f => ({ ...f, guardianPhone: e.target.value }))} /></div>
              <div className="premium-input"><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
              <div className="premium-input"><Label>Blood Group</Label><Input value={form.bloodGroup} onChange={e => setForm(f => ({ ...f, bloodGroup: e.target.value }))} /></div>
              <div className="premium-input"><Label>Emergency Contact</Label><Input value={form.emergencyContact} onChange={e => setForm(f => ({ ...f, emergencyContact: e.target.value }))} /></div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="btn-primary-glow text-white">{saving ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Roll No', value: student?.rollNo || '-' },
              { label: 'Department', value: student?.department || '-' },
              { label: 'Semester', value: student?.semester || '-' },
              { label: 'Room', value: student?.room?.number || 'Not Assigned' },
              { label: 'Guardian', value: student?.guardianName || '-' },
              { label: 'Guardian Phone', value: student?.guardianPhone || '-' },
              { label: 'Address', value: student?.address || '-' },
              { label: 'Blood Group', value: student?.bloodGroup || '-' },
              { label: 'Emergency Contact', value: student?.emergencyContact || '-' },
            ].map(item => (
              <div key={item.label} className="premium-card p-3">
                <span className="text-muted-foreground text-xs">{item.label}</span>
                <p className="font-medium mt-0.5">{item.value}</p>
              </div>
            ))}
            <div className="premium-card p-3">
              <span className="text-muted-foreground text-xs">Status</span>
              <p className="mt-0.5"><Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">{student?.status || 'Active'}</Badge></p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ======================== LEAVE & MOVEMENT REGISTER ========================
function StudentMovements({ user }: { user: UserType }) {
  const [movements, setMovements] = useState<MovementType[]>([])
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedMovement, setSelectedMovement] = useState<MovementType | null>(null)
  const [saving, setSaving] = useState(false)
  const [returnSignature, setReturnSignature] = useState<string | null>(null)
  const [departureSignature, setDepartureSignature] = useState<string | null>(null)
  const [form, setForm] = useState({
    reason: 'Going Home',
    departureDate: '',
    expectedReturnDate: '',
    destination: '',
    guardianContact: '',
    notes: '',
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      let studentId = user.student?.id || null
      let me: any = user.student ? { ...user.student } : null

      if (!studentId) {
        try {
          const students = await apiFetch<{ students: any[] }>('/api/students')
          me = students.students.find((s: any) => s.userId === user.id) || null
          studentId = me?.id || null
        } catch {
          // Students fetch failed, continue without it
        }
      }

      setStudent(me)

      if (studentId) {
        const movData = await apiFetch<{ movements: MovementType[]; stats: MovementStats }>(`/api/movements?studentId=${studentId}`)
        setMovements(movData.movements)
      } else {
        const movData = await apiFetch<{ movements: MovementType[]; stats: MovementStats }>('/api/movements')
        setMovements(movData.movements)
      }
    } catch { toast.error('Failed to load movement records') }
    finally { setLoading(false) }
  }, [user.id, user.student])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (dialogOpen) {
      const now = new Date()
      const depDate = new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16)
      const retDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
      setForm(f => ({ ...f, departureDate: depDate, expectedReturnDate: retDate }))
      setDepartureSignature(null)
    }
  }, [dialogOpen])

  const handleSubmit = async () => {
    if (!form.reason || !form.departureDate || !form.expectedReturnDate || !student) {
      toast.error('Reason, departure date, and expected return date are required')
      return
    }
    if (new Date(form.expectedReturnDate) <= new Date(form.departureDate)) {
      toast.error('Expected return date must be after departure date')
      return
    }
    if (!departureSignature) {
      toast.error('Digital signature is required before submitting')
      return
    }
    try {
      setSaving(true)
      await apiFetch('/api/movements', {
        method: 'POST',
        body: JSON.stringify({
          studentId: student.id,
          reason: form.reason,
          departureDate: form.departureDate,
          expectedReturnDate: form.expectedReturnDate,
          destination: form.destination || undefined,
          guardianContact: form.guardianContact || undefined,
          notes: form.notes || undefined,
          departureSignature,
        }),
      })
      toast.success('Leave request submitted successfully')
      setDialogOpen(false)
      setDepartureSignature(null)
      setForm({ reason: 'Going Home', departureDate: '', expectedReturnDate: '', destination: '', guardianContact: '', notes: '' })
      fetchData()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to submit leave request') }
    finally { setSaving(false) }
  }

  const handleMarkReturn = async () => {
    if (!selectedMovement) return
    if (!returnSignature) {
      toast.error('Return signature is required')
      return
    }
    try {
      setSaving(true)
      await apiFetch(`/api/movements/${selectedMovement.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'Returned',
          actualReturnDate: new Date().toISOString(),
          returnSignature,
        }),
      })
      toast.success('Return marked successfully')
      setReturnDialogOpen(false)
      setReturnSignature(null)
      setSelectedMovement(null)
      fetchData()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to mark return') }
    finally { setSaving(false) }
  }

  const handleMarkDeparted = async () => {
    if (!selectedMovement) return
    try {
      setSaving(true)
      await apiFetch(`/api/movements/${selectedMovement.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Out' }),
      })
      toast.success('You have been marked as departed. Safe travels!')
      setSelectedMovement(null)
      fetchData()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to mark departure') }
    finally { setSaving(false) }
  }

  const activeMovement = movements.find(m => ['Pending', 'Approved', 'Out', 'Late Return'].includes(m.status))

  if (loading) return <ListSkeleton />

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Home' }, { label: 'Leave & Movement', active: true }]} />

      {/* Hero Banner */}
      <div className="hostel-hero-bg rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 animate-float">
              <ArrowRightLeft className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Leave & Movement Register</h2>
              <p className="text-blue-200 text-sm">Track your departures, returns, and leave requests</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Movement Status */}
      {activeMovement && (
        <div className={`glass-card-glow rounded-2xl p-5 border-2 ${activeMovement.status === 'Late Return' ? 'border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10' : activeMovement.status === 'Out' ? 'border-orange-300 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10' : 'border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10'}`}>
          <CardContent className="p-0">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl ${activeMovement.status === 'Late Return' ? 'bg-red-100 dark:bg-red-900/20' : activeMovement.status === 'Out' ? 'bg-orange-100 dark:bg-orange-900/20' : 'bg-blue-100 dark:bg-blue-900/20'}`}>
                  {activeMovement.status === 'Late Return' ? <AlertCircle className="h-6 w-6 text-red-600" /> : <ArrowRightLeft className="h-6 w-6 text-orange-600" />}
                </div>
                <div>
                  <h3 className="font-bold text-lg">Active Leave Record</h3>
                  <p className="text-sm text-muted-foreground mt-1"><LeaveReasonBadge reason={activeMovement.reason} /></p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-3 text-sm">
                    <div><span className="text-muted-foreground">Departure:</span> <span className="font-medium">{new Date(activeMovement.departureDate).toLocaleString()}</span></div>
                    <div><span className="text-muted-foreground">Expected Return:</span> <span className="font-medium">{new Date(activeMovement.expectedReturnDate).toLocaleString()}</span></div>
                    {activeMovement.destination && <div><span className="text-muted-foreground">Destination:</span> <span className="font-medium">{activeMovement.destination}</span></div>}
                    {activeMovement.guardianContact && <div><span className="text-muted-foreground">Guardian Contact:</span> <span className="font-medium">{activeMovement.guardianContact}</span></div>}
                  </div>
                  {activeMovement.adminRemark && (
                    <div className="mt-2 p-2 bg-muted rounded-lg text-sm"><span className="text-muted-foreground">Admin Remark:</span> {activeMovement.adminRemark}</div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <MovementStatusBadge status={activeMovement.status} />
                {activeMovement.status === 'Approved' && (
                  <Button onClick={() => { setSelectedMovement(activeMovement); handleMarkDeparted() }} disabled={saving} className="gap-1.5 bg-orange-600 hover:bg-orange-700 text-sm">
                    <ArrowUpRight className="h-4 w-4" /> Mark as Departed
                  </Button>
                )}
                {(activeMovement.status === 'Out' || activeMovement.status === 'Late Return') && (
                  <Button onClick={() => { setSelectedMovement(activeMovement); setReturnSignature(null); setReturnDialogOpen(true) }} className="gap-1.5 bg-green-600 hover:bg-green-700 text-sm">
                    <FileCheck className="h-4 w-4" /> Mark Return
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </div>
      )}

      {/* New Leave Request Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Movement History</h2>
          <p className="text-muted-foreground text-sm">View your leave and movement records</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2 btn-primary-glow text-white" disabled={!!activeMovement}>
          <Plus className="h-4 w-4" /> New Leave Request
        </Button>
      </div>

      {activeMovement && (
        <div className="premium-card p-3 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-400">You have an active leave record. Please resolve it before submitting a new request.</p>
          </div>
        </div>
      )}

      {/* Movement Timeline */}
      {movements.length === 0 ? (
        <EmptyState icon={<ArrowRightLeft className="h-8 w-8" />} title="No Movement Records" description="Submit a leave request when you need to leave the hostel." />
      ) : (
        <div className="space-y-3 stagger-children">
          {movements.map(m => (
            <div key={m.id} className="premium-card p-4 cursor-pointer" onClick={() => { setSelectedMovement(m); setViewDialogOpen(true) }}>
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <LeaveReasonBadge reason={m.reason} />
                    <MovementStatusBadge status={m.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Dep: {new Date(m.departureDate).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Return: {new Date(m.expectedReturnDate).toLocaleDateString()}</span>
                    {m.destination && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {m.destination}</span>}
                  </div>
                  {m.actualReturnDate && <p className="text-xs text-green-600 mt-1">Actually returned: {new Date(m.actualReturnDate).toLocaleString()}</p>}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg animate-bounce-in">
          <DialogHeader><DialogTitle>Movement Record Details</DialogTitle></DialogHeader>
          {selectedMovement && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <LeaveReasonBadge reason={selectedMovement.reason} />
                <MovementStatusBadge status={selectedMovement.status} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="premium-card p-3"><span className="text-muted-foreground text-xs">Departure</span><p className="font-medium mt-0.5">{new Date(selectedMovement.departureDate).toLocaleString()}</p></div>
                <div className="premium-card p-3"><span className="text-muted-foreground text-xs">Expected Return</span><p className="font-medium mt-0.5">{new Date(selectedMovement.expectedReturnDate).toLocaleString()}</p></div>
                {selectedMovement.actualReturnDate && <div className="premium-card p-3"><span className="text-muted-foreground text-xs">Actual Return</span><p className="font-medium text-green-600 mt-0.5">{new Date(selectedMovement.actualReturnDate).toLocaleString()}</p></div>}
                {selectedMovement.destination && <div className="premium-card p-3"><span className="text-muted-foreground text-xs">Destination</span><p className="font-medium mt-0.5">{selectedMovement.destination}</p></div>}
                {selectedMovement.guardianContact && <div className="premium-card p-3"><span className="text-muted-foreground text-xs">Guardian Contact</span><p className="font-medium mt-0.5">{selectedMovement.guardianContact}</p></div>}
              </div>
              {selectedMovement.notes && <div className="bg-muted p-3 rounded-lg"><p className="text-xs font-medium text-muted-foreground mb-1">Notes:</p><p className="text-sm">{selectedMovement.notes}</p></div>}
              {selectedMovement.adminRemark && <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg"><p className="text-xs font-medium text-muted-foreground mb-1">Admin Remark:</p><p className="text-sm">{selectedMovement.adminRemark}</p></div>}
              {selectedMovement.departureSignature && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Departure Signature:</p>
                  <img src={selectedMovement.departureSignature} alt="Departure signature" className="h-16 rounded border bg-white" />
                </div>
              )}
              {selectedMovement.returnSignature && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Return Signature:</p>
                  <img src={selectedMovement.returnSignature} alt="Return signature" className="h-16 rounded border bg-white" />
                </div>
              )}
              <p className="text-xs text-muted-foreground">Created: {new Date(selectedMovement.createdAt).toLocaleString()}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Leave Request Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto animate-bounce-in">
          <DialogHeader><DialogTitle>Submit Leave Request</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="premium-input">
              <Label>Reason for Leave *</Label>
              <Select value={form.reason} onValueChange={v => setForm(f => ({ ...f, reason: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAVE_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="premium-input"><Label>Departure Date & Time *</Label><Input type="datetime-local" value={form.departureDate} onChange={e => setForm(f => ({ ...f, departureDate: e.target.value }))} /></div>
              <div className="premium-input"><Label>Expected Return Date & Time *</Label><Input type="datetime-local" value={form.expectedReturnDate} onChange={e => setForm(f => ({ ...f, expectedReturnDate: e.target.value }))} /></div>
            </div>
            <div className="premium-input"><Label>Destination / Location</Label><Input value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} placeholder="e.g., Home - Swat, KPK" /></div>
            <div className="premium-input"><Label>Guardian Contact Number</Label><Input value={form.guardianContact} onChange={e => setForm(f => ({ ...f, guardianContact: e.target.value }))} placeholder="e.g., +92-XXX-XXXXXXX" /></div>
            <div className="premium-input"><Label>Additional Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional information..." rows={3} /></div>
            <SignatureCapture value={departureSignature} onChange={setDepartureSignature} label="Departure Digital Signature" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving || !departureSignature} className="btn-primary-glow text-white">
              {saving ? 'Submitting...' : 'Submit Leave Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Return Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="max-w-lg animate-bounce-in">
          <DialogHeader><DialogTitle>Mark Return to Hostel</DialogTitle></DialogHeader>
          {selectedMovement && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-green-800 dark:text-green-300">Confirm Your Return</h3>
                <p className="text-sm text-muted-foreground mt-1">You are marking your return to the hostel for the following leave record:</p>
                <div className="mt-2 text-sm">
                  <p><span className="text-muted-foreground">Reason:</span> {selectedMovement.reason}</p>
                  <p><span className="text-muted-foreground">Departure:</span> {new Date(selectedMovement.departureDate).toLocaleString()}</p>
                  <p><span className="text-muted-foreground">Expected Return:</span> {new Date(selectedMovement.expectedReturnDate).toLocaleString()}</p>
                </div>
                {new Date() > new Date(selectedMovement.expectedReturnDate) && (
                  <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-200">
                    <p className="text-xs text-red-700 dark:text-red-400 font-medium">Warning: You are returning after the expected return time. This will be marked as a late return.</p>
                  </div>
                )}
              </div>
              <SignatureCapture value={returnSignature} onChange={setReturnSignature} label="Return Confirmation Signature" />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleMarkReturn} disabled={saving || !returnSignature} className="bg-green-600 hover:bg-green-700 text-white">
              {saving ? 'Processing...' : 'Confirm Return'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ======================== STUDENT SECURITY PAGE ========================
function StudentSecurityPage({ user }: { user: UserType }) {
  const [logs, setLogs] = useState<ActivityLogType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<{ alertCount: number; totalLogins: number; lastLogin: ActivityLogType | null; failedAttempts: number } | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch<{ logs: ActivityLogType[]; alertCount: number; totalLogins: number; lastLogin: ActivityLogType | null; failedAttempts: number }>(`/api/security?action=my-activity&userId=${user.id}`)
      setLogs(res.logs)
      setStats(res)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load security data'
      setError(msg)
      toast.error(msg)
    }
    setLoading(false)
  }, [user.id])

  useEffect(() => { loadData() }, [loadData])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => { loadData() }, 30000)
    return () => clearInterval(interval)
  }, [loadData])

  const formatTimeAgo = (time: string) => {
    const diff = Date.now() - new Date(time).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  const actionIcon = (action: string) => {
    switch (action) {
      case 'login': return <Activity className="h-3.5 w-3.5 text-green-500" />
      case 'logout': return <LogOut className="h-3.5 w-3.5 text-gray-500" />
      case 'failed_login': return <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
      case 'password_change': return <Key className="h-3.5 w-3.5 text-purple-500" />
      default: return <Activity className="h-3.5 w-3.5 text-blue-500" />
    }
  }

  if (loading || !stats) return <DashboardSkeleton />

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Error Banner */}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-red-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">Failed to load security data</p>
            <p className="text-xs text-red-600/70 dark:text-red-400/70">{error}</p>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={loadData}>Retry</Button>
        </div>
      )}
      <Breadcrumb items={[{ label: 'Home' }, { label: 'Security & Activity', active: true }]} />

      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#1e3a5f] via-[#2a5a8f] to-[#1a2a4a] p-5 sm:p-7 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 left-10 w-32 h-32 bg-green-400 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
              <Shield className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Security & Activity</h2>
              <p className="text-blue-200/80 text-xs sm:text-sm">Your account security and login activity</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
        <div className="dashboard-stat-card stat-card-shimmer">
          <div className="flex items-center gap-3 relative z-10">
            <div className="stat-icon bg-green-50 dark:bg-green-900/20 shadow-sm shrink-0">
              <div className="text-green-600"><Activity className="h-4 w-4 sm:h-5 sm:w-5" /></div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-sm font-medium text-muted-foreground">Total Logins</p>
              <p className="text-base sm:text-2xl font-bold truncate mt-0.5">{stats.totalLogins}</p>
            </div>
          </div>
        </div>
        <div className="dashboard-stat-card stat-card-shimmer">
          <div className="flex items-center gap-3 relative z-10">
            <div className="stat-icon bg-blue-50 dark:bg-blue-900/20 shadow-sm shrink-0">
              <div className="text-blue-600"><Clock className="h-4 w-4 sm:h-5 sm:w-5" /></div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-sm font-medium text-muted-foreground">Last Login</p>
              <p className="text-xs sm:text-sm font-bold truncate mt-0.5">{stats.lastLogin ? formatTimeAgo(stats.lastLogin.createdAt) : 'N/A'}</p>
            </div>
          </div>
        </div>
        <div className="dashboard-stat-card stat-card-shimmer">
          <div className="flex items-center gap-3 relative z-10">
            <div className="stat-icon bg-red-50 dark:bg-red-900/20 shadow-sm shrink-0">
              <div className="text-red-600"><ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5" /></div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-sm font-medium text-muted-foreground">Failed Attempts</p>
              <p className="text-base sm:text-2xl font-bold truncate mt-0.5">{stats.failedAttempts}</p>
            </div>
          </div>
        </div>
        <div className="dashboard-stat-card stat-card-shimmer">
          <div className="flex items-center gap-3 relative z-10">
            <div className="stat-icon bg-amber-50 dark:bg-amber-900/20 shadow-sm shrink-0">
              <div className="text-amber-600"><AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" /></div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-sm font-medium text-muted-foreground">Active Alerts</p>
              <p className="text-base sm:text-2xl font-bold truncate mt-0.5">{stats.alertCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Login Activity */}
        <Card className="premium-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Activity className="h-4 w-4 text-green-500" /> Login Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
              {logs.filter(l => l.action === 'login' || l.action === 'logout' || l.action === 'failed_login').length === 0 ? (
                <EmptyState icon={<Activity className="h-8 w-8" />} title="No Login Activity" description="Your login history will appear here" />
              ) : (
                logs.filter(l => l.action === 'login' || l.action === 'logout' || l.action === 'failed_login').map(log => (
                  <div key={log.id} className={`flex items-center gap-3 p-2.5 rounded-lg ${log.action === 'failed_login' ? 'bg-red-50 dark:bg-red-900/10 border border-red-200/50 dark:border-red-800/20' : 'bg-muted/30 hover:bg-muted/60'} transition-colors`}>
                    <div className="shrink-0">{actionIcon(log.action)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <ActivityActionBadge action={log.action} />
                        {log.ipAddress && <span className="text-[9px] text-muted-foreground font-mono">{log.ipAddress}</span>}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{log.description}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">{formatTimeAgo(log.createdAt)}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Info */}
        <Card className="premium-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <ShieldCheck className="h-4 w-4 text-[#1e3a5f]" /> Security Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { icon: <Lock className="h-4 w-4" />, title: 'Password Encryption', desc: 'Your password is securely encoded and never stored in plain text.' },
              { icon: <Shield className="h-4 w-4" />, title: 'Data Privacy', desc: 'You can only access your own data. Other students information is protected.' },
              { icon: <Activity className="h-4 w-4" />, title: 'Activity Tracking', desc: 'All your login and system activities are logged for security auditing.' },
              { icon: <Fingerprint className="h-4 w-4" />, title: 'Session Security', desc: 'Your session is validated on each page load to prevent unauthorized access.' },
              { icon: <Key className="h-4 w-4" />, title: 'Password Reset', desc: 'If you forget your password, use the Forgot Password option on the login page.' },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                <div className="text-[#1e3a5f] dark:text-blue-400 mt-0.5 shrink-0">{feature.icon}</div>
                <div>
                  <h4 className="font-semibold text-sm">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
