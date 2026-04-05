'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function PortalQuickUpload({ displayName }: { displayName: string }) {
  const [step, setStep] = useState<'idle' | 'files-selected' | 'saving'>('idle')
  const [files, setFiles] = useState<File[]>([])
  const [clientName, setClientName] = useState(displayName)
  const [eventName, setEventName] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [password, setPassword] = useState('')
  const [category, setCategory] = useState('Other')
  const [progress, setProgress] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleFileSelect(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    setFiles(Array.from(fileList))
    setStep('files-selected')
  }

  function handleSlugify(name: string) {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const uid = Math.random().toString(36).slice(2, 8)
    return `${uid}-${base}`
  }

  async function handleCreate() {
    if (!clientName.trim() || !eventName.trim()) return
    if (!isPublic && !password.trim()) return
    setStep('saving')
    setProgress('Creating gallery...')

    const slug = handleSlugify(eventName)
    const res = await fetch('/api/portal/galleries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientName, eventName, slug, password: isPublic ? null : password, isPublic, category }),
    })

    if (!res.ok) {
      setProgress('Failed to create gallery')
      setStep('files-selected')
      return
    }

    const gallery = await res.json()
    const supabase = createClient()

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setProgress(`Uploading ${i + 1} of ${files.length}...`)

      const fileType = file.type.startsWith('video/') ? 'video' : 'photo'
      const ext = file.name.split('.').pop()
      const filePath = `galleries/${gallery.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage
        .from('media')
        .upload(filePath, file, { contentType: file.type })

      if (error) continue

      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath)
      const autoName = `${eventName} - ${fileType === 'video' ? 'Video' : 'Image'} ${i + 1}`

      await fetch(`/api/admin/galleries/${gallery.id}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: publicUrl, fileType, name: autoName }),
      })
    }

    setProgress(null)
    router.push(`/portal/gallery/${gallery.id}`)
    router.refresh()
  }

  function reset() {
    setStep('idle')
    setFiles([])
    setClientName(displayName)
    setEventName('')
    setPassword('')
    setIsPublic(false)
    setCategory('Other')
    setProgress(null)
  }

  const inputClass = "w-full bg-card border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm placeholder:text-muted focus:outline-none focus:border-icy/50"

  return (
    <>
      <button
        onClick={() => fileRef.current?.click()}
        className="btn-primary text-sm !py-3 !px-6 flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Photos
      </button>
      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />

      {step !== 'idle' && (
        <div className="fixed inset-0 z-50 bg-navy/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => step !== 'saving' && reset()}>
          <div className="glass-card rounded-xl p-8 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            {step === 'saving' ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-icy/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <svg className="w-6 h-6 text-icy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <p className="text-text font-medium">{progress}</p>
              </div>
            ) : (
              <>
                <h3 className="font-[family-name:var(--font-fraunces)] text-xl text-text mb-2">Create Gallery</h3>
                <p className="text-muted text-sm mb-6">{files.length} file{files.length > 1 ? 's' : ''} selected. Fill in the gallery details.</p>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs text-silver mb-1.5">Your Name *</label>
                    <input value={clientName} onChange={(e) => setClientName(e.target.value)} className={inputClass} placeholder="Your name" />
                  </div>
                  <div>
                    <label className="block text-xs text-silver mb-1.5">Gallery Name *</label>
                    <input value={eventName} onChange={(e) => setEventName(e.target.value)} className={inputClass} placeholder="e.g. My Photo Collection" />
                  </div>
                  <div>
                    <label className="block text-xs text-silver mb-1.5">Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                      <option>Sweet 16</option>
                      <option>Quincea&ntilde;era</option>
                      <option>Parties</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="w-4 h-4 rounded border-white/10 bg-navy text-icy focus:ring-icy"
                    />
                    <span className="text-sm text-silver">Public gallery (no password)</span>
                  </label>
                  {!isPublic && (
                    <div>
                      <label className="block text-xs text-silver mb-1.5">Password *</label>
                      <input value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="Gallery password" />
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCreate}
                    disabled={!clientName.trim() || !eventName.trim() || (!isPublic && !password.trim())}
                    className="btn-primary text-sm !py-2.5 flex-1 disabled:opacity-50"
                  >
                    Create & Upload
                  </button>
                  <button onClick={reset} className="btn-secondary text-sm !py-2.5">Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
