'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { MessageCircle, X, Send, Bot, User, Sparkles, ChevronDown, Minus, RotateCcw, Zap, Copy, Check, BookOpen, Code2, Globe, AlertTriangle, Clock, ShieldOff, Minimize2, Maximize2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ===================== TYPES =====================
interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: Date
  intent?: string
  mode?: string
  suggestions?: string[]
  limitInfo?: LimitInfo
}

interface LimitInfo {
  queryCount: number
  dailyLimit: number
  remaining: number
  isLimitReached: boolean
  isDisabled: boolean
  usagePercentage: number
  timeUntilReset: { hours: number; minutes: number }
}

interface RBHAIAssistantProps {
  userId: string
  userName: string
  userRole: string
}

// ===================== CODE BLOCK COMPONENT =====================
function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false)
  const { theme } = useTheme()

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className={`rounded-xl overflow-hidden my-2 border ${
      theme === 'dark' ? 'bg-[#0d1117] border-gray-700/50' : 'bg-[#f6f8fa] border-gray-200'
    }`}>
      <div className={`flex items-center justify-between px-3 py-1.5 text-xs border-b ${
        theme === 'dark' ? 'bg-[#161b22] border-gray-700/50 text-gray-400' : 'bg-[#eff2f5] border-gray-200 text-gray-500'
      }`}>
        <span className="font-medium">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-foreground transition-colors touch-manipulation"
        >
          {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <pre className={`p-3 overflow-x-auto text-xs leading-relaxed font-mono ${
        theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
      }`}>
        <code>{code}</code>
      </pre>
    </div>
  )
}

// ===================== INLINE CODE COMPONENT =====================
function InlineCode({ text }: { text: string }) {
  const { theme } = useTheme()
  return (
    <code className={`px-1.5 py-0.5 rounded text-xs font-mono ${
      theme === 'dark' ? 'bg-gray-700/50 text-pink-300' : 'bg-gray-100 text-pink-600'
    }`}>{text}</code>
  )
}

// ===================== USAGE PROGRESS BAR =====================
function UsageProgressBar({ queryCount, dailyLimit, remaining, isLimitReached, usagePercentage }: {
  queryCount: number
  dailyLimit: number
  remaining: number
  isLimitReached: boolean
  usagePercentage: number
}) {
  const { theme } = useTheme()

  // Color logic: green → yellow → red
  let barColor = 'bg-green-500'
  let textColor = 'text-green-400'
  let bgColor = 'bg-green-500/10'
  if (usagePercentage >= 80) {
    barColor = 'bg-red-500'
    textColor = 'text-red-400'
    bgColor = 'bg-red-500/10'
  } else if (usagePercentage >= 60) {
    barColor = 'bg-yellow-500'
    textColor = 'text-yellow-400'
    bgColor = 'bg-yellow-500/10'
  } else if (usagePercentage >= 40) {
    barColor = 'bg-blue-500'
    textColor = 'text-blue-400'
    bgColor = 'bg-blue-500/10'
  }

  return (
    <div className={`rounded-lg p-2.5 border ${
      theme === 'dark' ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
          <Zap className="h-3 w-3" />
          AI Queries Today
        </span>
        <span className={`text-[10px] font-bold ${isLimitReached ? 'text-red-400' : textColor}`}>
          {queryCount} / {dailyLimit}
        </span>
      </div>
      {/* Progress bar */}
      <div className={`h-1.5 rounded-full overflow-hidden ${
        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
      }`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className={`text-[9px] ${isLimitReached ? 'text-red-400 font-medium' : 'text-muted-foreground'}`}>
          {isLimitReached ? 'Limit reached' : `${remaining} remaining`}
        </span>
        {usagePercentage >= 60 && usagePercentage < 80 && (
          <span className="text-[9px] text-yellow-400 flex items-center gap-0.5">
            <AlertTriangle className="h-2.5 w-2.5" /> Slow down
          </span>
        )}
        {usagePercentage >= 80 && (
          <span className="text-[9px] text-red-400 flex items-center gap-0.5">
            <AlertTriangle className="h-2.5 w-2.5" /> Almost done
          </span>
        )}
      </div>
    </div>
  )
}

// ===================== LIMIT REACHED BANNER =====================
function LimitReachedBanner({ timeUntilReset, isDisabled }: { timeUntilReset: { hours: number; minutes: number }; isDisabled?: boolean }) {
  const { theme } = useTheme()

  return (
    <div className={`rounded-lg p-3 border text-center ${
      isDisabled
        ? theme === 'dark' ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200'
        : theme === 'dark' ? 'bg-amber-900/20 border-amber-500/30' : 'bg-amber-50 border-amber-200'
    }`}>
      <div className="flex items-center justify-center gap-2 mb-1">
        {isDisabled ? (
          <ShieldOff className={`h-4 w-4 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`} />
        ) : (
          <AlertTriangle className={`h-4 w-4 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-500'}`} />
        )}
        <span className={`text-xs font-bold ${
          isDisabled
            ? theme === 'dark' ? 'text-red-300' : 'text-red-700'
            : theme === 'dark' ? 'text-amber-300' : 'text-amber-700'
        }`}>
          {isDisabled ? 'AI Access Disabled' : 'Daily Limit Reached'}
        </span>
      </div>
      {!isDisabled && (
        <div className={`flex items-center justify-center gap-1 text-[10px] ${
          theme === 'dark' ? 'text-amber-200/70' : 'text-amber-600'
        }`}>
          <Clock className="h-3 w-3" />
          Resets in {timeUntilReset.hours}h {timeUntilReset.minutes}m
        </div>
      )}
      {isDisabled && (
        <p className={`text-[10px] mt-1 ${theme === 'dark' ? 'text-red-200/70' : 'text-red-500'}`}>
          Contact the warden to regain access
        </p>
      )}
    </div>
  )
}

