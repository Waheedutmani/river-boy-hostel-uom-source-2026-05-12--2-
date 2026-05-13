'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Building2, DoorOpen, Users, Home, Search, Wrench, BedDouble,
  ChevronRight, Eye, UserPlus, ArrowRightLeft, AlertTriangle,
  CheckCircle, XCircle, Clock, Plus, Minus, Filter, SortAsc,
  LayoutGrid, List, ChevronDown, ChevronUp, UserX, Shield,
  Phone, Mail, ArrowUpRight, Building, Layers, Hash,
  AlertCircle, Info, Sparkles, RefreshCw, X, ArrowRight,
  Circle, CircleDot, Bed, User, MoveRight, WrenchIcon,
  BarChart3, PieChart as PieChartIcon
} from 'lucide-react'

import {
  formatPKR, apiFetch, RoomStatusBadge, CategoryBadge, PriorityBadge,
  ListSkeleton, EmptyState,
  type RoomType, type HostelType, type StudentType, type MaintenanceType,
  DEPARTMENTS,
} from '@/components/shared-components'
import { StatCard } from '@/components/shared-components'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

// ===================== TYPES =====================
interface RoomStudent {
  id: string; name: string; email: string; phone: string; avatar: string | null;
  rollNo: string; department: string; semester: number; status: string;
  hasPendingFees: boolean; isOnLeave: boolean;
}

interface RoomMaintenance {
  id: string; title: string; category: string; status: string; priority: string; createdAt: string;
}

interface DetailedRoom extends RoomType {
  hostel: { id: string; name: string; type: string }
  students: RoomStudent[]
  maintenanceHistory: RoomMaintenance[]
  _count: { students: number; maintenanceRequests: number }
}

interface DetailedHostel extends HostelType {
  totalCapacity: number; availableRooms: number; occupiedRooms: number; maintenanceRooms: number;
  floors: number[]
}

interface UnassignedStudent {
  id: string; name: string; email: string; rollNo: string; department: string; semester: number;
}

interface ApiResponse {
  rooms: DetailedRoom[]
  hostels: DetailedHostel[]
  unassignedStudents: UnassignedStudent[]
}

type StatusFilter = 'all' | 'Available' | 'Occupied' | 'Maintenance'
type SortOption = 'number' | 'occupancy' | 'status'

// ===================== CONSTANTS =====================
const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; glow: string; dot: string }> = {
  Available: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-l-green-500 dark:border-l-green-400',
    text: 'text-green-700 dark:text-green-300',
    glow: 'hover:shadow-green-200/50 dark:hover:shadow-green-900/30',
    dot: 'bg-green-500',
  },
  Occupied: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-l-red-500 dark:border-l-red-400',
    text: 'text-red-700 dark:text-red-300',
    glow: 'hover:shadow-red-200/50 dark:hover:shadow-red-900/30',
    dot: 'bg-red-500',
  },
  Maintenance: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-l-yellow-500 dark:border-l-yellow-400',
    text: 'text-yellow-700 dark:text-yellow-300',
    glow: 'hover:shadow-yellow-200/50 dark:hover:shadow-yellow-900/30',
    dot: 'bg-yellow-500',
  },
  Reserved: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-l-blue-500 dark:border-l-blue-400',
    text: 'text-blue-700 dark:text-blue-300',
    glow: 'hover:shadow-blue-200/50 dark:hover:shadow-blue-900/30',
    dot: 'bg-blue-500',
  },
}

const FLOOR_LABELS: Record<number, string> = {
  0: 'Ground Floor',
  1: '1st Floor',
  2: '2nd Floor',
  3: '3rd Floor',
  4: '4th Floor',
  5: '5th Floor',
}

const CHART_COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6']

// ===================== ANIMATED COUNTER HOOK =====================
function useAnimatedCounter(target: number, duration = 800) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const increment = target / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return count
}

// ===================== ANIMATED STAT CARD =====================
function AnimatedStatCard({ title, value, icon, color, bg }: {
  title: string; value: number; icon: React.ReactNode; color: string; bg: string
}) {
  const animatedValue = useAnimatedCounter(value)
  return (
    <div className="dashboard-stat-card stat-card-shimmer">
      <div className="flex items-center gap-4 relative z-10">
        <div className={`stat-icon ${bg} shadow-sm`}>
          <div className={color}>{icon}</div>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold truncate mt-0.5">{animatedValue}</p>
        </div>
      </div>
    </div>
  )
}

