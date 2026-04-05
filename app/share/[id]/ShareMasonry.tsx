'use client'

import MasonryGrid from '@/components/MasonryGrid'

interface MediaItem {
  id: string
  file_url: string
  file_type: 'photo' | 'video'
  caption: string | null
  name?: string | null
}

export default function ShareMasonry({ items }: { items: MediaItem[] }) {
  return <MasonryGrid items={items} />
}
