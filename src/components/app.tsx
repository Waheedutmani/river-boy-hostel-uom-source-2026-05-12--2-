'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { Bell, Moon, Sun, Menu, Building2, LogOut, BarChart3, Users, DoorOpen, ClipboardList, Receipt, MessageSquareWarning, Wrench, UserCog, BedDouble, BookOpen, User as UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { LoginPage, RegisterPage } from '@/components/auth-pages'
import { AdminPortalPage } from '@/components/admin-portal'
import { StudentPortalPage } from '@/components/student-portal'
import {
  type UserType, type AdminPage, type StudentPage, type NotificationType,
  apiFetch
} from '@/components/shared-components'

type AuthView = 'login' | 'register'

const adminNavItems: { page: AdminPage; label: string; icon: React.ReactNode }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="h-5 w-5" /> },
  { page: 'students', label: 'Students', icon: <Users className="h-5 w-5" /> },
  { page: 'rooms', label: 'Rooms', icon: <DoorOpen className="h-5 w-5" /> },
  { page: 'applications', label: 'Applications', icon: <ClipboardList className="h-5 w-5" /> },
  { page: 'fees', label: 'Fees & Payments', icon: <Receipt className="h-5 w-5" /> },
  { page: 'complaints', label: 'Complaints', icon: <MessageSquareWarning className="h-5 w-5" /> },
  { page: 'maintenance', label: 'Maintenance', icon: <Wrench className="h-5 w-5" /> },
  { page: 'staff', label: 'Staff', icon: <UserCog className="h-5 w-5" /> },
  { page: 'notices', label: 'Notices', icon: <Bell className="h-5 w-5" /> },
  { page: 'reports', label: 'Reports', icon: <BarChart3 className="h-5 w-5" /> },
]

const studentNavItems: { page: StudentPage; label: string; icon: React.ReactNode }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="h-5 w-5" /> },
  { page: 'my-room', label: 'My Room', icon: <BedDouble className="h-5 w-5" /> },
  { page: 'apply', label: 'Apply for Room', icon: <ClipboardList className="h-5 w-5" /> },
  { page: 'my-fees', label: 'My Fees', icon: <Receipt className="h-5 w-5" /> },
  { page: 'complaints', label: 'Complaints', icon: <MessageSquareWarning className="h-5 w-5" /> },
  { page: 'maintenance', label: 'Maintenance', icon: <Wrench className="h-5 w-5" /> },
  { page: 'notices', label: 'Notices', icon: <Bell className="h-5 w-5" /> },
  { page: 'rules', label: 'Hostel Rules', icon: <BookOpen className="h-5 w-5" /> },
  { page: 'profile', label: 'My Profile', icon: <UserIcon className="h-5 w-5" /> },
]

const adminPageTitles: Record<AdminPage, string> = {
  dashboard: 'Dashboard', students: 'Students', rooms: 'Rooms', applications: 'Applications',
  fees: 'Fees & Payments', complaints: 'Complaints', maintenance: 'Maintenance',
  staff: 'Staff', notices: 'Notices', reports: 'Reports'
}

const studentPageTitles: Record<StudentPage, string> = {
  'dashboard': 'Dashboard', 'my-room': 'My Room', 'apply': 'Apply for Room',
  'my-fees': 'My Fees', 'complaints': 'Complaints', 'maintenance': 'Maintenance',
  'notices': 'Notices', 'rules': 'Hostel Rules', 'profile': 'My Profile'
}

