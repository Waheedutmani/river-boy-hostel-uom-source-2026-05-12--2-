'use client'

import React, { useState, useEffect, useCallback, useRef, createContext, useContext, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Bell, BellRing, DollarSign, MessageSquare, ArrowRightLeft, AlertTriangle,
  Wrench, Users, Megaphone, Building2, Info, CheckCircle, XCircle,
  AlertCircle, X, Search, Trash2, CheckCheck, Clock,
  Radio, Mail, ChevronRight, ChevronDown, Siren,
  RefreshCw, Eye, EyeOff, Filter
} from 'lucide-react'
import { apiFetch } from '@/components/shared-components'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

// ===================== CONSTANTS =====================
export const NOTIFICATION_CATEGORIES = [
  'Payments', 'Complaints', 'Leave', 'Maintenance', 'Announcements'
] as const

export const NOTIFICATION_PRIORITIES = ['Normal', 'Important', 'Critical', 'Emergency'] as const

export const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  'Payments': { icon: <DollarSign className="h-3.5 w-3.5" />, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800' },
  'Complaints': { icon: <MessageSquare className="h-3.5 w-3.5" />, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' },
  'Leave': { icon: <ArrowRightLeft className="h-3.5 w-3.5" />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
  'Maintenance': { icon: <Wrench className="h-3.5 w-3.5" />, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800' },
  'Announcements': { icon: <Megaphone className="h-3.5 w-3.5" />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' },
  'Leave Requests': { icon: <ArrowRightLeft className="h-3.5 w-3.5" />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
  'Emergency Alerts': { icon: <AlertTriangle className="h-3.5 w-3.5" />, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800' },
  'Visitor Logs': { icon: <Users className="h-3.5 w-3.5" />, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800' },
  'Room Management': { icon: <Building2 className="h-3.5 w-3.5" />, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800' },
  'General': { icon: <Info className="h-3.5 w-3.5" />, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700' },
}

export const PRIORITY_CONFIG: Record<string, { color: string; bg: string; dot: string; label: string }> = {
  'Normal': { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', dot: 'bg-blue-500', label: 'Normal' },
  'Important': { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', dot: 'bg-yellow-500', label: 'Important' },
  'Critical': { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', dot: 'bg-orange-500', label: 'Critical' },
  'Emergency': { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', dot: 'bg-red-500', label: 'Emergency' },
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  'info': { icon: <Info className="h-4 w-4" />, color: 'text-blue-500' },
  'success': { icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-500' },
  'warning': { icon: <AlertCircle className="h-4 w-4" />, color: 'text-yellow-500' },
  'error': { icon: <XCircle className="h-4 w-4" />, color: 'text-red-500' },
}

// ===================== DEBOUNCE HOOK =====================
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

// ===================== TOAST CONTEXT =====================
interface ToastItem {
  id: string
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  createdAt: number
}

interface ToastContextType {
  toasts: ToastItem[]
  addToast: (toast: Omit<ToastItem, 'id' | 'createdAt'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType>({ toasts: [], addToast: () => {}, removeToast: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((t: Omit<ToastItem, 'id' | 'createdAt'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
    setToasts(prev => [...prev, { ...t, id, createdAt: Date.now() }].slice(-3))
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useNotificationToast() {
  return useContext(ToastContext)
}

// ===================== TOAST CONTAINER =====================
function ToastContainer({ toasts, onRemove }: { toasts: ToastItem[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast: t, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [progress, setProgress] = useState(100)
  const startRef = useRef(Date.now())

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    startRef.current = Date.now()

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startRef.current
      setProgress(Math.max(0, 100 - (elapsed / 4500) * 100))
    }, 50)

    const timer = setTimeout(() => {
      setLeaving(true)
      setTimeout(() => onRemove(t.id), 300)
    }, 4500)

    return () => { clearTimeout(timer); clearInterval(progressInterval) }
  }, [t.id, onRemove])

  const styles = {
    success: { border: 'border-l-green-500', bg: 'bg-green-50 dark:bg-green-900/20', bar: 'bg-green-500' },
    error: { border: 'border-l-red-500', bg: 'bg-red-50 dark:bg-red-900/20', bar: 'bg-red-500' },
    warning: { border: 'border-l-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', bar: 'bg-yellow-500' },
    info: { border: 'border-l-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', bar: 'bg-blue-500' },
  }[t.type]

  const typeIcon = TYPE_CONFIG[t.type]?.icon || <Info className="h-4 w-4 text-blue-500" />

  return (
    <div
      className={`pointer-events-auto rounded-xl border-l-4 ${styles.border} ${styles.bg} p-4 shadow-lg relative overflow-hidden transition-all duration-300 ${
        visible && !leaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{typeIcon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{t.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.message}</p>
        </div>
        <button onClick={() => { setLeaving(true); setTimeout(() => onRemove(t.id), 300) }} className="shrink-0 text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/5 dark:bg-white/5">
        <div className={`h-full ${styles.bar} transition-all duration-100 ease-linear`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

// ===================== UTILITY FUNCTIONS =====================
export function formatTimeAgo(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return new Date(date).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })
}

function getCategoryConfig(category: string) {
  return CATEGORY_CONFIG[category] || CATEGORY_CONFIG['General']
}

// ===================== NOTIFICATION TYPE =====================
export interface NotificationType {
  id: string
  userId: string
  title: string
  message: string
  type: string
  category: string
  priority: string
  read: boolean
  actionUrl: string | null
  isBroadcast: boolean
  senderName: string | null
  createdAt: string
  updatedAt: string
}

// ===================== 1. NOTIFICATION BELL =====================
export function SmartNotificationBell({ userId, role, onViewAll }: { userId: string; role?: string; onViewAll?: () => void }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationType[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all')
  const [prevNotifIds, setPrevNotifIds] = useState<Set<string>>(new Set())
  const panelRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLButtonElement>(null)
  const { addToast } = useNotificationToast()

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await apiFetch<{ notifications: NotificationType[]; unreadCount: number }>(`/api/notifications?userId=${userId}&limit=20`)
      const newNotifs = data.notifications || []
      const newUnread = data.unreadCount || 0

      // Auto-toast for new notifications
      if (prevNotifIds.size > 0) {
        const newIds = newNotifs.filter(n => !prevNotifIds.has(n.id) && !n.read)
        if (newIds.length > 0) {
          const latestNew = newIds[0]
          addToast({
            title: latestNew.title,
            message: latestNew.message,
            type: latestNew.priority === 'Emergency' ? 'error' : latestNew.priority === 'Critical' ? 'warning' : (latestNew.type as any) || 'info'
          })
        }
      }

      setNotifications(newNotifs)
      setUnreadCount(newUnread)
      setPrevNotifIds(new Set(newNotifs.map(n => n.id)))
    } catch { /* ignore */ }
  }, [userId, prevNotifIds, addToast])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (open && panelRef.current && !panelRef.current.contains(e.target as Node) && bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEscape)
    return () => { document.removeEventListener('mousedown', handleClick); document.removeEventListener('keydown', handleEscape) }
  }, [open])

  const markRead = async (id: string) => {
    try {
      await apiFetch(`/api/notifications/${id}`, { method: 'PUT', body: JSON.stringify({ read: true }) })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch { /* ignore */ }
  }

  const markAllRead = async () => {
    try {
      await apiFetch('/api/notifications/mark-all-read', { method: 'PUT', body: JSON.stringify({ userId }) })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
      toast.success('All marked as read')
    } catch { toast.error('Failed to mark all as read') }
  }

  const hasEmergency = notifications.some(n => n.priority === 'Emergency' && !n.read)

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.read
    return true
  })

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={bellRef}
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-manipulation"
      >
        <Bell className={`h-5 w-5 transition-colors ${open ? 'text-[#1e3a5f] dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'} ${hasEmergency ? 'text-red-500' : ''}`} />
        {unreadCount > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white ${hasEmergency ? 'bg-red-500' : 'bg-[#1e3a5f]'}`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <>
          {/* Mobile overlay */}
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 sm:hidden" onClick={() => setOpen(false)} />

          {/* Mobile: bottom sheet */}
          <div ref={panelRef} className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
            <div className="bg-white dark:bg-slate-900 rounded-t-2xl border border-border/50 shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
              {/* Drag handle */}
              <div className="flex justify-center py-2">
                <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              </div>
              {/* Header */}
              <div className="px-4 pb-3 border-b border-border/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BellRing className="h-4 w-4 text-[#1e3a5f] dark:text-blue-400" />
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {unreadCount > 0 && <Badge className="text-[10px] px-1.5 py-0 bg-[#1e3a5f]/10 text-[#1e3a5f] dark:bg-[#1e3a5f]/30 dark:text-blue-300">{unreadCount} new</Badge>}
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={markAllRead}>
                        <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark all
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                  {(['all', 'unread'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-1.5 px-3 rounded-md text-[11px] font-medium transition-colors ${
                        activeTab === tab
                          ? 'bg-white dark:bg-slate-700 shadow-sm text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab === 'all' ? 'All' : `Unread (${unreadCount})`}
                    </button>
                  ))}
                </div>
              </div>
              {/* Emergency banner */}
              {hasEmergency && (
                <div className="mx-3 mt-2 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                    <Siren className="h-4 w-4 shrink-0" />
                    <p className="text-xs font-semibold truncate">{notifications.find(n => n.priority === 'Emergency' && !n.read)?.title}</p>
                  </div>
                </div>
              )}
              {/* List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[50vh]">
                <NotifList notifications={filteredNotifications} onMarkRead={markRead} />
              </div>
              {/* Footer */}
              <div className="p-3 border-t border-border/30">
                <Button variant="ghost" className="w-full text-xs text-[#1e3a5f] dark:text-blue-400" onClick={() => { setOpen(false); onViewAll?.() }}>
                  View All Notifications <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>

          {/* Desktop: dropdown panel */}
          <div className="hidden sm:block absolute right-0 top-full mt-2 w-[380px] max-w-[calc(100vw-2rem)] z-50">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border/50 shadow-xl overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-border/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BellRing className="h-4 w-4 text-[#1e3a5f] dark:text-blue-400" />
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {unreadCount > 0 && <Badge className="text-[10px] px-1.5 py-0 bg-[#1e3a5f]/10 text-[#1e3a5f] dark:bg-[#1e3a5f]/30 dark:text-blue-300">{unreadCount} new</Badge>}
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={markAllRead}>
                        <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark all read
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                  {(['all', 'unread'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-1.5 px-3 rounded-md text-[11px] font-medium transition-colors ${
                        activeTab === tab
                          ? 'bg-white dark:bg-slate-700 shadow-sm text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab === 'all' ? 'All' : `Unread (${unreadCount})`}
                    </button>
                  ))}
                </div>
              </div>
              {/* Emergency banner */}
              {hasEmergency && (
                <div className="mx-3 mt-2 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                    <Siren className="h-4 w-4 shrink-0" />
                    <p className="text-xs font-semibold truncate">{notifications.find(n => n.priority === 'Emergency' && !n.read)?.title}</p>
                  </div>
                </div>
              )}
              {/* List */}
              <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
                <NotifList notifications={filteredNotifications} onMarkRead={markRead} />
              </div>
              {/* Footer */}
              <div className="p-3 border-t border-border/30 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  Auto-refresh
                </div>
                <Button variant="ghost" className="text-xs text-[#1e3a5f] dark:text-blue-400" onClick={() => { setOpen(false); onViewAll?.() }}>
                  View All <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ===================== NOTIFICATION LIST (used in bell dropdown) =====================
function NotifList({ notifications, onMarkRead }: { notifications: NotificationType[]; onMarkRead: (id: string) => void }) {
  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-3">
          <Bell className="h-6 w-6 text-gray-400" />
        </div>
        <p className="text-sm text-muted-foreground">No notifications</p>
        <p className="text-xs text-muted-foreground/60 mt-1">You&apos;re all caught up!</p>
      </div>
    )
  }

  return (
    <div className="py-1">
      {notifications.map((n) => {
        const catConfig = getCategoryConfig(n.category)
        const priConfig = PRIORITY_CONFIG[n.priority] || PRIORITY_CONFIG['Normal']
        return (
          <div
            key={n.id}
            onClick={() => onMarkRead(n.id)}
            className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
              !n.read ? 'bg-[#1e3a5f]/[0.03] dark:bg-[#1e3a5f]/10' : ''
            }`}
          >
            {/* Category icon */}
            <div className={`shrink-0 w-9 h-9 rounded-lg ${catConfig.bg} flex items-center justify-center mt-0.5`}>
              <span className={catConfig.color}>{catConfig.icon}</span>
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`text-sm truncate ${!n.read ? 'font-semibold' : 'font-medium text-muted-foreground'}`}>{n.title}</p>
                {!n.read && <span className={`w-2 h-2 rounded-full shrink-0 ${priConfig.dot}`} />}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-muted-foreground/60">{formatTimeAgo(n.createdAt)}</span>
                {n.isBroadcast && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                    <Radio className="h-2.5 w-2.5" /> Broadcast
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ===================== 2. NOTIFICATION CENTER (Full Page) =====================
export function NotificationCenter({ userId, role }: { userId: string; role?: string }) {
  const [notifications, setNotifications] = useState<NotificationType[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [totalCount, setTotalCount] = useState(0)

  const debouncedSearch = useDebounce(search, 300)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ userId, limit: '100' })
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      if (priorityFilter !== 'all') params.set('priority', priorityFilter)
      if (debouncedSearch) params.set('search', debouncedSearch)
      const data = await apiFetch<{ notifications: NotificationType[]; totalCount: number }>(`/api/notifications?${params}`)
      let notifs = data.notifications || []
      // Client-side date filtering
      const now = new Date()
      if (dateFilter === 'today') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        notifs = notifs.filter(n => new Date(n.createdAt) >= startOfDay)
      } else if (dateFilter === 'week') {
        const startOfWeek = new Date(now)
        startOfWeek.setDate(startOfWeek.getDate() - 7)
        notifs = notifs.filter(n => new Date(n.createdAt) >= startOfWeek)
      } else if (dateFilter === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        notifs = notifs.filter(n => new Date(n.createdAt) >= startOfMonth)
      }
      setNotifications(notifs)
      setTotalCount(data.totalCount || 0)
    } catch { toast.error('Failed to load notifications') }
    setLoading(false)
  }, [userId, categoryFilter, priorityFilter, debouncedSearch, dateFilter])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markRead = async (id: string) => {
    try {
      await apiFetch(`/api/notifications/${id}`, { method: 'PUT', body: JSON.stringify({ read: true }) })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch { /* ignore */ }
  }

  const toggleRead = async (n: NotificationType) => {
    try {
      await apiFetch(`/api/notifications/${n.id}`, { method: 'PUT', body: JSON.stringify({ read: !n.read }) })
      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: !item.read } : item))
    } catch { toast.error('Failed to update') }
  }

  const deleteNotification = async (id: string) => {
    try {
      await apiFetch(`/api/notifications/${id}`, { method: 'DELETE' })
      setNotifications(prev => prev.filter(n => n.id !== id))
      setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next })
      toast.success('Notification deleted')
    } catch { toast.error('Failed to delete') }
  }

  const markAllRead = async () => {
    try {
      await apiFetch('/api/notifications/mark-all-read', { method: 'PUT', body: JSON.stringify({ userId }) })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      toast.success('All notifications marked as read')
    } catch { toast.error('Failed to mark all as read') }
  }

  const bulkDelete = async () => {
    try {
      for (const id of selectedIds) {
        await apiFetch(`/api/notifications/${id}`, { method: 'DELETE' })
      }
      setNotifications(prev => prev.filter(n => !selectedIds.has(n.id)))
      toast.success(`${selectedIds.size} notifications deleted`)
      setSelectedIds(new Set())
    } catch { toast.error('Failed to delete') }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const unreadCount = notifications.filter(n => !n.read).length
  const todayCount = notifications.filter(n => {
    const d = new Date(n.createdAt)
    const today = new Date()
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
  }).length

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    notifications.forEach(n => { counts[n.category] = (counts[n.category] || 0) + 1 })
    return counts
  }, [notifications])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BellRing className="h-5 w-5 text-[#1e3a5f] dark:text-blue-400" />
            Notification Center
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your alerts and announcements</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchNotifications} className="text-xs h-8">
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={markAllRead} className="text-xs h-8" disabled={unreadCount === 0}>
            <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark All Read
          </Button>
          {selectedIds.size > 0 && (
            <Button variant="destructive" size="sm" onClick={bulkDelete} className="text-xs h-8">
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete ({selectedIds.size})
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: notifications.length, icon: <Bell className="h-4 w-4" />, color: 'text-[#1e3a5f] dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Unread', value: unreadCount, icon: <Mail className="h-4 w-4" />, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
          { label: 'Today', value: todayCount, icon: <Clock className="h-4 w-4" />, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Emergency', value: notifications.filter(n => n.priority === 'Emergency').length, icon: <Siren className="h-4 w-4" />, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-slate-900 rounded-xl border border-border/50 p-4 flex items-center gap-3 shadow-sm">
            <div className={`${stat.bg} rounded-lg w-9 h-9 flex items-center justify-center shrink-0`}>
              <span className={stat.color}>{stat.icon}</span>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 rounded-xl"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px] h-9 rounded-xl"><Filter className="h-3.5 w-3.5 mr-1" /><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {NOTIFICATION_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px] h-9 rounded-xl"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {NOTIFICATION_PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as typeof dateFilter)}>
          <SelectTrigger className="w-[140px] h-9 rounded-xl"><Clock className="h-3.5 w-3.5 mr-1" /><SelectValue placeholder="Date" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Category Quick Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border whitespace-nowrap shrink-0 ${
            categoryFilter === 'all'
              ? 'bg-[#1e3a5f]/10 text-[#1e3a5f] dark:bg-[#1e3a5f]/30 dark:text-blue-300 border-[#1e3a5f]/20'
              : 'bg-gray-50 dark:bg-gray-800 text-muted-foreground border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          All ({notifications.length})
        </button>
        {NOTIFICATION_CATEGORIES.map(cat => {
          const config = getCategoryConfig(cat)
          const count = categoryCounts[cat] || 0
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border whitespace-nowrap shrink-0 ${
                categoryFilter === cat
                  ? `${config.bg} ${config.color} ${config.border}`
                  : 'bg-gray-50 dark:bg-gray-800 text-muted-foreground border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {config.icon} {cat} {count > 0 && <span className="opacity-60">({count})</span>}
            </button>
          )
        })}
      </div>

      {/* Notification List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-border/50 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No notifications found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {notifications.map((n) => {
              const catConfig = getCategoryConfig(n.category)
              const priConfig = PRIORITY_CONFIG[n.priority] || PRIORITY_CONFIG['Normal']
              const isSelected = selectedIds.has(n.id)
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                    !n.read ? 'bg-[#1e3a5f]/[0.02] dark:bg-[#1e3a5f]/5' : ''
                  } ${isSelected ? 'ring-1 ring-[#1e3a5f]/20 dark:ring-blue-500/20' : ''}`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(n.id)}
                    className="mt-1.5 h-4 w-4 rounded border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f] cursor-pointer"
                  />
                  {/* Category icon */}
                  <div className={`shrink-0 w-9 h-9 rounded-lg ${catConfig.bg} flex items-center justify-center mt-0.5`}>
                    <span className={catConfig.color}>{catConfig.icon}</span>
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm truncate ${!n.read ? 'font-semibold' : 'font-medium text-muted-foreground'}`}>{n.title}</p>
                      {!n.read && <span className={`w-2 h-2 rounded-full shrink-0 ${priConfig.dot}`} />}
                      {n.isBroadcast && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400">
                          <Radio className="h-2.5 w-2.5 mr-0.5" /> Broadcast
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-muted-foreground/60">{formatTimeAgo(n.createdAt)}</span>
                      {n.priority !== 'Normal' && (
                        <Badge variant="outline" className={`text-[9px] px-1 py-0 ${priConfig.bg} ${priConfig.color}`}>{n.priority}</Badge>
                      )}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!n.read && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markRead(n.id)} title="Mark as read">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {n.read && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleRead(n)} title="Mark as unread">
                        <EyeOff className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => deleteNotification(n.id)} title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Results info */}
      {!loading && notifications.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">Showing {notifications.length} of {totalCount} notifications</p>
      )}
    </div>
  )
}

// ===================== 3. ANNOUNCEMENT BROADCAST (Admin) =====================
export function AnnouncementBroadcast({ userId, userName }: { userId: string; userName: string }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('Announcements')
  const [priority, setPriority] = useState('Normal')
  const [targetRole, setTargetRole] = useState<'all' | 'student' | 'admin'>('all')
  const [sending, setSending] = useState(false)

  const handleBroadcast = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in title and content')
      return
    }
    setSending(true)
    try {
      await apiFetch('/api/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify({ title, message: content, category, priority, targetRole, senderName: userName })
      })
      toast.success('Broadcast sent successfully!')
      setTitle('')
      setContent('')
      setPriority('Normal')
    } catch { toast.error('Failed to send broadcast') }
    setSending(false)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-[#1e3a5f] dark:text-blue-400" />
          Announcement Broadcasting
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Send announcements to all users or specific roles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-border/50 shadow-sm p-5 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input placeholder="Announcement title..." value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <textarea
                placeholder="Write your announcement..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Target</label>
                <Select value={targetRole} onValueChange={(v) => setTargetRole(v as typeof targetRole)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="student">Students Only</SelectItem>
                    <SelectItem value="admin">Admins Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleBroadcast}
              disabled={sending || !title.trim() || !content.trim()}
              className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 text-white rounded-xl"
            >
              <Megaphone className="h-4 w-4 mr-2" />
              {sending ? 'Sending...' : 'Send Announcement'}
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-border/50 shadow-sm p-5">
            <h3 className="text-sm font-semibold mb-3">Preview</h3>
            <div className="border border-border/50 rounded-xl p-4 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                  <Megaphone className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{title || 'Announcement Title'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-3">{content || 'Your announcement content will appear here...'}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-muted-foreground">Just now</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400">Broadcast</span>
                    {priority !== 'Normal' && (
                      <Badge variant="outline" className={`text-[9px] px-1 py-0 ${PRIORITY_CONFIG[priority]?.bg} ${PRIORITY_CONFIG[priority]?.color}`}>{priority}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-border/50 shadow-sm p-5">
            <h3 className="text-sm font-semibold mb-2">Quick Send</h3>
            <p className="text-xs text-muted-foreground mb-3">Send common announcements quickly</p>
            <div className="space-y-2">
              {[
                { title: 'Fee Deadline Reminder', message: 'All students are reminded to pay their pending fees before the end of this month.', category: 'Payments', priority: 'Important' },
                { title: 'Maintenance Notice', message: 'Water supply will be temporarily interrupted tomorrow from 8 AM to 12 PM for maintenance work.', category: 'Maintenance', priority: 'Important' },
                { title: 'Emergency Drill', message: 'An emergency evacuation drill will be conducted this Friday at 10 AM. All residents must participate.', category: 'Emergency Alerts', priority: 'Critical' },
              ].map(quick => (
                <button
                  key={quick.title}
                  onClick={() => { setTitle(quick.title); setContent(quick.message); setCategory(quick.category); setPriority(quick.priority) }}
                  className="w-full text-left p-2.5 rounded-lg border border-border/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <p className="text-xs font-medium">{quick.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{quick.message}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ===================== 4. NOTIFICATION ANALYTICS (Admin) =====================
export function NotificationAnalytics({ userId }: { userId: string }) {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<any>(`/api/notifications/analytics?userId=${userId}`)
        setAnalytics(data)
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, [userId])

  if (loading) {
    return (
      <div className="space-y-5">
        <h2 className="text-xl font-bold">Notification Analytics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const stats = [
    { label: 'Total Sent', value: analytics?.totalSent || 0, icon: <Bell className="h-4 w-4" />, color: 'text-[#1e3a5f] dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Read', value: analytics?.readCount || 0, icon: <Eye className="h-4 w-4" />, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Unread', value: analytics?.unreadCount || 0, icon: <Mail className="h-4 w-4" />, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
    { label: 'Read Rate', value: `${analytics?.readRate || 0}%`, icon: <CheckCheck className="h-4 w-4" />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BellRing className="h-5 w-5 text-[#1e3a5f] dark:text-blue-400" />
          Notification Analytics
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Overview of notification delivery and engagement</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white dark:bg-slate-900 rounded-xl border border-border/50 p-4 flex items-center gap-3 shadow-sm">
            <div className={`${stat.bg} rounded-lg w-9 h-9 flex items-center justify-center shrink-0`}>
              <span className={stat.color}>{stat.icon}</span>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      {analytics?.categoryBreakdown && Object.keys(analytics.categoryBreakdown).length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-border/50 shadow-sm p-5">
          <h3 className="text-sm font-semibold mb-4">Category Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(analytics.categoryBreakdown).map(([cat, count]: [string, any]) => {
              const config = getCategoryConfig(cat)
              const total = analytics.totalSent || 1
              const percent = Math.round((count / total) * 100)
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span className={config.color}>{config.icon}</span>
                      <span className="font-medium">{cat}</span>
                    </div>
                    <span className="text-muted-foreground">{count} ({percent}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${config.bg.replace('bg-', 'bg-').replace('/20', '/60').replace('/50', '/80')} transition-all duration-500`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ===================== 5. SMART REMINDERS =====================
export function SmartReminders({ userId, role }: { userId: string; role?: string }) {
  const [reminders, setReminders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<{ notifications: any[] }>(`/api/notifications?userId=${userId}&category=Payments&limit=10&unread=true`)
        setReminders(data.notifications || [])
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, [userId])

  if (loading) {
    return (
      <div className="space-y-5">
        <h2 className="text-xl font-bold">Smart Reminders</h2>
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#1e3a5f] dark:text-blue-400" />
          Smart Reminders
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Important reminders and pending actions</p>
      </div>

      {reminders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-border/50 shadow-sm p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mb-4">
            <CheckCheck className="h-8 w-8 text-green-500" />
          </div>
          <p className="text-sm font-medium">No pending reminders</p>
          <p className="text-xs text-muted-foreground mt-1">You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map((r) => {
            const catConfig = getCategoryConfig(r.category)
            const priConfig = PRIORITY_CONFIG[r.priority] || PRIORITY_CONFIG['Normal']
            return (
              <div key={r.id} className="bg-white dark:bg-slate-900 rounded-xl border border-border/50 shadow-sm p-4 flex items-start gap-3 hover:shadow-md transition-shadow">
                <div className={`shrink-0 w-10 h-10 rounded-lg ${catConfig.bg} flex items-center justify-center`}>
                  <span className={catConfig.color}>{catConfig.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.message}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-muted-foreground/60">{formatTimeAgo(r.createdAt)}</span>
                    {r.priority !== 'Normal' && (
                      <Badge variant="outline" className={`text-[9px] px-1 py-0 ${priConfig.bg} ${priConfig.color}`}>{r.priority}</Badge>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ===================== 6. COMMUNICATION SIMULATOR (placeholder) =====================
export function CommunicationSimulator({ userId }: { userId: string }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Mail className="h-5 w-5 text-[#1e3a5f] dark:text-blue-400" />
          Communication Center
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Send and manage communications</p>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-border/50 shadow-sm p-12 text-center">
        <div className="mx-auto w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-4">
          <Mail className="h-8 w-8 text-blue-500" />
        </div>
        <p className="text-sm font-medium">Communication Center</p>
        <p className="text-xs text-muted-foreground mt-1">Email and SMS notifications are managed through the Announcement Broadcasting feature</p>
      </div>
    </div>
  )
}
