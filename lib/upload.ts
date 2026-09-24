'use client'

import * as tus from 'tus-js-client'
import { createClient } from '@/lib/supabase/client'

// Client-side upload pipeline. Replaces the old one-file-at-a-time loops with:
//   * a concurrency pool (several files upload at once), and
//   * "store both": for photos, a compressed DISPLAY version is uploaded for fast
//     rendering AND the full-resolution ORIGINAL is kept for download.
// Videos are uploaded once (no browser-side transcode).

const MAX_DISPLAY_DIM = 2560     // longest edge of the display version
const DISPLAY_QUALITY = 0.82     // JPEG quality for the display version
const CONCURRENCY = 4            // simultaneous uploads
const RESUMABLE_THRESHOLD = 6 * 1024 * 1024   // >6MB or any video → resumable (TUS)
const BUCKET = 'media'

// Upload one object, choosing the resumable (TUS) path for large files / videos
// and the fast single-request path for small ones. Resumable uploads chunk the
// file, retry on network drops, and resume interrupted uploads — which is what
// large videos need. Requires the signed-in user's access token (RLS: the
// "Authenticated users can upload media" storage policy applies either way).
async function uploadObject(
  supabase: ReturnType<typeof createClient>,
  path: string,
  data: Blob | File,
  contentType: string,
  accessToken: string | undefined,
  onProgress?: (fraction: number) => void,
) {
  const isVideo = (data as File).type?.startsWith('video/')
  const useResumable = !!accessToken && (data.size > RESUMABLE_THRESHOLD || isVideo)

  if (!useResumable) {
    const { error } = await supabase.storage.from(BUCKET).upload(path, data, { contentType })
    if (error) throw error
    return
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(data, {
      endpoint: `${base}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${accessToken}`,
        ...(anon ? { apikey: anon } : {}),
        'x-upsert': 'true',
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: 6 * 1024 * 1024, // Supabase requires exactly 6MB chunks
      metadata: {
        bucketName: BUCKET,
        objectName: path,
        contentType,
        cacheControl: '3600',
      },
      onError: reject,
      onProgress: (sent, total) => onProgress?.(total ? sent / total : 0),
      onSuccess: () => resolve(),
    })
    upload
      .findPreviousUploads()
      .then((prev) => {
        if (prev.length) upload.resumeFromPreviousUpload(prev[0])
        upload.start()
      })
      .catch(() => upload.start())
  })
}

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
  firstError?: string
}

// Pull a human-readable reason out of whatever the storage/TUS/fetch layer threw.
function errorMessage(e: unknown): string {
  if (!e) return 'Unknown error'
  // tus-js-client wraps the server response on e.originalResponse
  const anyE = e as { message?: string; originalResponse?: { getStatus?: () => number; getBody?: () => string } }
  const status = anyE.originalResponse?.getStatus?.()
  const body = anyE.originalResponse?.getBody?.()
  if (status) return `HTTP ${status}${body ? ` — ${String(body).slice(0, 200)}` : ''}`
  return anyE.message || String(e)
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

  // Access token for resumable (TUS) uploads of large files / videos.
  const { data: { session } } = await supabase.auth.getSession()
  const accessToken = session?.access_token

  const publicUrl = (path: string) =>
    supabase.storage.from('media').getPublicUrl(path).data.publicUrl

  async function processOne(file: File, i: number) {
    try {
      const fileType = file.type.startsWith('video/') ? 'video' : 'photo'
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
      const base = `galleries/${opts.galleryId}/${Date.now()}-${Math.random().toString(36).slice(2)}`

      // 1. Upload the full-resolution ORIGINAL (resumable for videos / large files).
      const originalPath = `${base}.${ext}`
      await uploadObject(supabase, originalPath, file, file.type || 'application/octet-stream', accessToken)
      const originalUrl = publicUrl(originalPath)

      // 2. For photos, upload a compressed DISPLAY version; else display == original.
      let displayUrl = originalUrl
      if (fileType === 'photo') {
        const display = await makeDisplayVersion(file)
        if (display && display.size < file.size) {
          const displayPath = `${base}-display.jpg`
          try {
            await uploadObject(supabase, displayPath, display, 'image/jpeg', accessToken)
            displayUrl = publicUrl(displayPath)
          } catch {
            // Keep the original as the display source if the compressed upload fails.
          }
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
      if (!summary.firstError) summary.firstError = errorMessage(e)
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
