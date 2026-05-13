'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  UserCheck, UserX, Clock, Eye, Search, Filter, CalendarDays,
  Shield, Users, LogIn, LogOut, Plus, Trash2, RefreshCw,
  Phone, CreditCard, MapPin, FileText, ChevronDown, X,
  CheckCircle2, AlertTriangle, Building2, DoorOpen, Activity
} from 'lucide-react'

import {
  apiFetch, formatPKR,
  VisitorStatusBadge, VisitorRelationBadge,
  StatCard, ListSkeleton, EmptyState, Breadcrumb,
  VISITOR_RELATIONS, VISIT_PURPOSES,
  type VisitorType, type VisitorStats, type StudentType,
} from '@/components/shared-components'
import type { UserType } from '@/app/page'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// ===================== ADMIN VISITOR MANAGEMENT =====================
export function AdminVisitors({ searchQuery, user }: { searchQuery: string; user: UserType }) {
  const [visitors, setVisitors] = useState<VisitorType[]>([])
  const [stats, setStats] = useState<VisitorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [localSearch, setLocalSearch] = useState('')
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorType | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [remarkOpen, setRemarkOpen] = useState(false)
  const [remarkAction, setRemarkAction] = useState<'approve' | 'reject'>('approve')
  const [adminRemark, setAdminRemark] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [tab, setTab] = useState('all')

  const loadVisitors = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      if (localSearch || searchQuery) params.set('search', localSearch || searchQuery)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)

      const [visitorsRes, statsRes] = await Promise.all([
        apiFetch<{ visitors: VisitorType[] }>(`/api/visitors?${params.toString()}`),
        apiFetch<VisitorStats>('/api/visitors?stats=true'),
      ])
      setVisitors(visitorsRes.visitors)
      setStats(statsRes)
    } catch { toast.error('Failed to load visitors') }
    setLoading(false)
  }, [statusFilter, localSearch, searchQuery, dateFrom, dateTo])

  useEffect(() => { loadVisitors() }, [loadVisitors])

  const handleAction = async (visitorId: string, action: string, remark?: string) => {
    try {
      const body: Record<string, unknown> = { status: action }
      if (action === 'Approved' || action === 'Rejected') {
        body.approvedBy = user.name
        if (remark) body.adminRemark = remark
      }
      await apiFetch(`/api/visitors/${visitorId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      })
      toast.success(`Visitor ${action.toLowerCase()} successfully`)
      setRemarkOpen(false)
      setAdminRemark('')
      loadVisitors()
    } catch { toast.error('Failed to update visitor') }
  }

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/visitors/${id}`, { method: 'DELETE' })
      toast.success('Visitor record deleted')
      setDeleteId(null)
      loadVisitors()
    } catch { toast.error('Failed to delete visitor') }
  }

  const filteredVisitors = visitors.filter(v => {
    if (tab === 'pending') return v.status === 'Pending'
    if (tab === 'active') return v.status === 'Checked In'
    if (tab === 'history') return v.status === 'Checked Out' || v.status === 'Rejected'
    return true
  })

  const formatDateTime = (dt: string | null) => {
    if (!dt) return '—'
    return new Date(dt).toLocaleString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
  }

  const formatDate = (dt: string) => {
    return new Date(dt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading || !stats) return <ListSkeleton />

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Home' }, { label: 'Visitor Management', active: true }]} />

      {/* ===== DASHBOARD STATS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 stagger-children">
        <StatCard title="Visitors Today" value={stats.totalToday} icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-900/20" />
        <StatCard title="Active Visitors" value={stats.activeVisitors} icon={<LogIn className="h-4 w-4 sm:h-5 sm:w-5" />} color="text-green-600" bg="bg-green-50 dark:bg-green-900/20" />
        <StatCard title="Pending Approvals" value={stats.pendingApprovals} icon={<Clock className="h-4 w-4 sm:h-5 sm:w-5" />} color="text-amber-600" bg="bg-amber-50 dark:bg-amber-900/20" />
        <StatCard title="Total Records" value={stats.totalAll} icon={<FileText className="h-4 w-4 sm:h-5 sm:w-5" />} color="text-purple-600" bg="bg-purple-50 dark:bg-purple-900/20" />
      </div>

      {/* ===== ACTIVE VISITOR ALERT ===== */}
      {stats.activeVisitors > 0 && (
        <div className="premium-card p-4 flex items-center gap-3 border-l-4 border-blue-500 animate-fade-in">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg shrink-0">
            <LogIn className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Active Visitors Inside Hostel</p>
            <p className="text-xs text-muted-foreground">{stats.activeVisitors} visitor(s) currently checked in to the hostel premises.</p>
          </div>
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">{stats.activeVisitors} Active</Badge>
        </div>
      )}

      {/* ===== SEARCH & FILTERS ===== */}
      <div className="premium-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by visitor name, CNIC, contact..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9 h-9 rounded-xl"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 h-9 rounded-xl">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Checked In">Checked In</SelectItem>
              <SelectItem value="Checked Out">Checked Out</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full sm:w-40 h-9 rounded-xl" placeholder="From date" />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full sm:w-40 h-9 rounded-xl" placeholder="To date" />
          {(statusFilter !== 'all' || dateFrom || dateTo || localSearch) && (
            <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => { setStatusFilter('all'); setLocalSearch(''); setDateFrom(''); setDateTo('') }}>
              <X className="h-3 w-3 mr-1" /> Clear
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-9" onClick={loadVisitors}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* ===== TABS ===== */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pending
            {stats.pendingApprovals > 0 && (
              <span className="ml-1 w-4 h-4 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{stats.pendingApprovals}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {filteredVisitors.length === 0 ? (
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title="No Visitors Found"
              description="No visitor records match your current filters."
            />
          ) : (
            <div className="space-y-3">
              {/* Desktop Table */}
              <div className="hidden lg:block premium-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-semibold">Visitor</TableHead>
                      <TableHead className="font-semibold">CNIC</TableHead>
                      <TableHead className="font-semibold">Student</TableHead>
                      <TableHead className="font-semibold">Room</TableHead>
                      <TableHead className="font-semibold">Visit Date</TableHead>
                      <TableHead className="font-semibold">Entry/Exit</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVisitors.map((v) => (
                      <TableRow key={v.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8 border border-border/50">
                              <AvatarFallback className="bg-gradient-to-br from-[#1e3a5f] to-[#2a5a8f] text-white text-[10px] font-bold">
                                {v.visitorName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{v.visitorName}</p>
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Phone className="h-2.5 w-2.5" /> {v.contactNumber}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{v.cnic}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{v.student?.name || '—'}</p>
                            <p className="text-[11px] text-muted-foreground">{v.student?.rollNo}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <DoorOpen className="h-3.5 w-3.5 text-muted-foreground" />
                            {v.room?.number || v.student?.room?.number || '—'}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(v.visitDate)}</TableCell>
                        <TableCell className="text-xs">
                          <div className="space-y-0.5">
                            <p className="flex items-center gap-1"><LogIn className="h-2.5 w-2.5 text-green-500" /> {formatDateTime(v.entryTime)}</p>
                            <p className="flex items-center gap-1"><LogOut className="h-2.5 w-2.5 text-red-500" /> {formatDateTime(v.exitTime)}</p>
                          </div>
                        </TableCell>
                        <TableCell><VisitorStatusBadge status={v.status} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedVisitor(v); setDetailOpen(true) }} title="View Details">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {v.status === 'Pending' && (
                              <>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:text-green-700" onClick={() => { setSelectedVisitor(v); setRemarkAction('approve'); setRemarkOpen(true) }} title="Approve">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700" onClick={() => { setSelectedVisitor(v); setRemarkAction('reject'); setRemarkOpen(true) }} title="Reject">
                                  <UserX className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                            {v.status === 'Approved' && (
                              <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleAction(v.id, 'Checked In')}>
                                <LogIn className="h-3 w-3 mr-1" /> Check In
                              </Button>
                            )}
                            {v.status === 'Checked In' && (
                              <Button size="sm" className="h-7 text-xs bg-orange-600 hover:bg-orange-700 text-white" onClick={() => handleAction(v.id, 'Checked Out')}>
                                <LogOut className="h-3 w-3 mr-1" /> Check Out
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => setDeleteId(v.id)} title="Delete">
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
                {filteredVisitors.map((v) => (
                  <div key={v.id} className="premium-card p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-border/50">
                          <AvatarFallback className="bg-gradient-to-br from-[#1e3a5f] to-[#2a5a8f] text-white text-xs font-bold">
                            {v.visitorName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm">{v.visitorName}</p>
                          <p className="text-[11px] text-muted-foreground">{v.cnic}</p>
                        </div>
                      </div>
                      <VisitorStatusBadge status={v.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{v.student?.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <DoorOpen className="h-3 w-3" />
                        <span>Room {v.room?.number || v.student?.room?.number || '—'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        <span>{formatDate(v.visitDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{v.contactNumber}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setSelectedVisitor(v); setDetailOpen(true) }}>
                        <Eye className="h-3 w-3 mr-1" /> View
                      </Button>
                      {v.status === 'Pending' && (
                        <>
                          <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => { setSelectedVisitor(v); setRemarkAction('approve'); setRemarkOpen(true) }}>
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                          </Button>
                          <Button size="sm" className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white" onClick={() => { setSelectedVisitor(v); setRemarkAction('reject'); setRemarkOpen(true) }}>
                            <UserX className="h-3 w-3 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                      {v.status === 'Approved' && (
                        <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleAction(v.id, 'Checked In')}>
                          <LogIn className="h-3 w-3 mr-1" /> Check In
                        </Button>
                      )}
                      {v.status === 'Checked In' && (
                        <Button size="sm" className="h-7 text-xs bg-orange-600 hover:bg-orange-700 text-white" onClick={() => handleAction(v.id, 'Checked Out')}>
                          <LogOut className="h-3 w-3 mr-1" /> Check Out
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ===== VISITOR DETAIL DIALOG ===== */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#1e3a5f]" />
              Visitor Details
            </DialogTitle>
          </DialogHeader>
          {selectedVisitor && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                <Avatar className="h-14 w-14 border-2 border-green-400/30">
                  <AvatarFallback className="bg-gradient-to-br from-[#1e3a5f] to-[#2a5a8f] text-white text-lg font-bold">
                    {selectedVisitor.visitorName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-bold">{selectedVisitor.visitorName}</h3>
                  <VisitorStatusBadge status={selectedVisitor.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/20 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">CNIC</p>
                  <p className="text-sm font-mono font-medium">{selectedVisitor.cnic}</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Contact</p>
                  <p className="text-sm font-medium">{selectedVisitor.contactNumber}</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Relation</p>
                  <VisitorRelationBadge relation={selectedVisitor.relationWithStudent} />
                </div>
                <div className="p-3 bg-muted/20 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Visit Purpose</p>
                  <p className="text-sm font-medium">{selectedVisitor.visitPurpose}</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Student</p>
                  <p className="text-sm font-medium">{selectedVisitor.student?.name || '—'}</p>
                  <p className="text-[11px] text-muted-foreground">{selectedVisitor.student?.rollNo} · {selectedVisitor.student?.department}</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Room</p>
                  <p className="text-sm font-medium">{selectedVisitor.room?.number || selectedVisitor.student?.room?.number || '—'}</p>
                  <p className="text-[11px] text-muted-foreground">{selectedVisitor.room?.hostel?.name || selectedVisitor.student?.room?.hostel?.name || ''}</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Visit Date</p>
                  <p className="text-sm font-medium">{formatDate(selectedVisitor.visitDate)}</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Approved By</p>
                  <p className="text-sm font-medium">{selectedVisitor.approvedBy || '—'}</p>
                </div>
              </div>

              {/* Entry/Exit Times */}
              <div className="p-3 bg-muted/20 rounded-lg">
                <p className="text-[10px] text-muted-foreground uppercase font-medium mb-2">Entry & Exit Times</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <LogIn className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Entry</p>
                      <p className="text-sm font-medium">{formatDateTime(selectedVisitor.entryTime)}</p>
                    </div>
                  </div>
                  <Separator orientation="vertical" className="h-8" />
                  <div className="flex items-center gap-2">
                    <LogOut className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Exit</p>
                      <p className="text-sm font-medium">{formatDateTime(selectedVisitor.exitTime)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedVisitor.adminRemark && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg">
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-medium mb-1">Admin Remark</p>
                  <p className="text-sm">{selectedVisitor.adminRemark}</p>
                </div>
              )}

              {/* Action Buttons in Detail */}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {selectedVisitor.status === 'Pending' && (
                  <>
                    <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => { setRemarkAction('approve'); setRemarkOpen(true); setDetailOpen(false) }}>
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
                    </Button>
                    <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => { setRemarkAction('reject'); setRemarkOpen(true); setDetailOpen(false) }}>
                      <UserX className="h-4 w-4 mr-2" /> Reject
                    </Button>
                  </>
                )}
                {selectedVisitor.status === 'Approved' && (
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { handleAction(selectedVisitor.id, 'Checked In'); setDetailOpen(false) }}>
                    <LogIn className="h-4 w-4 mr-2" /> Check In
                  </Button>
                )}
                {selectedVisitor.status === 'Checked In' && (
                  <Button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white" onClick={() => { handleAction(selectedVisitor.id, 'Checked Out'); setDetailOpen(false) }}>
                    <LogOut className="h-4 w-4 mr-2" /> Check Out
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== APPROVE/REJECT WITH REMARK DIALOG ===== */}
      <Dialog open={remarkOpen} onOpenChange={setRemarkOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {remarkAction === 'approve' ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <UserX className="h-5 w-5 text-red-600" />}
              {remarkAction === 'approve' ? 'Approve Visitor' : 'Reject Visitor'}
            </DialogTitle>
          </DialogHeader>
          {selectedVisitor && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="font-medium">{selectedVisitor.visitorName}</p>
                <p className="text-xs text-muted-foreground">Visiting {selectedVisitor.student?.name} · {selectedVisitor.visitPurpose}</p>
              </div>
              <div>
                <Label>Admin Remark (Optional)</Label>
                <Textarea
                  value={adminRemark}
                  onChange={(e) => setAdminRemark(e.target.value)}
                  placeholder="Add a remark or reason..."
                  className="mt-1.5"
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setRemarkOpen(false); setAdminRemark('') }}>Cancel</Button>
                <Button
                  className={remarkAction === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
                  onClick={() => handleAction(selectedVisitor.id, remarkAction === 'approve' ? 'Approved' : 'Rejected', adminRemark)}
                >
                  {remarkAction === 'approve' ? 'Approve' : 'Reject'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== DELETE CONFIRMATION ===== */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Visitor Record</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this visitor record? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => deleteId && handleDelete(deleteId)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ===================== STUDENT VISITOR REQUESTS =====================
export function StudentVisitors({ user }: { user: UserType }) {
  const [visitors, setVisitors] = useState<VisitorType[]>([])
  const [students, setStudents] = useState<StudentType[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [detailVisitor, setDetailVisitor] = useState<VisitorType | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [studentProfile, setStudentProfile] = useState<StudentType | null>(null)

  // Form state
  const [form, setForm] = useState({
    visitorName: '', cnic: '', contactNumber: '', relationWithStudent: 'Other',
    visitPurpose: 'Personal Visit', visitDate: '', roomId: '',
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // Get student profile
      const profileRes = await apiFetch<StudentType[]>(`/api/students?userId=${user.id}`)
      const profile = profileRes[0] || null
      setStudentProfile(profile)

      if (profile) {
        const visRes = await apiFetch<{ visitors: VisitorType[] }>(`/api/visitors?studentId=${profile.id}`)
        setVisitors(visRes.visitors)
      }
    } catch { toast.error('Failed to load visitors') }
    setLoading(false)
  }, [user.id])

  useEffect(() => { loadData() }, [loadData])

  const handleSubmit = async () => {
    if (!form.visitorName || !form.cnic || !form.contactNumber || !form.visitDate || !studentProfile) {
      toast.error('Please fill all required fields')
      return
    }
    try {
      await apiFetch('/api/visitors', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          studentId: studentProfile.id,
          roomId: studentProfile.roomId || form.roomId || null,
        }),
      })
      toast.success('Visitor request submitted successfully!')
      setAddOpen(false)
      setForm({ visitorName: '', cnic: '', contactNumber: '', relationWithStudent: 'Other', visitPurpose: 'Personal Visit', visitDate: '', roomId: '' })
      loadData()
    } catch { toast.error('Failed to submit visitor request') }
  }

  const formatDateTime = (dt: string | null) => {
    if (!dt) return '—'
    return new Date(dt).toLocaleString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
  }

  const formatDate = (dt: string) => {
    return new Date(dt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const pendingCount = visitors.filter(v => v.status === 'Pending').length
  const approvedCount = visitors.filter(v => v.status === 'Approved' || v.status === 'Checked In').length
  const completedCount = visitors.filter(v => v.status === 'Checked Out').length

  if (loading) return <ListSkeleton />

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Home' }, { label: 'Visitor Management', active: true }]} />

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
        <StatCard title="Total Requests" value={visitors.length} icon={<FileText className="h-5 w-5" />} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-900/20" />
        <StatCard title="Pending" value={pendingCount} icon={<Clock className="h-5 w-5" />} color="text-amber-600" bg="bg-amber-50 dark:bg-amber-900/20" />
        <StatCard title="Approved/Active" value={approvedCount} icon={<CheckCircle2 className="h-5 w-5" />} color="text-green-600" bg="bg-green-50 dark:bg-green-900/20" />
        <StatCard title="Completed" value={completedCount} icon={<Activity className="h-5 w-5" />} color="text-purple-600" bg="bg-purple-50 dark:bg-purple-900/20" />
      </div>

      {/* ===== REQUEST BUTTON ===== */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">My Visitor Requests</h3>
        <Button className="btn-green-glow text-white gap-2" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Request Visitor
        </Button>
      </div>

      {/* ===== VISITOR LIST ===== */}
      {visitors.length === 0 ? (
        <EmptyState
          icon={<Users className="h-10 w-10" />}
          title="No Visitor Requests"
          description="You haven't submitted any visitor requests yet. Click 'Request Visitor' to add one."
          action={
            <Button className="btn-green-glow text-white gap-2" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" /> Request Visitor
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {visitors.map((v) => (
            <div key={v.id} className="premium-card p-4 card-hover transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-border/50">
                    <AvatarFallback className="bg-gradient-to-br from-[#1e3a5f] to-[#2a5a8f] text-white text-xs font-bold">
                      {v.visitorName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{v.visitorName}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Phone className="h-2.5 w-2.5" /> {v.contactNumber}</p>
                  </div>
                </div>
                <VisitorStatusBadge status={v.status} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <CreditCard className="h-3 w-3" />
                  <span className="font-mono">{v.cnic}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  <span>{formatDate(v.visitDate)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{v.visitPurpose}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <DoorOpen className="h-3 w-3" />
                  <span>Room {v.room?.number || v.student?.room?.number || '—'}</span>
                </div>
              </div>

              {/* Entry/Exit times if checked in/out */}
              {(v.entryTime || v.exitTime) && (
                <div className="flex items-center gap-4 mb-3 text-xs">
                  {v.entryTime && (
                    <div className="flex items-center gap-1.5">
                      <LogIn className="h-3 w-3 text-green-500" />
                      <span className="text-muted-foreground">Entry:</span>
                      <span className="font-medium">{formatDateTime(v.entryTime)}</span>
                    </div>
                  )}
                  {v.exitTime && (
                    <div className="flex items-center gap-1.5">
                      <LogOut className="h-3 w-3 text-red-500" />
                      <span className="text-muted-foreground">Exit:</span>
                      <span className="font-medium">{formatDateTime(v.exitTime)}</span>
                    </div>
                  )}
                </div>
              )}

              {v.adminRemark && (
                <div className="p-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg text-xs mb-3">
                  <span className="font-medium text-amber-600 dark:text-amber-400">Admin: </span>
                  <span className="text-amber-700 dark:text-amber-300">{v.adminRemark}</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setDetailVisitor(v); setDetailOpen(true) }}>
                  <Eye className="h-3 w-3 mr-1" /> View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== ADD VISITOR DIALOG ===== */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" />
              Request Visitor Approval
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Visitor Full Name <span className="text-red-500">*</span></Label>
              <Input
                value={form.visitorName}
                onChange={(e) => setForm(f => ({ ...f, visitorName: e.target.value }))}
                placeholder="Enter visitor's full name"
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">CNIC Number <span className="text-red-500">*</span></Label>
                <Input
                  value={form.cnic}
                  onChange={(e) => setForm(f => ({ ...f, cnic: e.target.value }))}
                  placeholder="XXXXX-XXXXXXX-X"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Contact Number <span className="text-red-500">*</span></Label>
                <Input
                  value={form.contactNumber}
                  onChange={(e) => setForm(f => ({ ...f, contactNumber: e.target.value }))}
                  placeholder="03XX-XXXXXXX"
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Relation with Student</Label>
                <Select value={form.relationWithStudent} onValueChange={(v) => setForm(f => ({ ...f, relationWithStudent: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VISITOR_RELATIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Visit Purpose</Label>
                <Select value={form.visitPurpose} onValueChange={(v) => setForm(f => ({ ...f, visitPurpose: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VISIT_PURPOSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Visit Date <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={form.visitDate}
                onChange={(e) => setForm(f => ({ ...f, visitDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="mt-1.5"
              />
            </div>

            {studentProfile && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground font-medium mb-1">Student Details (Auto-filled)</p>
                <p className="text-sm font-medium">{studentProfile.user?.name || user.name}</p>
                <p className="text-xs text-muted-foreground">{studentProfile.rollNo} · {studentProfile.department} · Room {studentProfile.room?.number || 'N/A'}</p>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button className="btn-green-glow text-white" onClick={handleSubmit}>
                Submit Request
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== VISITOR DETAIL DIALOG ===== */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#1e3a5f]" />
              Visitor Details
            </DialogTitle>
          </DialogHeader>
          {detailVisitor && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                <Avatar className="h-14 w-14 border-2 border-green-400/30">
                  <AvatarFallback className="bg-gradient-to-br from-[#1e3a5f] to-[#2a5a8f] text-white text-lg font-bold">
                    {detailVisitor.visitorName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-bold">{detailVisitor.visitorName}</h3>
                  <VisitorStatusBadge status={detailVisitor.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/20 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">CNIC</p>
                  <p className="text-sm font-mono font-medium">{detailVisitor.cnic}</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Contact</p>
                  <p className="text-sm font-medium">{detailVisitor.contactNumber}</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Relation</p>
                  <VisitorRelationBadge relation={detailVisitor.relationWithStudent} />
                </div>
                <div className="p-3 bg-muted/20 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Purpose</p>
                  <p className="text-sm font-medium">{detailVisitor.visitPurpose}</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Visit Date</p>
                  <p className="text-sm font-medium">{formatDate(detailVisitor.visitDate)}</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Room</p>
                  <p className="text-sm font-medium">{detailVisitor.room?.number || detailVisitor.student?.room?.number || '—'}</p>
                </div>
              </div>

              {(detailVisitor.entryTime || detailVisitor.exitTime) && (
                <div className="p-3 bg-muted/20 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium mb-2">Entry & Exit</p>
                  <div className="flex items-center gap-4">
                    {detailVisitor.entryTime && (
                      <div className="flex items-center gap-2">
                        <LogIn className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">Entry</p>
                          <p className="text-sm font-medium">{formatDateTime(detailVisitor.entryTime)}</p>
                        </div>
                      </div>
                    )}
                    {detailVisitor.exitTime && (
                      <>
                        <Separator orientation="vertical" className="h-8" />
                        <div className="flex items-center gap-2">
                          <LogOut className="h-4 w-4 text-red-500" />
                          <div>
                            <p className="text-[10px] text-muted-foreground">Exit</p>
                            <p className="text-sm font-medium">{formatDateTime(detailVisitor.exitTime)}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {detailVisitor.adminRemark && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg">
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-medium mb-1">Admin Remark</p>
                  <p className="text-sm">{detailVisitor.adminRemark}</p>
                </div>
              )}

              {detailVisitor.approvedBy && (
                <div className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-lg">
                  <p className="text-[10px] text-green-600 dark:text-green-400 uppercase font-medium mb-1">Approved By</p>
                  <p className="text-sm font-medium">{detailVisitor.approvedBy}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
