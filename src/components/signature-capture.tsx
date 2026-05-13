'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Pen, Type, Upload, Eraser, Check, X } from 'lucide-react'

interface SignatureCaptureProps {
  value: string | null
  onChange: (signature: string | null) => void
  label?: string
  width?: number
  height?: number
}

export function SignatureCapture({ value, onChange, label = 'Digital Signature', width = 400, height = 150 }: SignatureCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [typedSignature, setTypedSignature] = useState('')
  const [activeTab, setActiveTab] = useState('draw')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas resolution
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    // Fill white background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    // Draw signature line
    ctx.strokeStyle = '#d1d5db'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(20, height - 25)
    ctx.lineTo(width - 20, height - 25)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw label
    ctx.fillStyle = '#9ca3af'
    ctx.font = '12px sans-serif'
    ctx.fillText('Sign here', 20, height - 8)
  }, [width, height])

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left),
        y: (e.touches[0].clientY - rect.top),
      }
    }
    return {
      x: (e.clientX - rect.left),
      y: (e.clientY - rect.top),
    }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    ctx.strokeStyle = '#1e3a5f'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    setIsDrawing(true)
    setHasDrawn(true)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false)
      // Save canvas data
      const canvas = canvasRef.current
      if (canvas && hasDrawn) {
        onChange(canvas.toDataURL('image/png'))
      }
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, width * dpr, height * dpr)

    // Redraw background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    // Redraw signature line
    ctx.strokeStyle = '#d1d5db'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(20, height - 25)
    ctx.lineTo(width - 20, height - 25)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = '#9ca3af'
    ctx.font = '12px sans-serif'
    ctx.fillText('Sign here', 20, height - 8)

    setHasDrawn(false)
    onChange(null)
  }

  const handleTypedSignature = () => {
    if (!typedSignature.trim()) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, width * dpr, height * dpr)

    // Background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    // Draw signature line
    ctx.strokeStyle = '#d1d5db'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(20, height - 25)
    ctx.lineTo(width - 20, height - 25)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw typed signature in cursive style
    ctx.fillStyle = '#1e3a5f'
    ctx.font = 'italic 32px Georgia, serif'
    ctx.textAlign = 'center'
    ctx.fillText(typedSignature, width / 2, height / 2 + 10)
    ctx.textAlign = 'start'

    setHasDrawn(true)
    onChange(canvas.toDataURL('image/png'))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const dpr = window.devicePixelRatio || 1
        ctx.clearRect(0, 0, width * dpr, height * dpr)

        // Background
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)

        // Draw signature line
        ctx.strokeStyle = '#d1d5db'
        ctx.lineWidth = 1
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(20, height - 25)
        ctx.lineTo(width - 20, height - 25)
        ctx.stroke()
        ctx.setLineDash([])

        // Scale image to fit
        const scale = Math.min((width - 40) / img.width, (height - 50) / img.height)
        const w = img.width * scale
        const h = img.height * scale
        ctx.drawImage(img, (width - w) / 2, (height - 30 - h) / 2, w, h)

        setHasDrawn(true)
        onChange(canvas.toDataURL('image/png'))
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label} *</Label>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="draw" className="gap-1.5 text-xs">
            <Pen className="h-3.5 w-3.5" /> Draw
          </TabsTrigger>
          <TabsTrigger value="type" className="gap-1.5 text-xs">
            <Type className="h-3.5 w-3.5" /> Type
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-1.5 text-xs">
            <Upload className="h-3.5 w-3.5" /> Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="draw" className="mt-2">
          <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
            <CardContent className="p-3">
              <canvas
                ref={canvasRef}
                className="rounded-lg cursor-crosshair touch-none w-full"
                style={{ maxWidth: '100%' }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">Use your mouse or finger to sign</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={clearCanvas} className="gap-1 text-xs">
                    <Eraser className="h-3 w-3" /> Clear
                  </Button>
                  {hasDrawn && (
                    <Button size="sm" onClick={() => {
                      const canvas = canvasRef.current
                      if (canvas) onChange(canvas.toDataURL('image/png'))
                    }} className="gap-1 text-xs bg-green-600 hover:bg-green-700">
                      <Check className="h-3 w-3" /> Confirm
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="type" className="mt-2">
          <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
            <CardContent className="p-3">
              <canvas
                ref={canvasRef}
                className="rounded-lg w-full"
                style={{ maxWidth: '100%' }}
              />
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  placeholder="Type your full name..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTypedSignature()
                  }}
                />
                <Button onClick={handleTypedSignature} disabled={!typedSignature.trim()} className="gap-1 text-xs bg-[#1e3a5f] hover:bg-[#153050]">
                  <Check className="h-3 w-3" /> Apply
                </Button>
                <Button variant="outline" onClick={clearCanvas} className="gap-1 text-xs">
                  <X className="h-3 w-3" /> Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="mt-2">
          <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
            <CardContent className="p-3">
              <canvas
                ref={canvasRef}
                className="rounded-lg w-full"
                style={{ maxWidth: '100%' }}
              />
              <div className="flex items-center gap-2 mt-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="flex-1 text-xs"
                />
                <Button variant="outline" onClick={clearCanvas} className="gap-1 text-xs">
                  <Eraser className="h-3 w-3" /> Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Show preview of captured signature */}
      {value && (
        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-xs text-green-700 dark:text-green-400 font-medium mb-1">Signature captured</p>
          <img src={value} alt="Signature preview" className="h-12 rounded border bg-white" />
        </div>
      )}
    </div>
  )
}
