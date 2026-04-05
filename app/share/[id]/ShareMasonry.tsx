'use client'

import MasonryGrid from '@/components/MasonryGrid'
import { type WatermarkConfig } from '@/components/WatermarkOverlay'

interface MediaItem {
  id: string
  file_url: string
  file_type: 'photo' | 'video'
  caption: string | null
  name?: string | null
}

interface Props {
  items: MediaItem[]
  watermarkEnabled?: boolean
  isPaid?: boolean
  watermarkConfig?: WatermarkConfig
}

export default function ShareMasonry({ items, watermarkEnabled = false, isPaid = false, watermarkConfig }: Props) {
  return <MasonryGrid items={items} watermarkEnabled={watermarkEnabled} isPaid={isPaid} watermarkConfig={watermarkConfig} />
}
