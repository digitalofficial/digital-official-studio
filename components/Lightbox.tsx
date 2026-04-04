'use client'

import Image from 'next/image'
import { useState, useRef, useCallback, useEffect } from 'react'

interface Props {
  src: string
  onClose: () => void
}

export default function Lightbox({ src, onClose }: Props) {
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const isVideo = /\.(mp4|mov|webm|ogg)(\?|$)/i.test(src)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
    setIsDragging(true)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return
    const diff = e.touches[0].clientY - startY.current
    if (diff > 0) {
      setDragY(diff)
    }
  }, [isDragging])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    if (dragY > 150) {
      onClose()
    } else {
      setDragY(0)
    }
  }, [dragY, onClose])

  // Mouse drag support for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    startY.current = e.clientY
    setIsDragging(true)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    const diff = e.clientY - startY.current
    if (diff > 0) {
      setDragY(diff)
    }
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    if (dragY > 150) {
      onClose()
    } else {
      setDragY(0)
    }
  }, [dragY, onClose])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const opacity = Math.max(0.3, 1 - dragY / 400)
  const scale = Math.max(0.85, 1 - dragY / 1500)

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center select-none"
      style={{ backgroundColor: `rgba(0,0,0,${opacity * 0.95})` }}
      onClick={onClose}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Drag hint */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 pointer-events-none">
        <div className="w-10 h-1 rounded-full bg-white/30" />
        <p className="text-white/40 text-xs mt-1">Swipe down to close</p>
      </div>

      {/* Content */}
      <div
        className="max-h-[90vh] max-w-[90vw] w-full h-full flex items-center justify-center"
        style={{
          transform: `translateY(${dragY}px) scale(${scale})`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {isVideo ? (
          <video
            src={src}
            controls
            autoPlay
            className="max-h-[85vh] max-w-[90vw] rounded-lg"
          />
        ) : (
          <div className="relative w-full h-full">
            <Image
              src={src}
              alt=""
              fill
              className="object-contain pointer-events-none"
              sizes="90vw"
              priority
              draggable={false}
            />
          </div>
        )}
      </div>
    </div>
  )
}
