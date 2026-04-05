'use client'

import MasonryGrid from '@/components/MasonryGrid'
import { type WatermarkConfig } from '@/components/WatermarkOverlay'

interface MediaItem {
  id: string
  file_url: string
  file_type: 'photo' | 'video'
  caption: string | null
  name?: string | null
  watermark_enabled?: boolean
}

interface Props {
  items: MediaItem[]
  watermarkConfig?: WatermarkConfig
}

export default function CollectionView({ items, watermarkConfig }: Props) {
  return <MasonryGrid items={items} showDownload watermarkConfig={watermarkConfig} />
}