export default function RiverBoyHostelApp() {
  const [user, setUser] = useState<UserType | null>(null)
  const [authView, setAuthView] = useState<AuthView>('login')
  const [adminPage, setAdminPage] = useState<AdminPage>('dashboard')
  const [studentPage, setStudentPage] = useState<StudentPage>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationType[]>([])
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const stored = localStorage.getItem('rbh_user')
    if (stored) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(JSON.parse(stored))
      } catch { /* ignore */ }
    }
    setMounted(true)
  }, [])

  const fetchNotifications = useCallback(async (userId: string) => {
    try {
      const data = await apiFetch<NotificationType[]>(`/api/notifications?userId=${userId}`)
      setNotifications(data.slice(0, 10))
    } catch { /* ignore */ }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (user) fetchNotifications(user.id) }, [user, fetchNotifications])
  useEffect(() => { if (!user) return; const i = setInterval(() => fetchNotifications(user.id), 30000); return () => clearInterval(i) }, [user, fetchNotifications])

  const handleLogin = (loggedInUser: UserType) => {
    setUser(loggedInUser)
    localStorage.setItem('rbh_user', JSON.stringify(loggedInUser))
    setAdminPage('dashboard')
    setStudentPage('dashboard')
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('rbh_user')
    setAuthView('login')
    setNotifications([])
  }

  const markNotificationRead = async (id: string) => {
    try {
      await apiFetch(`/api/notifications/${id}`, { method: 'PUT', body: JSON.stringify({ read: true }) })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch { /* ignore */ }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  // Not logged in
  if (!user) {
    if (authView === 'register') {
      return <RegisterPage onSwitchToLogin={() => setAuthView('login')} />
    }
    return <LoginPage onLogin={handleLogin} onSwitchToRegister={() => setAuthView('register')} />
  }

  const isAdmin = user.role === 'admin'
  const navItems = isAdmin ? adminNavItems : studentNavItems
  const currentPage = isAdmin ? adminPage : studentPage
  const pageTitles = isAdmin ? adminPageTitles : studentPageTitles

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-gradient-to-b from-[#1e3a5f] to-[#0f2744] text-white sidebar-transition
        lg:translate-x-0 lg:static lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-green-500 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight">River Boy Hostel</h1>
              <p className="text-[10px] text-blue-300">UOM {isAdmin ? 'Admin' : 'Student'}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-white/10" onClick={() => setSidebarOpen(false)}>
            <span className="text-xl leading-none">&times;</span>
          </Button>
        </div>
        <div className="h-[calc(100%-73px)] overflow-y-auto custom-scrollbar">
          <nav className="p-3 space-y-1">
            {navItems.map(item => (
              <button
                key={item.page}
                onClick={() => { if (isAdmin) setAdminPage(item.page as AdminPage); else setStudentPage(item.page as StudentPage); setSidebarOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === item.page ? 'bg-white/15 text-white' : 'text-blue-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
          <div className="p-4 mt-4 mx-3 bg-white/5 rounded-lg">
            <p className="text-xs text-blue-300 mb-1">River Boy Hostel UOM</p>
            <p className="text-[10px] text-blue-400">{isAdmin ? 'Management' : 'Student'} Portal v2.0</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-card border-b flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold hidden sm:block">{pageTitles[currentPage]}</h2>
          </div>
          <div className="flex items-center gap-2">
            {mounted && (
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                {notifications.length === 0 ? (
                  <DropdownMenuItem disabled>No notifications</DropdownMenuItem>
                ) : notifications.slice(0, 5).map(n => (
                  <DropdownMenuItem key={n.id} onClick={() => markNotificationRead(n.id)} className={!n.read ? 'bg-muted/50' : ''}>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        {!n.read && <div className="w-2 h-2 bg-primary rounded-full" />}
                        <span className={`text-sm ${!n.read ? 'font-medium' : ''}`}>{n.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground line-clamp-1">{n.message}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Badge variant="outline" className="text-xs hidden sm:inline-flex">{isAdmin ? 'Admin' : 'Student'}</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <span className="hidden sm:inline text-sm">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar">
          {isAdmin ? <AdminPortalPage currentPage={adminPage} /> : <StudentPortalPage currentPage={studentPage} user={user} />}
        </main>

        {/* Footer */}
        <footer className="h-10 bg-card border-t flex items-center justify-center px-4 shrink-0">
          <p className="text-xs text-muted-foreground">
            River Boy Hostel UOM &copy; 2026 &bull; University of Malakand
          </p>
        </footer>
      </div>
    </div>
  )
}
