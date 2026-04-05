'use client'

import Image from 'next/image'
import { useState, useRef, useCallback, useEffect } from 'react'
import ShareButtons from '@/components/ShareButtons'
import WatermarkOverlay, { type WatermarkConfig } from '@/components/WatermarkOverlay'

interface LightboxItem {
  src: string
  name?: string
  watermarkEnabled?: boolean
}

interface Props {
  items: LightboxItem[]
  initialIndex: number
  onClose: () => void
  watermarkConfig?: WatermarkConfig
}

export default function Lightbox({ items, initialIndex, onClose, watermarkConfig }: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const startY = useRef(0)
  const startX = useRef(0)
  const dragAxis = useRef<'none' | 'x' | 'y'>('none')
  const containerRef = useRef<HTMLDivElement>(null)

  const current = items[currentIndex]
  const isVideo = /\.(mp4|mov|webm|ogg)(\?|$)/i.test(current.src)
  const showWatermark = current.watermarkEnabled || false

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i < items.length - 1 ? i + 1 : i))
  }, [items.length])

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : i))
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
    startX.current = e.touches[0].clientX
    dragAxis.current = 'none'
    setIsDragging(true)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return
    const diffX = e.touches[0].clientX - startX.current
    const diffY = e.touches[0].clientY - startY.current

    // Determine axis on first significant movement
    if (dragAxis.current === 'none') {
      if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
        dragAxis.current = Math.abs(diffX) > Math.abs(diffY) ? 'x' : 'y'
      }
      return
    }

    if (dragAxis.current === 'y' && diffY > 0) {
      setDragY(diffY)
    }
  }, [isDragging])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    setIsDragging(false)
    if (dragAxis.current === 'y') {
      if (dragY > 150) {
        onClose()
      } else {
        setDragY(0)
      }
    } else if (dragAxis.current === 'x') {
      const diffX = e.changedTouches[0].clientX - startX.current
      if (diffX < -50) goNext()
      else if (diffX > 50) goPrev()
    }
    dragAxis.current = 'none'
  }, [dragY, onClose, goNext, goPrev])

  // Mouse drag support for desktop (vertical dismiss only)
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

  // Keyboard handlers
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, goNext, goPrev])

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
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-4">
        {/* Image counter */}
        <div className="text-white/60 text-sm">
          {currentIndex + 1} / {items.length}
        </div>

        <div className="flex items-center gap-2">
          {/* Share button */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowShare(!showShare) }}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            {showShare && (
              <div className="absolute top-12 right-0 glass-card rounded-xl p-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <ShareButtons url={current.src} text={current.name || 'Check out this photo from Digital Official Studio'} />
              </div>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Drag hint */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 pointer-events-none">
        <div className="w-10 h-1 rounded-full bg-white/30" />
        <p className="text-white/40 text-xs mt-1">Swipe down to close</p>
      </div>

      {/* Left arrow */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); goPrev() }}
          className="absolute left-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Right arrow */}
      {currentIndex < items.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goNext() }}
          className="absolute right-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Content */}
      <div
        className="max-h-[90vh] max-w-[90vw] w-full h-full flex flex-col items-center justify-center"
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
            key={current.src}
            src={current.src}
            controls
            autoPlay
            className="max-h-[85vh] max-w-[90vw] rounded-lg"
          />
        ) : (
          <div className="relative w-full h-full">
            <Image
              key={current.src}
              src={current.src}
              alt={current.name || ''}
              fill
              className="object-contain pointer-events-none"
              sizes="90vw"
              priority
              draggable={false}
            />
            {/* Watermark overlay */}
            {showWatermark && (
              <div
                className="absolute inset-0"
                onContextMenu={(e) => e.preventDefault()}
              >
                <WatermarkOverlay config={watermarkConfig} size="lg" />
              </div>
            )}
          </div>
        )}
        {/* Image name */}
        {current.name && (
          <p className="text-white/70 text-sm mt-3 text-center">{current.name}</p>
        )}
      </div>
    </div>
  )
}
