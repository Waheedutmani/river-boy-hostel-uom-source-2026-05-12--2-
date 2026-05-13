'use client'

import React, { useState, useEffect } from 'react'
import { Building2, Eye, EyeOff, GraduationCap, Shield, Phone, MapPin, Users, Star, ArrowRight, CheckCircle2, Clock, BookOpen, Wifi, Cpu, Zap, Download, FolderArchive, KeyRound } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import Image from 'next/image'
import type { UserType } from '@/app/page'

export function AuthPages({ onLogin }: { onLogin: (user: UserType) => void }) {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<'student' | 'admin'>('student')
  const [regStep, setRegStep] = useState(1)
  const [mounted, setMounted] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotResult, setForgotResult] = useState<{ success: boolean; message: string; tempPassword?: string } | null>(null)

  // Login form
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form
  const [regForm, setRegForm] = useState({
    name: '', email: '', password: '', phone: '',
    rollNo: '', department: '', semester: '1',
    guardianName: '', guardianPhone: '', address: '',
    bloodGroup: '', emergencyContact: ''
  })

  useEffect(() => { setMounted(true) }, [])

  // Real-time clock
  const [clock, setClock] = useState('')
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setClock(now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail || !loginPassword) { toast.error('Please fill in all fields'); return }
    try {
      setLoading(true)
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Login failed'); return }
      toast.success(`Welcome back, ${data.user.name}!`)
      onLogin(data.user)
    } catch (err) {
      console.error('Login error:', err)
      toast.error('Network error. Please check your connection and try again.')
    }
    finally { setLoading(false) }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regForm.name || !regForm.email || !regForm.password || !regForm.rollNo || !regForm.department) {
      toast.error('Please fill in all required fields'); return
    }
    try {
      setLoading(true)
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...regForm, role: 'student', semester: parseInt(regForm.semester) })
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Registration failed'); return }
      toast.success('Registration successful! Please login.')
      setIsLogin(true)
      setLoginEmail(regForm.email)
      setLoginPassword('')
      setRegStep(1)
    } catch (err) {
      console.error('Registration error:', err)
      toast.error('Network error. Please check your connection and try again.')
    }
    finally { setLoading(false) }
  }

  const fillDemo = (type: 'admin' | 'student') => {
    if (type === 'admin') {
      setLoginEmail('admin@riverboyuom.edu.pk')
      setLoginPassword('admin123')
      setRole('admin')
    } else {
      setLoginEmail('ahmed.ali@uom.edu.pk')
      setLoginPassword('student123')
      setRole('student')
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) { toast.error('Please enter your email address'); return }
    try {
      setForgotLoading(true)
      setForgotResult(null)
      const res = await fetch('/api/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'forgot-password', email: forgotEmail }),
      })
      const data = await res.json()
      setForgotResult({ success: data.success, message: data.message, tempPassword: data.tempPassword })
      if (data.success) toast.success('Password reset processed')
    } catch {
      toast.error('Failed to process password reset')
    } finally { setForgotLoading(false) }
  }

  const regProgress = () => {
    const fields = [regForm.name, regForm.email, regForm.password, regForm.rollNo, regForm.department,
      regForm.phone, regForm.semester, regForm.bloodGroup,
      regForm.guardianName, regForm.guardianPhone, regForm.address, regForm.emergencyContact]
    const filled = fields.filter(Boolean).length
    return Math.round((filled / fields.length) * 100)
  }

  const handleDownloadProject = async () => {
    try {
      setDownloading(true)
      const res = await fetch('/api/download')
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `river-boy-hostel-uom-source-${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Project source code downloaded successfully!')
    } catch (err) {
      console.error('Download error:', err)
      toast.error('Failed to download project. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="login-bg flex items-center justify-center p-4 min-h-screen">
      {/* Animated particles */}
      <div className="login-particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="particle" />
        ))}
      </div>

      {/* Floating geometric shapes */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] left-[8%] w-16 h-16 border border-white/5 rounded-xl rotate-45 animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute top-[60%] left-[5%] w-10 h-10 border border-green-400/8 rounded-full animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[25%] right-[10%] w-12 h-12 border border-white/5 rounded-lg rotate-12 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-[20%] right-[8%] w-20 h-20 border border-green-400/5 rounded-2xl -rotate-12 animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute top-[45%] right-[25%] w-6 h-6 bg-green-400/5 rounded-full animate-pulse-soft" />
      </div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col lg:flex-row gap-8 items-center animate-fade-in-up">
        {/* Left Side - Premium Branding */}
        <div className="hidden lg:flex flex-col justify-center text-white space-y-8 flex-1 max-w-md animate-slide-in">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 animate-float shadow-lg shadow-black/10">
                <Image src="/images/logo-icon.png" alt="Logo" width={40} height={40} className="rounded-xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">River Boy Hostel</h1>
                <p className="text-green-400 font-semibold text-sm tracking-wide">University of Malakand</p>
              </div>
            </div>

            <h2 className="text-4xl font-bold leading-tight mb-4">
              Smart Hostel<br />
              <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">Management</span> System
            </h2>
            <p className="text-blue-200/70 text-lg leading-relaxed">
              A comprehensive digital platform for managing hostel operations, room allocations, fee payments, and student services at University of Malakand.
            </p>
          </div>

          <div className="space-y-3 stagger-children">
            {[
              { icon: <Users className="h-5 w-5" />, title: 'Student Management', desc: 'Complete student lifecycle tracking' },
              { icon: <Building2 className="h-5 w-5" />, title: 'Smart Room Allocation', desc: 'Intelligent room assignment system' },
              { icon: <Star className="h-5 w-5" />, title: 'Fee Management', desc: 'Transparent tracking & digital receipts' },
              { icon: <BookOpen className="h-5 w-5" />, title: 'Leave & Movement', desc: 'Digital leave register with signatures' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 glass-card-dark rounded-xl p-3 hover:bg-white/10 transition-colors duration-300 cursor-default">
                <div className="p-2 bg-green-500/20 rounded-lg text-green-400 flex-shrink-0">{item.icon}</div>
                <div>
                  <p className="font-semibold text-sm">{item.title}</p>
                  <p className="text-blue-200/50 text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Live stats */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { value: '25+', label: 'Students' },
              { value: '40+', label: 'Rooms' },
              { value: '3', label: 'Hostel Blocks' },
            ].map(s => (
              <div key={s.label} className="glass-card-dark rounded-xl p-3 text-center stat-card-shimmer">
                <p className="text-2xl font-bold text-green-400">{s.value}</p>
                <p className="text-xs text-blue-200/50">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Security Badge */}
          <div className="flex items-center gap-2 pt-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 glass-card-dark rounded-lg">
              <Shield className="h-3.5 w-3.5 text-green-400" />
              <span className="text-[10px] text-blue-200/60 font-medium">Secure Login</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 glass-card-dark rounded-lg">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[10px] text-blue-200/60 font-medium">Fast Access</span>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Forms */}
        <div className="w-full lg:w-[460px] flex-shrink-0">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6 animate-fade-in">
            <div className="inline-flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-lg">
                <Image src="/images/logo-icon.png" alt="Logo" width={32} height={32} className="rounded-lg" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold text-white">River Boy Hostel</h1>
                <p className="text-green-400 text-xs font-medium">University of Malakand</p>
              </div>
            </div>
          </div>

          {isLogin ? (
            <Card className="glass-card-glow gradient-border-animated border-0 shadow-2xl rounded-2xl animate-bounce-in overflow-visible">
              <CardHeader className="text-center pb-2 pt-6">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#1e3a5f] to-[#2a6a9f] rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-blue-900/30 animate-float">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#1e3a5f] to-[#2a5a8f] bg-clip-text text-transparent dark:from-blue-300 dark:to-green-300">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-foreground/60 dark:text-slate-400">Sign in to your hostel portal</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 pb-6">
                {/* Role Selector */}
                <div className="flex bg-muted/50 rounded-xl p-1 mb-5">
                  <button
                    type="button"
                    onClick={() => { setRole('student'); setLoginEmail(''); setLoginPassword('') }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${role === 'student'
                      ? 'bg-gradient-to-r from-[#1e3a5f] to-[#2a5a8f] text-white shadow-md shadow-blue-900/20'
                      : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <GraduationCap className="h-4 w-4" /> Student
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRole('admin'); setLoginEmail(''); setLoginPassword('') }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${role === 'admin'
                      ? 'bg-gradient-to-r from-[#1e3a5f] to-[#2a5a8f] text-white shadow-md shadow-blue-900/20'
                      : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Shield className="h-4 w-4" /> Admin
                  </button>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="premium-input">
                    <Label htmlFor="email" className="text-sm font-medium mb-1.5 block text-foreground/90 dark:text-slate-200">Email Address</Label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 input-icon" />
                      <Input id="email" type="email" placeholder={role === 'student' ? 'student@uom.edu.pk' : 'admin@riverboyuom.edu.pk'} value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)} className="pl-10 h-11 rounded-xl transition-all !bg-white/90 !text-gray-900 dark:!bg-white/10 dark:!text-slate-100 placeholder:!text-gray-400 dark:placeholder:!text-slate-500 border-gray-200 dark:border-white/15" />
                    </div>
                  </div>
                  <div className="premium-input">
                    <Label htmlFor="password" className="text-sm font-medium mb-1.5 block text-foreground/90 dark:text-slate-200">Password</Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 input-icon">
                        {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </div>
                      <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password"
                        value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                        className="pl-10 pr-10 h-11 rounded-xl transition-all !bg-white/90 !text-gray-900 dark:!bg-white/10 dark:!text-slate-100 placeholder:!text-gray-400 dark:placeholder:!text-slate-500 border-gray-200 dark:border-white/15" />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-11 rounded-xl btn-primary-glow text-base font-semibold group" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Signing in...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Sign In <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </Button>
                </form>

                <div className="mt-5 text-center">
                  <p className="text-sm text-foreground/60 dark:text-slate-400">
                    Don&apos;t have an account?{' '}
                    <button className="text-[#1e3a5f] dark:text-green-400 font-semibold hover:underline" onClick={() => { setIsLogin(false); setRegStep(1) }}>
                      Register Now
                    </button>
                  </p>
                </div>

                {/* Forgot Password Link */}
                <div className="mt-2 text-center">
                  <button
                    className="text-xs text-[#1e3a5f]/70 dark:text-blue-400/70 hover:text-[#1e3a5f] dark:hover:text-blue-300 flex items-center gap-1 mx-auto transition-colors"
                    onClick={() => { setShowForgotPassword(true); setForgotResult(null); setForgotEmail('') }}
                  >
                    <KeyRound className="h-3 w-3" /> Forgot Password?
                  </button>
                </div>

                {/* Quick Demo Access */}
                <div className="mt-5 p-4 bg-gradient-to-r from-blue-50/80 to-green-50/80 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl border border-blue-100/50 dark:border-blue-800/20">
                  <p className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-2.5 flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-amber-500" /> Quick Demo Access (Click to fill)
                  </p>
                  <div className="space-y-2">
                    <button onClick={() => fillDemo('admin')} className="w-full flex items-center gap-2 text-xs bg-white/60 dark:bg-white/5 rounded-lg px-3 py-2 hover:bg-white/90 dark:hover:bg-white/10 transition-all duration-200 border border-transparent hover:border-blue-200 dark:hover:border-blue-700/30 cursor-pointer">
                      <Shield className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="font-semibold text-blue-800 dark:text-blue-300">Admin:</span>
                      <span className="text-blue-700 dark:text-blue-400 font-mono text-[11px]">admin@riverboyuom.edu.pk / admin123</span>
                    </button>
                    <button onClick={() => fillDemo('student')} className="w-full flex items-center gap-2 text-xs bg-white/60 dark:bg-white/5 rounded-lg px-3 py-2 hover:bg-white/90 dark:hover:bg-white/10 transition-all duration-200 border border-transparent hover:border-green-200 dark:hover:border-green-700/30 cursor-pointer">
                      <GraduationCap className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      <span className="font-semibold text-green-800 dark:text-green-300">Student:</span>
                      <span className="text-green-700 dark:text-green-400 font-mono text-[11px]">ahmed.ali@uom.edu.pk / student123</span>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card-glow border-0 shadow-2xl rounded-2xl animate-bounce-in overflow-visible">
              <CardHeader className="text-center pb-2 pt-5">
                <div className="mx-auto w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-2 shadow-lg shadow-green-900/20 animate-float">
                  <GraduationCap className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent dark:from-green-300 dark:to-emerald-300">
                  Student Registration
                </CardTitle>
                <CardDescription className="text-foreground/60 dark:text-slate-400">Create your hostel account</CardDescription>
              </CardHeader>
              <CardContent className="pt-2 pb-5">
                {/* Step Indicator */}
                <div className="step-indicator mb-4">
                  <div className={`step ${regStep >= 1 ? 'active' : ''} ${regStep > 1 ? 'completed' : ''}`}>
                    <div className="step-circle">{regStep > 1 ? <CheckCircle2 className="h-4 w-4" /> : '1'}</div>
                    <span className="text-xs font-medium hidden sm:inline">Basic</span>
                  </div>
                  <div className={`step-line ${regStep > 1 ? 'completed' : ''}`} />
                  <div className={`step ${regStep >= 2 ? 'active' : ''} ${regStep > 2 ? 'completed' : ''}`}>
                    <div className="step-circle">{regStep > 2 ? <CheckCircle2 className="h-4 w-4" /> : '2'}</div>
                    <span className="text-xs font-medium hidden sm:inline">Academic</span>
                  </div>
                  <div className={`step-line ${regStep > 2 ? 'completed' : ''}`} />
                  <div className={`step ${regStep >= 3 ? 'active' : ''}`}>
                    <div className="step-circle">3</div>
                    <span className="text-xs font-medium hidden sm:inline">Emergency</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-muted/50 rounded-full h-1.5 mb-4">
                  <div className="bg-gradient-to-r from-[#1e3a5f] to-green-500 h-1.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${regProgress()}%` }} />
                </div>

                <form onSubmit={handleRegister} className="space-y-3">
                  {regStep === 1 && (
                    <div className="animate-fade-in space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="premium-input">
                          <Label className="text-xs font-medium text-foreground/80 dark:text-slate-300">Full Name *</Label>
                          <Input className="mt-1 h-10 rounded-lg text-sm !bg-white/90 !text-gray-900 dark:!bg-white/10 dark:!text-slate-100 placeholder:!text-gray-400 dark:placeholder:!text-slate-500 border-gray-200 dark:border-white/15" placeholder="Your name" value={regForm.name}
                            onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))} />
                        </div>
                        <div className="premium-input">
                          <Label className="text-xs font-medium text-foreground/80 dark:text-slate-300">Roll No *</Label>
                          <Input className="mt-1 h-10 rounded-lg text-sm !bg-white/90 !text-gray-900 dark:!bg-white/10 dark:!text-slate-100 placeholder:!text-gray-400 dark:placeholder:!text-slate-500 border-gray-200 dark:border-white/15" placeholder="2024-CS-001" value={regForm.rollNo}
                            onChange={e => setRegForm(f => ({ ...f, rollNo: e.target.value }))} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="premium-input">
                          <Label className="text-xs font-medium text-foreground/80 dark:text-slate-300">Email *</Label>
                          <Input className="mt-1 h-10 rounded-lg text-sm !bg-white/90 !text-gray-900 dark:!bg-white/10 dark:!text-slate-100 placeholder:!text-gray-400 dark:placeholder:!text-slate-500 border-gray-200 dark:border-white/15" type="email" placeholder="your@email.com" value={regForm.email}
                            onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} />
                        </div>
                        <div className="premium-input">
                          <Label className="text-xs font-medium text-foreground/80 dark:text-slate-300">Password *</Label>
                          <Input className="mt-1 h-10 rounded-lg text-sm !bg-white/90 !text-gray-900 dark:!bg-white/10 dark:!text-slate-100 placeholder:!text-gray-400 dark:placeholder:!text-slate-500 border-gray-200 dark:border-white/15" type="password" placeholder="Min 6 chars" value={regForm.password}
                            onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))} />
                        </div>
                      </div>
                    </div>
                  )}

                  {regStep === 2 && (
                    <div className="animate-fade-in space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="premium-input">
                          <Label className="text-xs font-medium text-foreground/80 dark:text-slate-300">Phone</Label>
                          <Input className="mt-1 h-10 rounded-lg text-sm !bg-white/90 !text-gray-900 dark:!bg-white/10 dark:!text-slate-100 placeholder:!text-gray-400 dark:placeholder:!text-slate-500 border-gray-200 dark:border-white/15" placeholder="03XX-XXXXXXX" value={regForm.phone}
                            onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))} />
                        </div>
                        <div className="premium-input">
                          <Label className="text-xs font-medium text-foreground/80 dark:text-slate-300">Department *</Label>
                          <Select value={regForm.department} onValueChange={v => setRegForm(f => ({ ...f, department: v }))}>
                            <SelectTrigger className="mt-1 h-10 rounded-lg text-sm !bg-white/90 !text-gray-900 dark:!bg-white/10 dark:!text-slate-100 border-gray-200 dark:border-white/15"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent className="!bg-white dark:!bg-slate-800 !text-gray-900 dark:!text-slate-100">
                              {['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
                                'BBA', 'Physics', 'Mathematics', 'Chemistry', 'Botany', 'Zoology'].map(d =>
                                <SelectItem key={d} value={d}>{d}</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="premium-input">
                          <Label className="text-xs font-medium text-foreground/80 dark:text-slate-300">Semester</Label>
                          <Select value={regForm.semester} onValueChange={v => setRegForm(f => ({ ...f, semester: v }))}>
                            <SelectTrigger className="mt-1 h-10 rounded-lg text-sm !bg-white/90 !text-gray-900 dark:!bg-white/10 dark:!text-slate-100 border-gray-200 dark:border-white/15"><SelectValue /></SelectTrigger>
                            <SelectContent className="!bg-white dark:!bg-slate-800 !text-gray-900 dark:!text-slate-100">
                              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="premium-input">
                          <Label className="text-xs font-medium text-foreground/80 dark:text-slate-300">Blood Group</Label>
                          <Select value={regForm.bloodGroup} onValueChange={v => setRegForm(f => ({ ...f, bloodGroup: v }))}>
                            <SelectTrigger className="mt-1 h-10 rounded-lg text-sm !bg-white/90 !text-gray-900 dark:!bg-white/10 dark:!text-slate-100 border-gray-200 dark:border-white/15"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent className="!bg-white dark:!bg-slate-800 !text-gray-900 dark:!text-slate-100">
                              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b =>
                                <SelectItem key={b} value={b}>{b}</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {regStep === 3 && (
                    <div className="animate-fade-in space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="premium-input">
                          <Label className="text-xs font-medium text-foreground/80 dark:text-slate-300">Guardian Name</Label>
                          <Input className="mt-1 h-10 rounded-lg text-sm !bg-white/90 !text-gray-900 dark:!bg-white/10 dark:!text-slate-100 placeholder:!text-gray-400 dark:placeholder:!text-slate-500 border-gray-200 dark:border-white/15" placeholder="Father/Guardian" value={regForm.guardianName}
                            onChange={e => setRegForm(f => ({ ...f, guardianName: e.target.value }))} />
                        </div>
                        <div className="premium-input">
                          <Label className="text-xs font-medium text-foreground/80 dark:text-slate-300">Guardian Phone</Label>
                          <Input className="mt-1 h-10 rounded-lg text-sm !bg-white/90 !text-gray-900 dark:!bg-white/10 dark:!text-slate-100 placeholder:!text-gray-400 dark:placeholder:!text-slate-500 border-gray-200 dark:border-white/15" placeholder="03XX-XXXXXXX" value={regForm.guardianPhone}
                            onChange={e => setRegForm(f => ({ ...f, guardianPhone: e.target.value }))} />
                        </div>
                      </div>
                      <div className="premium-input">
                        <Label className="text-xs font-medium text-foreground/80 dark:text-slate-300">Address</Label>
                        <Input className="mt-1 h-10 rounded-lg text-sm !bg-white/90 !text-gray-900 dark:!bg-white/10 dark:!text-slate-100 placeholder:!text-gray-400 dark:placeholder:!text-slate-500 border-gray-200 dark:border-white/15" placeholder="Home address" value={regForm.address}
                          onChange={e => setRegForm(f => ({ ...f, address: e.target.value }))} />
                      </div>
                      <div className="premium-input">
                        <Label className="text-xs font-medium text-foreground/80 dark:text-slate-300">Emergency Contact</Label>
                        <Input className="mt-1 h-10 rounded-lg text-sm !bg-white/90 !text-gray-900 dark:!bg-white/10 dark:!text-slate-100 placeholder:!text-gray-400 dark:placeholder:!text-slate-500 border-gray-200 dark:border-white/15" placeholder="Emergency number" value={regForm.emergencyContact}
                          onChange={e => setRegForm(f => ({ ...f, emergencyContact: e.target.value }))} />
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex gap-3 pt-1">
                    {regStep > 1 && (
                      <Button type="button" variant="outline" className="flex-1 h-10 rounded-xl" onClick={() => setRegStep(s => s - 1)}>
                        Back
                      </Button>
                    )}
                    {regStep < 3 ? (
                      <Button type="button" className="flex-1 h-10 rounded-xl btn-primary-glow font-semibold" onClick={() => setRegStep(s => s + 1)}>
                        Next Step <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    ) : (
                      <Button type="submit" className="flex-1 h-10 rounded-xl btn-green-glow font-semibold" disabled={loading}>
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            Creating...
                          </span>
                        ) : 'Create Account'}
                      </Button>
                    )}
                  </div>
                </form>

                <div className="mt-4 text-center">
                  <p className="text-sm text-foreground/60 dark:text-slate-400">
                    Already have an account?{' '}
                    <button className="text-[#1e3a5f] dark:text-green-400 font-semibold hover:underline" onClick={() => { setIsLogin(true); setRegStep(1) }}>
                      Sign In
                    </button>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Download Project Button */}
          <div className="mt-5 flex justify-center">
            <button
              onClick={handleDownloadProject}
              disabled={downloading}
              className="group flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-900/20 hover:shadow-emerald-800/30 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed backdrop-blur-sm border border-emerald-400/20 hover:border-emerald-400/40"
            >
              {downloading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Packaging Project...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 group-hover:animate-bounce" />
                  <span>Download Project Source Code</span>
                  <FolderArchive className="h-3.5 w-3.5 opacity-60" />
                </>
              )}
            </button>
          </div>

          <p className="text-center text-blue-300/40 text-xs mt-4">
            River Boy Hostel UOM &copy; 2026 &bull; University of Malakand &bull; Final Year Project
          </p>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForgotPassword(false)} />
          <Card className="relative z-10 w-full max-w-md glass-card-glow border-0 shadow-2xl rounded-2xl animate-bounce-in">
            <CardHeader className="text-center pb-2 pt-6">
              <div className="mx-auto w-14 h-14 bg-gradient-to-br from-[#1e3a5f] to-[#2a6a9f] rounded-2xl flex items-center justify-center mb-3 shadow-lg">
                <KeyRound className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl font-bold">Forgot Password</CardTitle>
              <CardDescription className="text-foreground/60 dark:text-slate-400">Enter your email to reset your password</CardDescription>
            </CardHeader>
            <CardContent className="pt-2 pb-6">
              {forgotResult ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl ${forgotResult.success ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30' : 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30'}`}>
                    <p className={`text-sm ${forgotResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>{forgotResult.message}</p>
                  </div>
                  {forgotResult.tempPassword && (
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30">
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-2 font-medium">Your temporary password:</p>
                      <div className="flex items-center gap-2">
                        <code className="text-lg font-mono font-bold text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-800/30 px-3 py-1.5 rounded-lg">{forgotResult.tempPassword}</code>
                      </div>
                      <p className="text-xs text-blue-600/60 dark:text-blue-400/60 mt-2">Please log in with this password and change it immediately.</p>
                    </div>
                  )}
                  <Button className="w-full h-10 rounded-xl btn-primary-glow text-white font-semibold" onClick={() => { setShowForgotPassword(false); setIsLogin(true) }}>
                    Back to Login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="premium-input">
                    <Label className="text-sm font-medium mb-1.5 block text-foreground/90 dark:text-slate-200">Email Address</Label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 input-icon" />
                      <Input type="email" placeholder="Enter your registered email" value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)} className="pl-10 h-11 rounded-xl transition-all !bg-white/90 !text-gray-900 dark:!bg-white/10 dark:!text-slate-100 placeholder:!text-gray-400 dark:placeholder:!text-slate-500 border-gray-200 dark:border-white/15" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1 h-10 rounded-xl" onClick={() => setShowForgotPassword(false)}>Cancel</Button>
                    <Button type="submit" className="flex-1 h-10 rounded-xl btn-primary-glow text-white font-semibold" disabled={forgotLoading}>
                      {forgotLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                          Resetting...
                        </span>
                      ) : 'Reset Password'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
