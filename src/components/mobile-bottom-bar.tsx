'use client'

import React, { useState } from 'react'
import { Home, Menu, ChevronUp } from 'lucide-react'

interface BottomNavItem {
  key: string
  label: string
  icon: React.ReactNode
}

interface MobileBottomBarProps {
  items: BottomNavItem[]
  activeKey: string
  onNavigate: (key: string) => void
  onMenuOpen?: () => void
  role: 'admin' | 'student'
}

export function MobileBottomBar({ items, activeKey, onNavigate, onMenuOpen, role }: MobileBottomBarProps) {
  const [moreOpen, setMoreOpen] = useState(false)

  // Show first 4 items + More button on the bottom bar
  const primaryItems = items.slice(0, 4)
  const moreItems = items.slice(4)

  const activeItem = items.find(i => i.key === activeKey)
  const isActiveInMore = moreItems.some(i => i.key === activeKey)

  return (
    <>
      {/* More Menu Overlay */}
      {moreOpen && (
        <div className="fixed inset-0 z-[45] lg:hidden" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        </div>
      )}

      {/* More Menu Panel - slides up from bottom */}
      <div
        className={`fixed bottom-16 left-0 right-0 z-[46] lg:hidden transition-all duration-300 ease-out ${
          moreOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-white dark:bg-slate-900 border-t border-border/50 shadow-2xl shadow-black/20 rounded-t-2xl mx-2 mb-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
            <h3 className="text-sm font-semibold text-foreground">More Pages</h3>
            <button
              onClick={() => setMoreOpen(false)}
              className="p-1 rounded-lg hover:bg-muted/50 text-muted-foreground"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1 p-3">
            {moreItems.map((item) => (
              <button
                key={item.key}
                onClick={() => { onNavigate(item.key); setMoreOpen(false) }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 touch-manipulation ${
                  activeKey === item.key
                    ? 'bg-gradient-to-b from-green-500/20 to-green-500/5 text-green-600 dark:text-green-400'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <span className={activeKey === item.key ? 'scale-110' : ''}>{item.icon}</span>
                <span className="text-[10px] font-medium leading-tight text-center">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar - z-30 so sidebar overlay (z-[45]) covers it */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-border/30 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
          {primaryItems.map((item) => (
            <button
              key={item.key}
              onClick={() => { onNavigate(item.key); setMoreOpen(false) }}
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-200 min-w-[56px] touch-manipulation ${
                activeKey === item.key
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className={`p-1 rounded-lg transition-all duration-200 ${
                activeKey === item.key
                  ? 'bg-green-500/15 scale-110'
                  : ''
              }`}>
                {item.icon}
              </div>
              <span className={`text-[10px] leading-tight font-medium ${
                activeKey === item.key ? 'text-green-600 dark:text-green-400' : ''
              }`}>
                {item.label}
              </span>
              {activeKey === item.key && (
                <div className="w-1 h-1 bg-green-500 rounded-full mt-0.5" />
              )}
            </button>
          ))}

          {/* More Button */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-200 min-w-[56px] touch-manipulation ${
              isActiveInMore
                ? 'text-green-600 dark:text-green-400'
                : moreOpen
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className={`p-1 rounded-lg transition-all duration-200 ${
              isActiveInMore
                ? 'bg-green-500/15 scale-110'
                : moreOpen
                  ? 'bg-blue-500/15'
                  : ''
            }`}>
              <Menu className="h-5 w-5" />
            </div>
            <span className={`text-[10px] leading-tight font-medium ${
              isActiveInMore ? 'text-green-600 dark:text-green-400' : moreOpen ? 'text-blue-600 dark:text-blue-400' : ''
            }`}>
              More
            </span>
            {(isActiveInMore || moreOpen) && (
              <div className={`w-1 h-1 rounded-full mt-0.5 ${isActiveInMore ? 'bg-green-500' : 'bg-blue-500'}`} />
            )}
          </button>
        </div>

        {/* Safe area for phones with home indicator */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </>
  )
}
