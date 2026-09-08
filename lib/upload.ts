'use client'

import { createClient } from '@/lib/supabase/client'

// Client-side upload pipeline. Replaces the old one-file-at-a-time loops with:
//   * a concurrency pool (several files upload at once), and
//   * "store both": for photos, a compressed DISPLAY version is uploaded for fast
//     rendering AND the full-resolution ORIGINAL is kept for download.
// Videos are uploaded once (no browser-side transcode).

const MAX_DISPLAY_DIM = 2560     // longest edge of the display version
const DISPLAY_QUALITY = 0.82     // JPEG quality for the display version
const CONCURRENCY = 4            // simultaneous uploads

// Returns a compressed JPEG blob for display, or null to reuse the original
// (non-images, or images already small enough that a re-encode wouldn't help).
async function makeDisplayVersion(file: File): Promise<Blob | null> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return null
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const longest = Math.max(bitmap.width, bitmap.height)
    const scale = Math.min(1, MAX_DISPLAY_DIM / longest)
    // Already small and not oversized → not worth a second file.
    if (scale === 1 && file.size < 700_000) {
      bitmap.close?.()
      return null
    }
    const w = Math.round(bitmap.width * scale)
    const h = Math.round(bitmap.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) { bitmap.close?.(); return null }
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()
    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', DISPLAY_QUALITY),
    )
  } catch {
    return null
  }
}

export interface UploadOptions {
  galleryId: string
  eventName?: string
  startIndex?: number          // for stable auto-naming when a gallery already has files
  caption?: string
  isPortfolio?: boolean
  endpoint?: string            // defaults to the shared media route
  onProgress?: (done: number, total: number) => void
}

export interface UploadSummary {
  ok: number
  failed: number
  failedNames: string[]
}

export async function uploadGalleryFiles(
  files: File[],
  opts: UploadOptions,
): Promise<UploadSummary> {
  const supabase = createClient()
  const endpoint = opts.endpoint || `/api/admin/galleries/${opts.galleryId}/media`
  const total = files.length
  let done = 0
  const summary: UploadSummary = { ok: 0, failed: 0, failedNames: [] }

  const publicUrl = (path: string) =>
    supabase.storage.from('media').getPublicUrl(path).data.publicUrl

  async function processOne(file: File, i: number) {
    try {
      const fileType = file.type.startsWith('video/') ? 'video' : 'photo'
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
      const base = `galleries/${opts.galleryId}/${Date.now()}-${Math.random().toString(36).slice(2)}`

      // 1. Upload the full-resolution ORIGINAL.
      const originalPath = `${base}.${ext}`
      const orig = await supabase.storage.from('media').upload(originalPath, file, {
        contentType: file.type || 'application/octet-stream',
      })
      if (orig.error) throw orig.error
      const originalUrl = publicUrl(originalPath)

      // 2. For photos, upload a compressed DISPLAY version; else display == original.
      let displayUrl = originalUrl
      if (fileType === 'photo') {
        const display = await makeDisplayVersion(file)
        if (display && display.size < file.size) {
          const displayPath = `${base}-display.jpg`
          const d = await supabase.storage.from('media').upload(displayPath, display, {
            contentType: 'image/jpeg',
          })
          if (!d.error) displayUrl = publicUrl(displayPath)
        }
      }

      const num = (opts.startIndex || 0) + i + 1
      const autoName = `${opts.eventName || 'Gallery'} - ${fileType === 'video' ? 'Video' : 'Image'} ${num}`

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: displayUrl,
          originalUrl,
          fileType,
          caption: opts.caption,
          name: autoName,
          isPortfolio: opts.isPortfolio || false,
        }),
      })
      if (!res.ok) throw new Error(`DB insert failed (${res.status})`)
      summary.ok++
    } catch (e) {
      console.error('Upload failed for', file.name, e)
      summary.failed++
      summary.failedNames.push(file.name)
    } finally {
      done++
      opts.onProgress?.(done, total)
    }
  }

  // Concurrency pool: N workers pull from a shared queue.
  const queue = files.map((file, i) => ({ file, i }))
  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length || 1) }, async () => {
    for (;;) {
      const next = queue.shift()
      if (!next) break
      await processOne(next.file, next.i)
    }
  })
  await Promise.all(workers)
  return summary
}
