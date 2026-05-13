'use client'

import React, { useState, useEffect } from 'react'
import { AuthPages } from '@/components/auth-pages'
import { AdminPortal } from '@/components/admin-portal'
import { StudentPortal } from '@/components/student-portal'
import { RBHAIAssistant } from '@/components/rbh-ai-assistant'
import Image from 'next/image'

export interface UserType {
  id: string
  email: string
  name: string
  role: string
  phone?: string
  avatar?: string
  student?: {
    id: string
    rollNo: string
    department: string
    semester: number
    roomId?: string | null
    guardianName?: string | null
    guardianPhone?: string | null
    address?: string | null
    bloodGroup?: string | null
    emergencyContact?: string | null
    status: string
    room?: { id: string; number: string; floor: number; capacity: number; hostel?: { name: string } }
  }
}

export default function HomePage() {
  const [user, setUser] = useState<UserType | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('rbh_user')
      if (saved) {
        setUser(JSON.parse(saved))
      }
    } catch {
      // ignore parse errors
    }
    setMounted(true)
  }, [])

  const handleLogin = (userData: UserType) => {
    setUser(userData)
    localStorage.setItem('rbh_user', JSON.stringify(userData))
  }

  const handleLogout = async () => {
    // Log the logout activity
    try {
      const saved = localStorage.getItem('rbh_user')
      if (saved) {
        const userData = JSON.parse(saved)
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userData.id, userName: userData.name, userRole: userData.role }),
        })
      }
    } catch { /* ignore logging errors on logout */ }
    setUser(null)
    localStorage.removeItem('rbh_user')
  }

  const handleUserUpdate = (updatedUser: UserType) => {
    setUser(updatedUser)
    localStorage.setItem('rbh_user', JSON.stringify(updatedUser))
  }

  // Premium loading screen
  if (!mounted) {
    return (
      <div className="loading-screen">
        <div className="logo-container">
          <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl">
            <Image src="/images/logo-icon.png" alt="Logo" width={56} height={56} className="rounded-2xl" />
          </div>
          <div className="logo-ring" />
        </div>
        <p className="brand-text mt-2">River Boy Hostel</p>
        <p className="tagline">University of Malakand</p>
        <div className="mt-6 flex items-center gap-2">
          <div className="spinner" />
        </div>
        <p className="text-blue-200/40 text-xs mt-4 animate-subtle-pulse">Loading your portal...</p>
      </div>
    )
  }

  if (!user) {
    return <AuthPages onLogin={handleLogin} />
  }

  if (user.role === 'admin') {
    return (
      <>
        <AdminPortal user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />
        <RBHAIAssistant userId={user.id} userName={user.name} userRole={user.role} />
      </>
    )
  }

  return (
    <>
      <StudentPortal user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />
      <RBHAIAssistant userId={user.id} userName={user.name} userRole={user.role} />
    </>
  )
}
