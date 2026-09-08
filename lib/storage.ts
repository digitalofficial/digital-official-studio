import { createServiceRoleClient } from '@/lib/supabase/server'

// Phase 3 of the backend redesign: serve PRIVATE client media through short-lived
// signed URLs instead of permanent public URLs. Stored `media_files.file_url` is a
// public URL (…/object/public/media/<path>); this extracts <path> and re-signs it.
//
// Forward-compatible: signing a path works whether the `media` bucket is still
// public or has been flipped private by 0004_private_media_bucket.sql. Use it only
// on DYNAMIC (ƒ) private routes — never on static/public pages, where a signed URL
// would bake an expiry into cached HTML.

const BUCKET = 'media'

export function mediaPathFromUrl(fileUrl: string): string | null {
  if (!fileUrl) return null
  for (const marker of [`/object/public/${BUCKET}/`, `/object/sign/${BUCKET}/`]) {
    const i = fileUrl.indexOf(marker)
    if (i !== -1) return fileUrl.slice(i + marker.length).split('?')[0]
  }
  // Already a bare storage path?
  if (!fileUrl.startsWith('http')) return fileUrl.replace(/^\/+/, '')
  return null
}

// Replace each item's file_url with a short-lived signed URL (batch-signed).
// Unknown/foreign URLs are left untouched.
export async function signMediaUrls<T extends { file_url: string }>(
  items: T[],
  expiresIn = 60 * 60,
): Promise<T[]> {
  if (!items || items.length === 0) return items
  const admin = await createServiceRoleClient()
  const paths = Array.from(
    new Set(items.map((m) => mediaPathFromUrl(m.file_url)).filter((p): p is string => !!p)),
  )
  if (paths.length === 0) return items

  const { data } = await admin.storage.from(BUCKET).createSignedUrls(paths, expiresIn)
  const signedByPath = new Map<string, string>()
  for (const d of data || []) {
    if (d.path && d.signedUrl) signedByPath.set(d.path, d.signedUrl)
  }

  return items.map((m) => {
    const p = mediaPathFromUrl(m.file_url)
    const signed = p ? signedByPath.get(p) : undefined
    return signed ? { ...m, file_url: signed } : m
  })
}
