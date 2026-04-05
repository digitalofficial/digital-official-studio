'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

type WatermarkStyle = 'angled-repeat' | 'horizontal-repeat' | 'center-once' | 'angled-once' | 'horizontal-once'

const STYLE_OPTIONS: { value: WatermarkStyle; label: string; description: string }[] = [
  { value: 'angled-repeat', label: 'Angled Repeat', description: 'Diagonal repeating pattern across image' },
  { value: 'horizontal-repeat', label: 'Horizontal Repeat', description: 'Horizontal repeating pattern across image' },
  { value: 'center-once', label: 'Center Once', description: 'Single watermark centered on image' },
  { value: 'angled-once', label: 'Angled Once', description: 'Single diagonal watermark centered' },
  { value: 'horizontal-once', label: 'Horizontal Once', description: 'Single horizontal watermark centered' },
]

export default function WatermarkSettings() {
  const [watermarkText, setWatermarkText] = useState('')
  const [watermarkImageUrl, setWatermarkImageUrl] = useState('')
  const [watermarkStyle, setWatermarkStyle] = useState<WatermarkStyle>('angled-repeat')
  const [watermarkOpacity, setWatermarkOpacity] = useState(20)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetch('/api/auth/watermark')
      .then((r) => r.json())
      .then((data) => {
        setWatermarkText(data.watermarkText || '')
        setWatermarkImageUrl(data.watermarkImageUrl || '')
        setWatermarkStyle(data.watermarkStyle || 'angled-repeat')
        setWatermarkOpacity(data.watermarkOpacity ?? 20)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    await fetch('/api/auth/watermark', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        watermarkText,
        watermarkImageUrl,
        watermarkStyle,
        watermarkOpacity,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleImageUpload(file: File) {
    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const filePath = `watermarks/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage
      .from('media')
      .upload(filePath, file, { contentType: file.type })

    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath)
      setWatermarkImageUrl(publicUrl)
    }
    setUploading(false)
  }

  function removeImage() {
    setWatermarkImageUrl('')
  }

  if (loading) return <p className="text-muted text-sm">Loading watermark settings...</p>

  const inputClass = "w-full bg-navy border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm placeholder:text-muted focus:outline-none focus:border-icy/50"
  const previewOpacity = watermarkOpacity / 100

  return (
    <div className="space-y-6">
      {/* Text watermark */}
      <div>
        <label className="block text-xs text-silver mb-1.5">Watermark Text</label>
        <input
          value={watermarkText}
          onChange={(e) => setWatermarkText(e.target.value)}
          className={inputClass}
          placeholder="e.g. Digital Official Studio"
        />
        <p className="text-muted text-xs mt-1">Text displayed as watermark. Leave empty to use image only.</p>
      </div>

      {/* Image watermark */}
      <div>
        <label className="block text-xs text-silver mb-1.5">Watermark Image (Logo)</label>
        {watermarkImageUrl ? (
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-card border border-white/10">
              <Image
                src={watermarkImageUrl}
                alt="Watermark"
                fill
                className="object-contain p-2"
                sizes="96px"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs px-3 py-1.5 rounded-lg bg-card text-silver hover:bg-card-hover transition-colors cursor-pointer inline-block text-center">
                Replace
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                />
              </label>
              <button onClick={removeImage} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                Remove
              </button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-icy/30 transition-colors">
            <div className="text-center">
              <svg className="w-6 h-6 text-muted mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-muted text-xs">{uploading ? 'Uploading...' : 'Upload logo/image'}</p>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              disabled={uploading}
            />
          </label>
        )}
        <p className="text-muted text-xs mt-1">Upload a logo or image to use as watermark. PNG with transparency works best.</p>
      </div>

      {/* Style */}
      <div>
        <label className="block text-xs text-silver mb-1.5">Watermark Style</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {STYLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setWatermarkStyle(opt.value)}
              className={`text-left px-4 py-3 rounded-lg border transition-colors ${
                watermarkStyle === opt.value
                  ? 'border-icy bg-icy/10 text-text'
                  : 'border-white/10 bg-card text-silver hover:bg-card-hover'
              }`}
            >
              <p className="text-sm font-medium">{opt.label}</p>
              <p className="text-xs text-muted mt-0.5">{opt.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Opacity */}
      <div>
        <label className="block text-xs text-silver mb-1.5">Opacity ({watermarkOpacity}%)</label>
        <input
          type="range"
          min={5}
          max={80}
          value={watermarkOpacity}
          onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
          className="w-full accent-icy"
        />
        <div className="flex justify-between text-xs text-muted mt-1">
          <span>Subtle</span>
          <span>Bold</span>
        </div>
      </div>

      {/* Preview */}
      <div>
        <label className="block text-xs text-silver mb-1.5">Preview</label>
        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gradient-to-br from-card to-navy border border-white/10">
          {/* Sample background */}
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted text-sm">Sample Image</p>
          </div>
          {/* Watermark preview */}
          <WatermarkOverlayPreview
            text={watermarkText}
            imageUrl={watermarkImageUrl}
            style={watermarkStyle}
            opacity={previewOpacity}
          />
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary text-sm !py-2.5 w-full disabled:opacity-50"
      >
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Watermark Settings'}
      </button>
    </div>
  )
}

function WatermarkOverlayPreview({
  text,
  imageUrl,
  style,
  opacity,
}: {
  text: string
  imageUrl: string
  style: WatermarkStyle
  opacity: number
}) {
  if (!text && !imageUrl) {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <p className="text-muted text-xs">Set text or upload an image to preview</p>
      </div>
    )
  }

  const isRepeat = style.includes('repeat')
  const isAngled = style.includes('angled') || style === 'angled-repeat'
  const isHorizontal = style.includes('horizontal')
  const isCenterOnce = style === 'center-once'
  const rotation = isAngled ? -30 : 0

  if (isRepeat) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <div
          className="absolute inset-[-50%] flex flex-wrap items-center justify-center gap-12"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {Array.from({ length: 20 }).map((_, i) => (
            <WatermarkUnit key={i} text={text} imageUrl={imageUrl} opacity={opacity} />
          ))}
        </div>
      </div>
    )
  }

  // Single watermark
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
      <div style={{ transform: `rotate(${rotation}deg)` }}>
        <WatermarkUnit text={text} imageUrl={imageUrl} opacity={opacity} large />
      </div>
    </div>
  )
}

function WatermarkUnit({
  text,
  imageUrl,
  opacity,
  large = false,
}: {
  text: string
  imageUrl: string
  opacity: number
  large?: boolean
}) {
  return (
    <div className="flex items-center gap-2 whitespace-nowrap" style={{ opacity }}>
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className={large ? 'w-16 h-16' : 'w-8 h-8'}
          style={{ objectFit: 'contain', userSelect: 'none' }}
          draggable={false}
        />
      )}
      {text && (
        <span
          className={`text-white font-bold ${large ? 'text-2xl' : 'text-lg'}`}
          style={{ userSelect: 'none' }}
        >
          {text}
        </span>
      )}
    </div>
  )
}