// ===================== RICH TEXT RENDERER =====================
function renderFormattedText(text: string) {
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g
  const parts: { type: 'code' | 'text'; content: string; language?: string }[] = []
  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'code', content: match[2].trim(), language: match[1] || 'code' })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) })
  }

  return parts.map((part, partIdx) => {
    if (part.type === 'code') {
      return <CodeBlock key={partIdx} code={part.content} language={part.language || 'code'} />
    }

    const blocks = part.content.split(/\n\n+/)

    return blocks.map((block, blockIdx) => {
      const lines = block.split('\n')

      return (
        <div key={`${partIdx}-${blockIdx}`} className={blockIdx > 0 ? 'mt-2' : ''}>
          {lines.map((line, lineIdx) => {
            const inlineCodeProcessed = line.replace(/`([^`]+)`/g, '%%INLINE_CODE%%$1%%END_INLINE_CODE%%')
            const boldProcessed = inlineCodeProcessed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            const italicProcessed = boldProcessed.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
            const segments = italicProcessed.split(/%%INLINE_CODE%%|%%END_INLINE_CODE%%/)
            const renderedLine = segments.map((seg, segIdx) => {
              if (segIdx % 2 === 1) {
                return <InlineCode key={segIdx} text={seg} />
              }
              return <span key={segIdx} dangerouslySetInnerHTML={{ __html: seg }} />
            })

            if (line.trim().startsWith('•') || line.trim().startsWith('- ') || line.trim().match(/^\d+\./)) {
              return (
                <div key={lineIdx} className="flex gap-1.5 ml-1">
                  <span className="text-sm leading-relaxed">{renderedLine}</span>
                </div>
              )
            }
            if (line.trim() === '') return <div key={lineIdx} className="h-1" />
            return <div key={lineIdx} className="text-sm leading-relaxed">{renderedLine}</div>
          })}
        </div>
      )
    })
  })
}

// ===================== MODE BADGE =====================
function ModeBadge({ mode }: { mode: string }) {
  const { theme } = useTheme()
  const modeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    hostel: { icon: <Zap className="h-3 w-3" />, label: 'Hostel', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
    academic: { icon: <BookOpen className="h-3 w-3" />, label: 'Academic', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    coding: { icon: <Code2 className="h-3 w-3" />, label: 'Coding', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    general: { icon: <Globe className="h-3 w-3" />, label: 'General', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  }
  const config = modeConfig[mode] || modeConfig.hostel
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium border ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  )
}

// ===================== MAIN COMPONENT =====================
export function RBHAIAssistant({ userId, userName, userRole }: RBHAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [context, setContext] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)
  const [currentMode, setCurrentMode] = useState<string>('hostel')
  const [unreadCount, setUnreadCount] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [limitInfo, setLimitInfo] = useState<LimitInfo>({
    queryCount: 0,
    dailyLimit: 15,
    remaining: 15,
    isLimitReached: false,
    isDisabled: false,
    usagePercentage: 0,
    timeUntilReset: { hours: 0, minutes: 0 },
  })
  const { theme } = useTheme()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  // Fetch limit info on mount and after each message
  const fetchLimitInfo = useCallback(async () => {
    try {
      const res = await fetch(`/api/ai/query-limit?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setLimitInfo({
          queryCount: data.queryCount,
          dailyLimit: data.dailyLimit,
          remaining: data.remaining,
          isLimitReached: data.isLimitReached,
          isDisabled: data.isDisabled,
          usagePercentage: data.usagePercentage,
          timeUntilReset: data.timeUntilReset,
        })
      }
    } catch {
      // Silently fail
    }
  }, [userId])

  useEffect(() => {
    if (mounted) fetchLimitInfo()
  }, [mounted, fetchLimitInfo])

  // Welcome message
  useEffect(() => {
    if (mounted && messages.length === 0) {
      const welcomeMsg: ChatMessage = {
        id: 'welcome',
        role: 'ai',
        content: `👋 Hello, ${userName}!\n\nI'm your **RBH AI Assistant** — I can help with *anything*!\n\n🏠 **Hostel:** Fees, rooms, complaints, leave, rules\n📚 **Academic:** Explain concepts, step-by-step tutorials\n💻 **Coding:** Python, C++, JavaScript, SQL, debugging\n🌍 **General:** History, science, facts — ask me anything!\n\n💡 You have **15 queries per day** — use them wisely!\n\nTry: *"Explain OOP"*, *"What is AI?"*, *"My fee"*, or *"Python linked list"*`,
        timestamp: new Date(),
        mode: 'hostel',
        suggestions: userRole === 'admin'
          ? ['Payment summary', 'Explain DBMS', 'Python code example', 'Generate report']
          : ['My fee', 'My room', 'Explain OOP', 'Python code']
      }
      setMessages([welcomeMsg])
    }
  }, [mounted, userName, userRole])

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, isLoading])

  // Track unread messages when minimized
  useEffect(() => {
    if (isMinimized && messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.role === 'ai') {
        setUnreadCount(prev => prev + 1)
      }
    }
  }, [messages.length])

  // Clear unread count when maximizing
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setUnreadCount(0)
    }
  }, [isOpen, isMinimized])

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current && !limitInfo.isLimitReached && !limitInfo.isDisabled) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, isMinimized, limitInfo.isLimitReached, limitInfo.isDisabled])

  // Handle minimize with animation
  const handleMinimize = useCallback(() => {
    setIsAnimating(true)
    setTimeout(() => {
      setIsMinimized(true)
      setIsAnimating(false)
    }, 200)
  }, [])

  // Handle maximize with animation
  const handleMaximize = useCallback(() => {
    setIsAnimating(true)
    setUnreadCount(0)
    setTimeout(() => {
      setIsMinimized(false)
      setIsAnimating(false)
    }, 150)
  }, [])

  // Handle close
  const handleClose = useCallback(() => {
    setIsAnimating(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsMinimized(false)
      setUnreadCount(0)
      setIsAnimating(false)
    }, 200)
  }, [])

  // Send message
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return
    // Client-side limit check
    if (limitInfo.isLimitReached || limitInfo.isDisabled) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          userId,
          userRole,
          userName,
          context: context.slice(-8)
        })
      })

      const data = await response.json()

      // Update limit info from response
      if (data.limitInfo) {
        setLimitInfo(data.limitInfo)
      }

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: data.message || "I'm having trouble. Please try again.",
        timestamp: new Date(),
        intent: data.intent,
        mode: data.mode || 'hostel',
        suggestions: data.suggestions || [],
        limitInfo: data.limitInfo,
      }

      setMessages(prev => [...prev, aiMessage])
      setCurrentMode(data.mode || 'hostel')
      setContext(prev => [...prev.slice(-6), { role: 'user', content: text.trim() }, { role: 'ai', content: aiMessage.content }])
    } catch {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'ai',
        content: "⚠️ I'm having trouble connecting. Please try again.",
        timestamp: new Date(),
        suggestions: ['Try again', 'Help']
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      // Refresh limit info from server to stay in sync
      fetchLimitInfo()
    }
  }, [isLoading, userId, userRole, userName, context, limitInfo.isLimitReached, limitInfo.isDisabled, fetchLimitInfo])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputValue)
  }

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
  }

  const clearChat = () => {
    setMessages([{
      id: `welcome-${Date.now()}`,
      role: 'ai',
      content: `🔄 Chat cleared! I'm ready for anything, ${userName}!\n\nAsk about hostel, academics, coding, or general knowledge.`,
      timestamp: new Date(),
      mode: 'hostel',
      suggestions: userRole === 'admin'
        ? ['Payment summary', 'Explain DBMS', 'Python code', 'Generate report']
        : ['My fee', 'Explain OOP', 'Python code', 'Hostel rules']
    }])
    setContext([])
    setCurrentMode('hostel')
  }

  if (!mounted) return null

  // Determine if input should be disabled
  const isInputDisabled = limitInfo.isLimitReached || limitInfo.isDisabled

  // Floating button usage badge color
  const getUsageBadgeColor = () => {
    if (limitInfo.isDisabled) return 'from-red-500 to-red-600'
    if (limitInfo.isLimitReached) return 'from-red-500 to-red-600'
    if (limitInfo.usagePercentage >= 80) return 'from-orange-400 to-orange-500'
    if (limitInfo.usagePercentage >= 60) return 'from-yellow-400 to-yellow-500'
    return 'from-green-400 to-green-600'
  }

  // ===================== FLOATING BUTTON (initial - when chat has never been opened) =====================
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-[100] animate-fade-in">
        <button
          onClick={() => { setIsOpen(true); setIsMinimized(false); }}
          className="group relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#1e3a5f] via-[#2a5a8f] to-[#1e3a5f] text-white shadow-2xl shadow-[#1e3a5f]/40 hover:shadow-[#1e3a5f]/60 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center touch-manipulation"
          aria-label="Open RBH AI Assistant"
        >
          <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-[#1e3a5f]" />
          <div className="absolute -inset-1 rounded-full animate-pulse opacity-10 bg-green-400" />
          <div className="relative z-10 flex items-center justify-center">
            <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 group-hover:scale-110 transition-transform" />
          </div>
          {/* Usage counter badge */}
          <div className={`absolute -top-1 -right-1 min-w-[20px] h-5 bg-gradient-to-br ${getUsageBadgeColor()} rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-900 px-1`}>
            <span className="text-[8px] font-bold text-white">{limitInfo.remaining}</span>
          </div>
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-foreground text-background text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
            Ask Anything AI • {limitInfo.remaining} left
            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-foreground" />
          </div>
        </button>
      </div>
    )
  }

  // ===================== MINIMIZED FLOATING ICON =====================
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-[100] animate-bounce-in">
        <button
          onClick={handleMaximize}
          className="group relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#1e3a5f] via-[#2a5a8f] to-[#1e3a5f] text-white shadow-2xl shadow-[#1e3a5f]/40 hover:shadow-[#1e3a5f]/60 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center touch-manipulation"
          aria-label="Restore RBH AI Assistant"
        >
          {/* Active conversation pulse ring */}
          <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-[#1e3a5f]" />
          <div className="absolute -inset-1 rounded-full animate-pulse opacity-15 bg-blue-400" />

          <div className="relative z-10 flex flex-col items-center justify-center gap-0.5">
            <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-transform" />
            <ChevronDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 rotate-180 opacity-70 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Unread notification badge */}
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 min-w-[22px] h-[22px] bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-900 px-1 animate-bounce-in">
              <span className="text-[9px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
            </div>
          )}

          {/* No unread but show queries remaining */}
          {unreadCount === 0 && (
            <div className={`absolute -top-1 -right-1 min-w-[20px] h-5 bg-gradient-to-br ${getUsageBadgeColor()} rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-900 px-1`}>
              <span className="text-[8px] font-bold text-white">{limitInfo.remaining}</span>
            </div>
          )}

          {/* Tooltip */}
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-foreground text-background text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
            {unreadCount > 0 ? `${unreadCount} new message${unreadCount > 1 ? 's' : ''}` : 'RBH AI • Click to reopen'}
            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-foreground" />
          </div>
        </button>
      </div>
    )
  }

  // ===================== CHAT WINDOW =====================
  return (
    <div className={`fixed z-[100] transition-all duration-300 ease-out ${
    isAnimating ? 'animate-chat-minimize' : 'animate-chat-appear'
    } bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] md:w-[460px]`}>
      <div className={`rounded-2xl overflow-hidden shadow-2xl border transition-all duration-300 h-[min(680px,calc(100vh-5rem))] sm:h-[650px] ${
        theme === 'dark'
          ? 'bg-gray-900/95 border-gray-700/50 backdrop-blur-xl'
          : 'bg-white/95 border-white/20 backdrop-blur-xl'
      }`}
      style={{
        boxShadow: theme === 'dark'
          ? '0 25px 60px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)'
          : '0 25px 60px -12px rgba(30, 58, 95, 0.25), 0 0 0 1px rgba(30, 58, 95, 0.08)',
      }}>
        {/* ===== HEADER ===== */}
        <div className={`px-4 py-3 flex items-center justify-between shrink-0 ${
          limitInfo.isDisabled
            ? 'bg-gradient-to-r from-red-800 via-red-700 to-red-800 text-white'
            : limitInfo.isLimitReached
              ? 'bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 text-white'
              : 'bg-gradient-to-r from-[#1e3a5f] via-[#2a5a8f] to-[#1e3a5f] text-white'
        }`}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${
                limitInfo.isDisabled ? 'bg-red-400 border-red-800' :
                limitInfo.isLimitReached ? 'bg-amber-400 border-amber-800' :
                'bg-green-400 border-[#1e3a5f]'
              } animate-pulse-soft`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm leading-tight">RBH AI</h3>
                <ModeBadge mode={currentMode} />
                {/* Usage pill in header */}
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                  limitInfo.isLimitReached || limitInfo.isDisabled
                    ? 'bg-red-500/30 text-red-200'
                    : limitInfo.usagePercentage >= 60
                      ? 'bg-amber-500/30 text-amber-200'
                      : 'bg-green-500/30 text-green-200'
                }`}>
                  {limitInfo.isDisabled ? 'Disabled' : `${limitInfo.queryCount}/${limitInfo.dailyLimit}`}
                </span>
              </div>
              <p className="text-[10px] text-blue-200/70 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  limitInfo.isDisabled ? 'bg-red-400' :
                  limitInfo.isLimitReached ? 'bg-amber-400' :
                  'bg-green-400'
                } animate-pulse-soft`} />
                {limitInfo.isDisabled ? 'Access Disabled' :
                 limitInfo.isLimitReached ? 'Limit Reached' :
                 'Ask Anything • River Boy Hostel'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={clearChat} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors touch-manipulation" title="Clear chat">
              <RotateCcw className="h-4 w-4" />
            </button>
            {/* ===== PROMINENT MINIMIZE BUTTON ===== */}
            <button
              onClick={handleMinimize}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg transition-all duration-200 touch-manipulation border border-white/20 hover:border-white/40 active:scale-95"
              title="Minimize AI Assistant"
            >
              <ChevronDown className="h-4 w-4 text-white" />
              <span className="text-[11px] font-semibold text-white tracking-wide">Minimize</span>
            </button>
            <button onClick={handleClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors touch-manipulation" title="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ===== MESSAGES AREA ===== */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
              style={{ height: 'calc(100% - 56px - 84px - 64px - 70px)' }}
            >
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2.5 animate-fade-in ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    msg.role === 'ai'
                      ? 'bg-gradient-to-br from-[#1e3a5f] to-[#2a5a8f] text-white'
                      : 'bg-gradient-to-br from-green-400 to-green-600 text-white'
                  }`}>
                    {msg.role === 'ai' ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                  </div>

                  {/* Message bubble */}
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {/* Mode badge for AI messages */}
                    {msg.role === 'ai' && msg.mode && msg.mode !== 'hostel' && msg.intent !== 'limit_reached' && (
                      <div className="mb-1">
                        <ModeBadge mode={msg.mode} />
                      </div>
                    )}
                    <div className={`inline-block rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-[#1e3a5f] to-[#2a5a8f] text-white rounded-tr-sm'
                        : msg.intent === 'limit_reached'
                          ? theme === 'dark'
                            ? 'bg-red-900/30 text-red-200 border border-red-500/30 rounded-tl-sm'
                            : 'bg-red-50 text-red-800 border border-red-200 rounded-tl-sm'
                          : theme === 'dark'
                            ? 'bg-gray-800/80 text-gray-100 border border-gray-700/50 rounded-tl-sm'
                            : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-sm'
                    }`}>
                      {msg.role === 'ai' ? renderFormattedText(msg.content) : msg.content}
                    </div>

                    {/* Timestamp */}
                    <div className={`text-[10px] text-muted-foreground/50 mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.timestamp.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </div>

                    {/* Suggestions */}
                    {msg.role === 'ai' && msg.suggestions && msg.suggestions.length > 0 && msg.intent !== 'limit_reached' && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {msg.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSuggestionClick(suggestion)}
                            disabled={isInputDisabled}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200 touch-manipulation ${
                              isInputDisabled ? 'opacity-50 cursor-not-allowed' : ''
                            } ${
                              theme === 'dark'
                                ? 'bg-gray-800/60 text-gray-300 border border-gray-700/50 hover:bg-[#1e3a5f]/30 hover:border-[#1e3a5f]/50 hover:text-blue-300'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-[#1e3a5f]/5 hover:border-[#1e3a5f]/20 hover:text-[#1e3a5f]'
                            } hover:scale-105 active:scale-95`}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex gap-2.5 animate-fade-in">
                  <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2a5a8f] flex items-center justify-center">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className={`rounded-2xl rounded-tl-sm px-4 py-3 ${
                    theme === 'dark' ? 'bg-gray-800/80 border border-gray-700/50' : 'bg-gray-50 border border-gray-100'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-muted-foreground ml-1">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ===== USAGE PROGRESS BAR AREA ===== */}
            <div className="px-3 py-2 border-t border-border/30 shrink-0">
              {limitInfo.isLimitReached || limitInfo.isDisabled ? (
                <LimitReachedBanner
                  timeUntilReset={limitInfo.timeUntilReset}
                  isDisabled={limitInfo.isDisabled}
                />
              ) : (
                <UsageProgressBar
                  queryCount={limitInfo.queryCount}
                  dailyLimit={limitInfo.dailyLimit}
                  remaining={limitInfo.remaining}
                  isLimitReached={limitInfo.isLimitReached}
                  usagePercentage={limitInfo.usagePercentage}
                />
              )}
            </div>

            {/* ===== QUICK ACTIONS BAR ===== */}
            <div className="px-3 py-1.5 border-t border-border/30 flex gap-2 overflow-x-auto scrollbar-none shrink-0">
              <QuickAction icon={<Zap className="h-3 w-3" />} label={userRole === 'admin' ? 'Report' : 'My Fee'} onClick={() => sendMessage(userRole === 'admin' ? 'Generate report' : 'What is my fee?')} active={currentMode === 'hostel'} disabled={isInputDisabled} />
              <QuickAction icon={<BookOpen className="h-3 w-3" />} label="Explain" onClick={() => sendMessage('Explain object oriented programming')} active={currentMode === 'academic'} disabled={isInputDisabled} />
              <QuickAction icon={<Code2 className="h-3 w-3" />} label="Code" onClick={() => sendMessage('Write Python code for a linked list')} active={currentMode === 'coding'} disabled={isInputDisabled} />
              <QuickAction icon={<Globe className="h-3 w-3" />} label="General" onClick={() => sendMessage('How does the internet work?')} active={currentMode === 'general'} disabled={isInputDisabled} />
              {userRole === 'admin' && (
                <QuickAction icon={<span className="text-xs">🎓</span>} label="Students" onClick={() => sendMessage('Student search')} active={false} disabled={isInputDisabled} />
              )}
            </div>

            {/* ===== INPUT AREA ===== */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-border/30 shrink-0">
              <div className="flex gap-2 items-center">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={
                    limitInfo.isDisabled
                      ? 'AI access disabled by admin'
                      : limitInfo.isLimitReached
                        ? `Limit reached — resets in ${limitInfo.timeUntilReset.hours}h ${limitInfo.timeUntilReset.minutes}m`
                        : 'Ask anything... (hostel, coding, studies)'
                  }
                  className={`flex-1 h-10 text-sm rounded-xl border ${
                    limitInfo.isDisabled
                      ? theme === 'dark'
                        ? 'bg-red-900/10 border-red-500/30 text-red-300 placeholder:text-red-400/50'
                        : 'bg-red-50 border-red-200 text-red-500 placeholder:text-red-400'
                      : limitInfo.isLimitReached
                        ? theme === 'dark'
                          ? 'bg-amber-900/10 border-amber-500/30 text-amber-300 placeholder:text-amber-400/50'
                          : 'bg-amber-50 border-amber-200 text-amber-500 placeholder:text-amber-400'
                        : theme === 'dark'
                          ? 'bg-gray-800/50 border-gray-700/50 focus:border-[#1e3a5f]/50 placeholder:text-gray-500'
                          : 'bg-gray-50/50 border-gray-200 focus:border-[#1e3a5f]/30 placeholder:text-gray-400'
                  }`}
                  disabled={isLoading || isInputDisabled}
                  maxLength={500}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputValue.trim() || isLoading || isInputDisabled}
                  className={`h-10 w-10 rounded-xl text-white shadow-md shrink-0 disabled:opacity-50 ${
                    isInputDisabled
                      ? 'bg-gray-400 hover:bg-gray-400'
                      : 'bg-gradient-to-br from-[#1e3a5f] to-[#2a5a8f] hover:from-[#2a5a8f] hover:to-[#1e3a5f]'
                  }`}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className={`text-[10px] mt-1.5 text-center ${
                isInputDisabled
                  ? limitInfo.isDisabled ? 'text-red-400/60' : 'text-amber-400/60'
                  : 'text-muted-foreground/40'
              }`}>
                {isInputDisabled
                  ? limitInfo.isDisabled
                    ? 'AI access disabled — contact warden'
                    : `Daily limit reached (${limitInfo.queryCount}/${limitInfo.dailyLimit}) — try tomorrow`
                  : `RBH AI • ${limitInfo.remaining} queries remaining • River Boy Hostel UOM`
                }
              </p>
            </form>
      </div>
    </div>
  )
}

// ===================== QUICK ACTION BUTTON =====================
function QuickAction({ icon, label, onClick, active, disabled }: { icon: React.ReactNode; label: string; onClick: () => void; active: boolean; disabled?: boolean }) {
  const { theme } = useTheme()

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 touch-manipulation shrink-0 ${
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      } ${
        active
          ? 'bg-[#1e3a5f]/10 text-[#1e3a5f] border border-[#1e3a5f]/30 dark:bg-[#1e3a5f]/20 dark:text-blue-300 dark:border-[#1e3a5f]/40'
          : theme === 'dark'
            ? 'bg-gray-800/40 text-gray-400 border border-gray-700/30 hover:bg-[#1e3a5f]/20 hover:text-blue-300 hover:border-[#1e3a5f]/30'
            : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-[#1e3a5f]/5 hover:text-[#1e3a5f] hover:border-[#1e3a5f]/20'
      } hover:scale-105 active:scale-95`}
    >
      {icon}
      {label}
    </button>
  )
}