// ===================== BED VISUALIZATION =====================
function BedVisualization({ capacity, occupied, students }: {
  capacity: number; occupied: number; students: RoomStudent[]
}) {
  const beds = Array.from({ length: capacity }, (_, i) => ({
    index: i,
    occupied: i < occupied,
    student: students[i] || null,
  }))

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {beds.map((bed) => (
        <TooltipProvider key={bed.index}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={`
                  w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
                  transition-all duration-200 cursor-default
                  ${bed.occupied
                    ? 'bg-gradient-to-br from-red-400 to-red-500 text-white shadow-sm shadow-red-200 dark:from-red-600 dark:to-red-700'
                    : 'bg-green-50 border-2 border-dashed border-green-300 text-green-500 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400'
                  }
                `}
              >
                {bed.occupied ? <Bed className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {bed.occupied && bed.student
                ? `${bed.student.name} (${bed.student.rollNo})`
                : `Bed ${bed.index + 1} — Available`}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      <span className="text-xs font-semibold text-muted-foreground ml-1">
        {occupied}/{capacity}
      </span>
    </div>
  )
}

// ===================== ROOM CARD =====================
function RoomCard({
  room, onClick, onAllocate, onMaintenance
}: {
  room: DetailedRoom
  onClick: () => void
  onAllocate: () => void
  onMaintenance: () => void
}) {
  const statusStyle = STATUS_COLORS[room.status] || STATUS_COLORS.Available
  const occupied = room.students?.length || room._count?.students || 0
  const hasSpace = occupied < room.capacity && room.status !== 'Maintenance'
  const hasMaintenance = (room.maintenanceHistory?.length || 0) > 0 || room._count?.maintenanceRequests > 0
  const hasPendingFees = room.students?.some(s => s.hasPendingFees) || false
  const hasOnLeave = room.students?.some(s => s.isOnLeave) || false

  return (
    <div
      className={`
        glass-card-glow rounded-xl border-l-4 ${statusStyle.border}
        cursor-pointer transition-all duration-300
        hover:-translate-y-1 hover:shadow-lg ${statusStyle.glow}
        animate-fade-in-up
      `}
      onClick={onClick}
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{room.number}</span>
            <div className={`w-2.5 h-2.5 rounded-full ${statusStyle.dot} ${room.status === 'Maintenance' ? 'animate-pulse-soft' : ''}`} />
          </div>
          <Badge variant="outline" className="text-[10px] font-medium">
            {room.capacity}-Seater
          </Badge>
        </div>

        {/* Bed Visualization */}
        <BedVisualization
          capacity={room.capacity}
          occupied={occupied}
          students={room.students || []}
        />

        {/* Occupancy Progress */}
        <div className="space-y-1">
          <div className="premium-progress">
            <div
              className={`premium-progress-bar transition-all duration-500 ${
                occupied >= room.capacity ? 'bg-red-500' : occupied === 0 ? 'bg-green-500' : 'bg-amber-500'
              }`}
              style={{ width: `${room.capacity > 0 ? (occupied / room.capacity) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Student Names */}
        {room.students && room.students.length > 0 && (
          <div className="space-y-1">
            {room.students.slice(0, 3).map((student) => (
              <div key={student.id} className="flex items-center gap-1.5 text-xs">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2a5a8f] flex items-center justify-center text-white text-[8px] font-bold shrink-0">
                  {student.name.charAt(0)}
                </div>
                <span className="truncate text-muted-foreground">
                  {student.name.split(' ')[0]} <span className="text-[10px] opacity-70">({student.rollNo})</span>
                </span>
                {student.isOnLeave && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" title="On Leave" />
                )}
                {student.hasPendingFees && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Has Dues" />
                )}
              </div>
            ))}
            {room.students.length > 3 && (
              <p className="text-[10px] text-muted-foreground pl-6">+{room.students.length - 3} more</p>
            )}
          </div>
        )}

        {/* Status Indicators */}
        {(hasPendingFees || hasOnLeave) && (
          <div className="flex items-center gap-2 flex-wrap">
            {hasPendingFees && (
              <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Has dues
              </span>
            )}
            {hasOnLeave && (
              <span className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> On Leave
              </span>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/30">
          <Button
            variant="ghost" size="sm"
            className="h-7 text-[11px] gap-1 flex-1 hover:bg-[#1e3a5f]/5"
            onClick={(e) => { e.stopPropagation(); onClick() }}
          >
            <Eye className="h-3 w-3" /> Details
          </Button>
          {hasSpace && (
            <Button
              variant="ghost" size="sm"
              className="h-7 text-[11px] gap-1 flex-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
              onClick={(e) => { e.stopPropagation(); onAllocate() }}
            >
              <UserPlus className="h-3 w-3" /> Allocate
            </Button>
          )}
          {hasMaintenance && (
            <Button
              variant="ghost" size="sm"
              className="h-7 text-[11px] gap-1 flex-1 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              onClick={(e) => { e.stopPropagation(); onMaintenance() }}
            >
              <Wrench className="h-3 w-3" /> Fix
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ===================== ROOM DETAIL MODAL =====================
function RoomDetailModal({
  room, open, onClose, onRefresh
}: {
  room: DetailedRoom | null; open: boolean; onClose: () => void; onRefresh: () => void
}) {
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [allocateOpen, setAllocateOpen] = useState(false)
  const [transferStudent, setTransferStudent] = useState<RoomStudent | null>(null)
  const [maintenanceOpen, setMaintenanceOpen] = useState(false)

  if (!room) return null

  const occupied = room.students?.length || 0
  const availableBeds = room.capacity - occupied
  const statusStyle = STATUS_COLORS[room.status] || STATUS_COLORS.Available

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <DoorOpen className="h-5 w-5" />
                  Room {room.number}
                  <RoomStatusBadge status={room.status} />
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {room.hostel?.name} &middot; {FLOOR_LABELS[room.floor] || `Floor ${room.floor}`}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted/40 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{room.capacity}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Capacity</p>
              </div>
              <div className="bg-muted/40 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-red-600">{occupied}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Occupied</p>
              </div>
              <div className="bg-muted/40 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{availableBeds}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Available</p>
              </div>
            </div>

            {/* Occupancy Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Occupancy</span>
                <span className="text-muted-foreground">{occupied}/{room.capacity} beds</span>
              </div>
              <Progress value={room.capacity > 0 ? (occupied / room.capacity) * 100 : 0} className="h-3" />
            </div>

            <Separator />

            {/* Bed Allocation Visual */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <BedDouble className="h-4 w-4" /> Bed Allocation
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: room.capacity }, (_, i) => {
                  const student = room.students?.[i] || null
                  return (
                    <div
                      key={i}
                      className={`rounded-lg p-3 border transition-all ${
                        student
                          ? 'bg-red-50/50 border-red-200/50 dark:bg-red-900/10 dark:border-red-800/30'
                          : 'bg-green-50/50 border-green-200/50 dark:bg-green-900/10 dark:border-green-800/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground">Bed {i + 1}</span>
                        {student ? (
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                        ) : (
                          <Button
                            size="sm" variant="ghost"
                            className="h-5 w-5 p-0 text-green-600"
                            onClick={() => setAllocateOpen(true)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      {student ? (
                        <div className="mt-1.5 flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[9px] bg-gradient-to-br from-[#1e3a5f] to-[#2a5a8f] text-white">
                              {student.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{student.name}</p>
                            <p className="text-[10px] text-muted-foreground">{student.rollNo}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-green-600 dark:text-green-400 mt-1">Empty</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <Separator />

            {/* Student Occupancy */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" /> Students in Room
              </h4>
              {room.students && room.students.length > 0 ? (
                <div className="space-y-2">
                  {room.students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-8 w-8 border border-border/50">
                          <AvatarFallback className="bg-gradient-to-br from-[#1e3a5f] to-[#2a5a8f] text-white text-xs font-bold">
                            {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{student.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {student.rollNo} &middot; {student.department} &middot; Sem {student.semester}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {student.isOnLeave && (
                          <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                            On Leave
                          </Badge>
                        )}
                        {student.hasPendingFees && (
                          <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800">
                            Has Dues
                          </Badge>
                        )}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost" size="sm"
                                className="h-7 w-7 p-0 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                onClick={() => setTransferStudent(student)}
                              >
                                <ArrowRightLeft className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Transfer Student</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost" size="sm"
                                className="h-7 w-7 p-0 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={async () => {
                                  try {
                                    await apiFetch(`/api/students/${student.id}`, {
                                      method: 'PUT',
                                      body: JSON.stringify({ roomId: null }),
                                    })
                                    toast.success(`${student.name} removed from room`)
                                    onRefresh()
                                  } catch (err: unknown) {
                                    toast.error(err instanceof Error ? err.message : 'Failed to remove student')
                                  }
                                }}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Remove from Room</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No students currently in this room</p>
              )}
              {availableBeds > 0 && (
                <Button
                  variant="outline" size="sm"
                  className="w-full mt-3 border-dashed text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                  onClick={() => setAllocateOpen(true)}
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Allocate Student to Room
                </Button>
              )}
            </div>

            {/* Maintenance History */}
            {room.maintenanceHistory && room.maintenanceHistory.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Wrench className="h-4 w-4" /> Maintenance History
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                    {room.maintenanceHistory.map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-xs">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{m.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <CategoryBadge category={m.category} />
                            <PriorityBadge priority={m.priority} />
                          </div>
                        </div>
                        <div className="shrink-0 ml-2 text-right">
                          <Badge variant="outline" className={`text-[9px] ${
                            m.status === 'Resolved' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-300' :
                            m.status === 'In Progress' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300' :
                            'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300'
                          }`}>{m.status}</Badge>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(m.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Select onValueChange={async (val) => {
                try {
                  await apiFetch(`/api/rooms/${room.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ status: val }),
                  })
                  toast.success(`Room status changed to ${val}`)
                  onRefresh()
                  setStatusDialogOpen(false)
                } catch (err: unknown) {
                  toast.error(err instanceof Error ? err.message : 'Failed to change status')
                }
              }}>
                <SelectTrigger className="w-44 h-9">
                  <SelectValue placeholder="Change Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Occupied">Occupied</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
              {availableBeds > 0 && (
                <Button variant="outline" size="sm" className="h-9" onClick={() => setAllocateOpen(true)}>
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Allocate
                </Button>
              )}
              <Button
                variant="outline" size="sm" className="h-9"
                onClick={() => setMaintenanceOpen(true)}
              >
                <Wrench className="h-3.5 w-3.5 mr-1.5" /> Maintenance
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-dialogs */}
      {room && allocateOpen && (
        <AllocateDialog
          open={allocateOpen}
          onClose={() => setAllocateOpen(false)}
          room={room}
          unassignedStudents={[]}
          onRefresh={onRefresh}
        />
      )}
      {room && transferStudent && (
        <TransferDialog
          open={!!transferStudent}
          onClose={() => setTransferStudent(null)}
          student={transferStudent}
          currentRoom={room}
          onRefresh={onRefresh}
        />
      )}
      {room && maintenanceOpen && (
        <MaintenanceDialog
          open={maintenanceOpen}
          onClose={() => setMaintenanceOpen(false)}
          room={room}
          onRefresh={onRefresh}
        />
      )}
    </>
  )
}

// ===================== ALLOCATE DIALOG =====================
function AllocateDialog({
  open, onClose, room, unassignedStudents: initialStudents, onRefresh
}: {
  open: boolean; onClose: () => void; room: DetailedRoom;
  unassignedStudents: UnassignedStudent[]; onRefresh: () => void
}) {
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [unassigned, setUnassigned] = useState<UnassignedStudent[]>(initialStudents)
  const [allocating, setAllocating] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    apiFetch<ApiResponse>(`/api/rooms?detailed=true&hostelId=${room.hostelId}`)
      .then(data => setUnassigned(data.unassignedStudents || []))
      .catch(() => toast.error('Failed to load unassigned students'))
  }, [open, room.hostelId])

  const filtered = useMemo(() => {
    return unassigned.filter(s => {
      const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNo.toLowerCase().includes(search.toLowerCase()) || s.department.toLowerCase().includes(search.toLowerCase())
      const matchesDept = deptFilter === 'all' || s.department === deptFilter
      return matchesSearch && matchesDept
    })
  }, [unassigned, search, deptFilter])

  const handleAllocate = async (studentId: string) => {
    setAllocating(studentId)
    try {
      await apiFetch(`/api/students/${studentId}`, {
        method: 'PUT',
        body: JSON.stringify({ roomId: room.id }),
      })
      toast.success('Student allocated successfully')
      onRefresh()
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to allocate student')
    }
    setAllocating(null)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-green-500" />
            Allocate Student — Room {room.number}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {room.hostel?.name} &middot; {FLOOR_LABELS[room.floor]} &middot; {room.students?.length || 0}/{room.capacity} beds
          </p>
        </DialogHeader>

        <div className="space-y-3">
          {/* Search */}
          <div className="relative premium-input">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground input-icon" />
            <Input
              placeholder="Search by name, roll no, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Department Filter */}
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Filter by Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENTS.map(d => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Students List */}
          <ScrollArea className="h-72">
            {unassigned.length === 0 && initialStudents.length === 0 ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-2 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<UserX className="h-6 w-6" />}
                title="No Students Found"
                description="No unassigned students match your search criteria"
              />
            ) : (
              <div className="space-y-1.5 p-1">
                {filtered.map(student => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                    onClick={() => handleAllocate(student.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-8 w-8 border border-border/50">
                        <AvatarFallback className="bg-gradient-to-br from-[#1e3a5f] to-[#2a5a8f] text-white text-xs font-bold">
                          {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{student.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {student.rollNo} &middot; {student.department} &middot; Sem {student.semester}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm" variant="ghost"
                      className="shrink-0 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={allocating === student.id}
                    >
                      {allocating === student.id ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UserPlus className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <p className="text-[10px] text-muted-foreground text-center">
            {filtered.length} unassigned student{filtered.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ===================== TRANSFER DIALOG =====================
function TransferDialog({
  open, onClose, student, currentRoom, onRefresh
}: {
  open: boolean; onClose: () => void; student: RoomStudent;
  currentRoom: DetailedRoom; onRefresh: () => void
}) {
  const [search, setSearch] = useState('')
  const [hostelFilter, setHostelFilter] = useState<string>('all')
  const [rooms, setRooms] = useState<DetailedRoom[]>([])
  const [transferring, setTransferring] = useState(false)
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (!open) return
    apiFetch<ApiResponse>('/api/rooms?detailed=true')
      .then(data => {
        const available = data.rooms.filter(r =>
          r.status !== 'Maintenance' && r.id !== currentRoom.id &&
          (r.students?.length || r._count?.students || 0) < r.capacity
        )
        setRooms(available)
      })
      .catch(() => toast.error('Failed to load available rooms'))
  }, [open, currentRoom.id])

  const filtered = useMemo(() => {
    return rooms.filter(r => {
      const matchesSearch = !search || r.number.toLowerCase().includes(search.toLowerCase())
      const matchesHostel = hostelFilter === 'all' || r.hostelId === hostelFilter
      return matchesSearch && matchesHostel
    })
  }, [rooms, search, hostelFilter])

  const handleTransfer = async (newRoom: DetailedRoom) => {
    setTransferring(true)
    try {
      await apiFetch(`/api/students/${student.id}`, {
        method: 'PUT',
        body: JSON.stringify({ roomId: newRoom.id }),
      })
      toast.success(`${student.name} transferred to Room ${newRoom.number}`)
      onRefresh()
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to transfer student')
    }
    setTransferring(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-orange-500" />
            Transfer Student
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Move <strong>{student.name}</strong> ({student.rollNo}) from Room {currentRoom.number}
          </p>
        </DialogHeader>

        <div className="space-y-3">
          {/* Reason */}
          <div>
            <Label className="text-xs">Reason for Transfer (optional)</Label>
            <Input
              placeholder="e.g., Student request, room reshuffling..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-9 mt-1"
            />
          </div>

          {/* Search */}
          <div className="relative premium-input">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground input-icon" />
            <Input
              placeholder="Search room number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Available Rooms */}
          <ScrollArea className="h-64">
            {rooms.length === 0 ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<DoorOpen className="h-6 w-6" />}
                title="No Rooms Available"
                description="No rooms with available beds match your search"
              />
            ) : (
              <div className="space-y-1.5 p-1">
                {filtered.map(room => {
                  const occ = room.students?.length || room._count?.students || 0
                  return (
                    <div
                      key={room.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                      onClick={() => handleTransfer(room)}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">Room {room.number}</span>
                          <Badge variant="outline" className="text-[9px]">{room.capacity}-Seater</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {room.hostel?.name} &middot; {FLOOR_LABELS[room.floor]} &middot; {occ}/{room.capacity} occupied
                        </p>
                      </div>
                      <Button
                        size="sm" variant="ghost"
                        className="shrink-0 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={transferring}
                      >
                        {transferring ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <MoveRight className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ===================== MAINTENANCE DIALOG =====================
function MaintenanceDialog({
  open, onClose, room, onRefresh
}: {
  open: boolean; onClose: () => void; room: DetailedRoom; onRefresh: () => void
}) {
  const [changing, setChanging] = useState(false)

  const handleChangeStatus = async (newStatus: string) => {
    setChanging(true)
    try {
      await apiFetch(`/api/rooms/${room.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      })
      toast.success(`Room ${room.number} status changed to ${newStatus}`)
      onRefresh()
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to change room status')
    }
    setChanging(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-amber-500" />
            Room Maintenance — {room.number}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {room.hostel?.name} &middot; {FLOOR_LABELS[room.floor]}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <span className="text-sm font-medium">Current Status</span>
            <RoomStatusBadge status={room.status} />
          </div>

          {/* Change Status Buttons */}
          <div className="space-y-2">
            <Label className="text-xs">Change Room Status</Label>
            <div className="grid grid-cols-1 gap-2">
              {room.status !== 'Available' && (
                <Button
                  variant="outline" size="sm"
                  className="justify-start h-10 border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900/20"
                  disabled={changing}
                  onClick={() => handleChangeStatus('Available')}
                >
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Mark as Available
                </Button>
              )}
              {room.status !== 'Maintenance' && (
                <Button
                  variant="outline" size="sm"
                  className="justify-start h-10 border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-900/20"
                  disabled={changing}
                  onClick={() => handleChangeStatus('Maintenance')}
                >
                  <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                  Mark as Maintenance
                </Button>
              )}
              {room.status !== 'Occupied' && (
                <Button
                  variant="outline" size="sm"
                  className="justify-start h-10 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                  disabled={changing}
                  onClick={() => handleChangeStatus('Occupied')}
                >
                  <Users className="h-4 w-4 mr-2 text-red-500" />
                  Mark as Occupied
                </Button>
              )}
            </div>
          </div>

          {/* Maintenance History */}
          {room.maintenanceHistory && room.maintenanceHistory.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-xs font-semibold mb-2 uppercase tracking-wider text-muted-foreground">
                  Maintenance History
                </h4>
                <ScrollArea className="h-40">
                  <div className="space-y-1.5">
                    {room.maintenanceHistory.map(m => (
                      <div key={m.id} className="p-2 rounded-lg bg-muted/30 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{m.title}</span>
                          <PriorityBadge priority={m.priority} />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <CategoryBadge category={m.category} />
                          <Badge variant="outline" className="text-[9px]">{m.status}</Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(m.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ===================== ROOM ANALYTICS =====================
function RoomAnalytics({ rooms }: { rooms: DetailedRoom[] }) {
  const available = rooms.filter(r => r.status === 'Available').length
  const occupied = rooms.filter(r => r.status === 'Occupied').length
  const maintenance = rooms.filter(r => r.status === 'Maintenance').length

  const pieData = [
    { name: 'Available', value: available, fill: '#22c55e' },
    { name: 'Occupied', value: occupied, fill: '#ef4444' },
    { name: 'Maintenance', value: maintenance, fill: '#f59e0b' },
  ].filter(d => d.value > 0)

  // Floor-wise data
  const floorMap = new Map<number, { total: number; occupied: number; available: number; maintenance: number }>()
  rooms.forEach(r => {
    const existing = floorMap.get(r.floor) || { total: 0, occupied: 0, available: 0, maintenance: 0 }
    existing.total++
    if (r.status === 'Occupied') existing.occupied++
    else if (r.status === 'Available') existing.available++
    else existing.maintenance++
    floorMap.set(r.floor, existing)
  })

  const floorData = Array.from(floorMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([floor, data]) => ({
      floor: FLOOR_LABELS[floor] || `Floor ${floor}`,
      Occupied: data.occupied,
      Available: data.available,
      Maintenance: data.maintenance,
    }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Occupancy Pie Chart */}
      <Card className="chart-container premium-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChartIcon className="h-4 w-4 text-green-500" />
            Occupancy Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={75}
                  dataKey="value" stroke="none"
                  animationBegin={0} animationDuration={800}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value: number, name: string) => [`${value} rooms`, name]}
                  contentStyle={{ borderRadius: '0.75rem', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1 w-full">
              {pieData.map(item => (
                <div key={item.name} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{item.value}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {rooms.length > 0 ? Math.round((item.value / rooms.length) * 100) : 0}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Floor-wise Bar Chart */}
      <Card className="chart-container premium-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-[#1e3a5f]" />
            Floor-wise Occupancy
          </CardTitle>
        </CardHeader>
        <CardContent>
          {floorData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={floorData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.08)" />
                <XAxis dataKey="floor" tick={{ fontSize: 10 }} stroke="rgba(30,58,95,0.3)" />
                <YAxis tick={{ fontSize: 10 }} stroke="rgba(30,58,95,0.3)" />
                <RechartsTooltip
                  contentStyle={{ borderRadius: '0.75rem', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Available" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} animationDuration={800} />
                <Bar dataKey="Occupied" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} animationDuration={800} />
                <Bar dataKey="Maintenance" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
              No room data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ===================== UNASSIGNED STUDENTS PANEL =====================
function UnassignedStudentsPanel({
  students, onAllocate
}: {
  students: UnassignedStudent[]; onAllocate: (student: UnassignedStudent) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search) return students
    return students.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase())
    )
  }, [students, search])

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="premium-card">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/20 transition-colors rounded-t-xl">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserX className="h-5 w-5 text-orange-500" />
                Unassigned Students
                <Badge variant="secondary" className="text-xs ml-1">{students.length}</Badge>
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
            <CardDescription className="text-xs">Students without room allocation</CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            {/* Search */}
            <div className="relative premium-input">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground input-icon" />
              <Input
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>

            {/* Students List */}
            <ScrollArea className="max-h-64">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No unassigned students</p>
              ) : (
                <div className="space-y-1.5">
                  {filtered.map(student => (
                    <div key={student.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-7 w-7 border border-border/50">
                          <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white text-[9px] font-bold">
                            {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{student.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {student.rollNo} &middot; {student.department} &middot; Sem {student.semester}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline" size="sm"
                        className="shrink-0 h-7 text-[10px] gap-1 text-green-600 border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900/20"
                        onClick={() => onAllocate(student)}
                      >
                        <UserPlus className="h-3 w-3" /> Assign
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

// ===================== MAIN COMPONENT =====================
export function RoomVisualization() {
  // Data State
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)

  // UI State
  const [selectedHostelId, setSelectedHostelId] = useState<string>('')
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOption, setSortOption] = useState<SortOption>('number')

  // Dialog State
  const [selectedRoom, setSelectedRoom] = useState<DetailedRoom | null>(null)
  const [roomDetailOpen, setRoomDetailOpen] = useState(false)
  const [allocateDialogOpen, setAllocateDialogOpen] = useState(false)
  const [allocateRoom, setAllocateRoom] = useState<DetailedRoom | null>(null)
  const [maintenanceRoom, setMaintenanceRoom] = useState<DetailedRoom | null>(null)
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false)

  // ===================== DATA LOADING =====================
  const loadData = useCallback(async () => {
    try {
      const res = await apiFetch<ApiResponse>('/api/rooms?detailed=true')
      setData(res)
      if (!selectedHostelId && res.hostels.length > 0) {
        setSelectedHostelId(res.hostels[0].id)
      }
    } catch {
      toast.error('Failed to load room data')
    }
    setLoading(false)
  }, [selectedHostelId])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadData()
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  // ===================== COMPUTED VALUES =====================
  const currentHostel = useMemo(() => {
    return data?.hostels.find(h => h.id === selectedHostelId) || null
  }, [data, selectedHostelId])

  const floors = useMemo(() => {
    return currentHostel?.floors || []
  }, [currentHostel])

  const filteredRooms = useMemo(() => {
    if (!data) return []
    let rooms = data.rooms.filter(r => r.hostelId === selectedHostelId)

    // Floor filter
    if (selectedFloor !== null) {
      rooms = rooms.filter(r => r.floor === selectedFloor)
    }

    // Status filter
    if (statusFilter !== 'all') {
      rooms = rooms.filter(r => r.status === statusFilter)
    }

    // Search filter
    if (searchQuery) {
      rooms = rooms.filter(r =>
        r.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.students?.some(s =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }

    // Sort
    rooms.sort((a, b) => {
      switch (sortOption) {
        case 'number':
          return a.number.localeCompare(b.number, undefined, { numeric: true })
        case 'occupancy': {
          const aOcc = a.students?.length || 0
          const bOcc = b.students?.length || 0
          return bOcc - aOcc
        }
        case 'status':
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })

    return rooms
  }, [data, selectedHostelId, selectedFloor, statusFilter, searchQuery, sortOption])

  const stats = useMemo(() => {
    if (!data) return { total: 0, occupied: 0, available: 0, maintenance: 0 }
    const hostelRooms = data.rooms.filter(r => r.hostelId === selectedHostelId)
    return {
      total: hostelRooms.length,
      occupied: hostelRooms.filter(r => r.status === 'Occupied').length,
      available: hostelRooms.filter(r => r.status === 'Available').length,
      maintenance: hostelRooms.filter(r => r.status === 'Maintenance').length,
    }
  }, [data, selectedHostelId])

  const floorRoomCounts = useMemo(() => {
    if (!data) return new Map<number, number>()
    const map = new Map<number, number>()
    data.rooms
      .filter(r => r.hostelId === selectedHostelId)
      .forEach(r => {
        map.set(r.floor, (map.get(r.floor) || 0) + 1)
      })
    return map
  }, [data, selectedHostelId])

  // ===================== HANDLERS =====================
  const handleRoomClick = (room: DetailedRoom) => {
    setSelectedRoom(room)
    setRoomDetailOpen(true)
  }

  const handleAllocateClick = (room: DetailedRoom) => {
    setAllocateRoom(room)
    setAllocateDialogOpen(true)
  }

  const handleMaintenanceClick = (room: DetailedRoom) => {
    setMaintenanceRoom(room)
    setMaintenanceDialogOpen(true)
  }

  const handleQuickAssign = (student: UnassignedStudent) => {
    // Open allocate dialog for the first available room
    const availableRooms = data?.rooms.filter(r =>
      r.hostelId === selectedHostelId &&
      r.status !== 'Maintenance' &&
      (r.students?.length || 0) < r.capacity
    ) || []
    if (availableRooms.length > 0) {
      setAllocateRoom(availableRooms[0])
      setAllocateDialogOpen(true)
    } else {
      toast.info('No available rooms in the current hostel. Try another hostel.')
    }
  }

  // ===================== LOADING STATE =====================
  if (loading || !data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="dashboard-stat-card p-5">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20 rounded" />
                  <Skeleton className="h-6 w-16 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ========== 1. HEADER SECTION ========== */}
      <div className="hostel-interior-bg rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 animate-float">
                <Building2 className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">Room Visualization & Management</h2>
                <p className="text-blue-200/80 text-sm">Interactive hostel building layout and smart room allocation</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative premium-input">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 input-icon" />
                <Input
                  placeholder="Search rooms, students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 w-64 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-green-400/50"
                />
              </div>
              <Select value={selectedHostelId} onValueChange={(v) => { setSelectedHostelId(v); setSelectedFloor(null) }}>
                <SelectTrigger className="w-52 h-9 bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select Hostel" />
                </SelectTrigger>
                <SelectContent>
                  {data.hostels.map(h => (
                    <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" className="btn-green-glow text-white text-xs" onClick={() => { setLoading(true); loadData() }}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ========== 2. STATISTICS BAR ========== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <AnimatedStatCard
          title="Total Rooms"
          value={stats.total}
          icon={<DoorOpen className="h-5 w-5" />}
          color="text-blue-600"
          bg="bg-blue-50 dark:bg-blue-900/20"
        />
        <AnimatedStatCard
          title="Occupied Rooms"
          value={stats.occupied}
          icon={<Users className="h-5 w-5" />}
          color="text-red-600"
          bg="bg-red-50 dark:bg-red-900/20"
        />
        <AnimatedStatCard
          title="Available Rooms"
          value={stats.available}
          icon={<Home className="h-5 w-5" />}
          color="text-green-600"
          bg="bg-green-50 dark:bg-green-900/20"
        />
        <AnimatedStatCard
          title="Maintenance Rooms"
          value={stats.maintenance}
          icon={<Wrench className="h-5 w-5" />}
          color="text-amber-600"
          bg="bg-amber-50 dark:bg-amber-900/20"
        />
      </div>

      {/* ========== 3. HOSTEL SELECTOR & FLOOR NAVIGATION ========== */}
      <Card className="premium-card">
        <CardContent className="p-4 space-y-3">
          {/* Hostel Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {data.hostels.map(hostel => (
              <button
                key={hostel.id}
                onClick={() => { setSelectedHostelId(hostel.id); setSelectedFloor(null) }}
                className={`
                  shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${selectedHostelId === hostel.id
                    ? 'bg-gradient-to-r from-[#1e3a5f] to-[#2a5a8f] text-white shadow-md shadow-[#1e3a5f]/20'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <Building className="h-3.5 w-3.5" />
                  <span>{hostel.name}</span>
                  <Badge variant="outline" className="text-[9px] h-4 px-1 border-current/30">
                    {hostel.type}
                  </Badge>
                </div>
              </button>
            ))}
          </div>

          {/* Floor Tabs */}
          {floors.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              <button
                onClick={() => setSelectedFloor(null)}
                className={`
                  shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200
                  ${selectedFloor === null
                    ? 'bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30 shadow-sm'
                    : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                  }
                `}
              >
                All Floors
              </button>
              {floors.map(floor => (
                <button
                  key={floor}
                  onClick={() => setSelectedFloor(floor)}
                  className={`
                    shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200
                    flex items-center gap-1.5
                    ${selectedFloor === floor
                      ? 'bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30 shadow-sm'
                      : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                    }
                  `}
                >
                  <Layers className="h-3 w-3" />
                  {FLOOR_LABELS[floor] || `Floor ${floor}`}
                  <span className="text-[10px] opacity-70">({floorRoomCounts.get(floor) || 0})</span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========== 9. ROOM FILTERS BAR ========== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Status Filter Tabs */}
        <div className="premium-tabs">
          {(['all', 'Available', 'Occupied', 'Maintenance'] as StatusFilter[]).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`premium-tab flex items-center gap-1.5 ${statusFilter === status ? 'active' : ''}`}
            >
              {status === 'all' && <LayoutGrid className="h-3 w-3" />}
              {status === 'Available' && <CheckCircle className="h-3 w-3 text-green-500" />}
              {status === 'Occupied' && <Users className="h-3 w-3 text-red-500" />}
              {status === 'Maintenance' && <AlertTriangle className="h-3 w-3 text-amber-500" />}
              {status === 'all' ? 'All' : status}
              <span className="text-[10px] opacity-60">
                {status === 'all' ? stats.total :
                 status === 'Available' ? stats.available :
                 status === 'Occupied' ? stats.occupied : stats.maintenance}
              </span>
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sort:</span>
          <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="number">Room Number</SelectItem>
              <SelectItem value="occupancy">Occupancy</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ========== 4. INTERACTIVE ROOM GRID ========== */}
      {filteredRooms.length === 0 ? (
        <EmptyState
          icon={<DoorOpen className="h-8 w-8" />}
          title="No Rooms Found"
          description="No rooms match your current filters. Try adjusting your search or filters."
          action={
            <Button variant="outline" size="sm" onClick={() => { setStatusFilter('all'); setSearchQuery(''); setSelectedFloor(null) }}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Clear Filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
          {filteredRooms.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              onClick={() => handleRoomClick(room)}
              onAllocate={() => handleAllocateClick(room)}
              onMaintenance={() => handleMaintenanceClick(room)}
            />
          ))}
        </div>
      )}

      {/* ========== 10. ROOM ANALYTICS SECTION ========== */}
      <Separator className="my-8" />
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[#1e3a5f]" />
          Room Analytics
        </h3>
        <RoomAnalytics rooms={data.rooms.filter(r => r.hostelId === selectedHostelId)} />
      </div>

      {/* ========== 11. UNASSIGNED STUDENTS PANEL ========== */}
      <Separator className="my-8" />
      <UnassignedStudentsPanel
        students={data.unassignedStudents || []}
        onAllocate={handleQuickAssign}
      />

      {/* ========== MODALS ========== */}

      {/* Room Detail Modal */}
      {selectedRoom && (
        <RoomDetailModal
          room={selectedRoom}
          open={roomDetailOpen}
          onClose={() => { setRoomDetailOpen(false); setSelectedRoom(null) }}
          onRefresh={loadData}
        />
      )}

      {/* Standalone Allocate Dialog */}
      {allocateRoom && (
        <AllocateDialog
          open={allocateDialogOpen}
          onClose={() => { setAllocateDialogOpen(false); setAllocateRoom(null) }}
          room={allocateRoom}
          unassignedStudents={data.unassignedStudents || []}
          onRefresh={loadData}
        />
      )}

      {/* Standalone Maintenance Dialog */}
      {maintenanceRoom && (
        <MaintenanceDialog
          open={maintenanceDialogOpen}
          onClose={() => { setMaintenanceDialogOpen(false); setMaintenanceRoom(null) }}
          room={maintenanceRoom}
          onRefresh={loadData}
        />
      )}
    </div>
  )
}
