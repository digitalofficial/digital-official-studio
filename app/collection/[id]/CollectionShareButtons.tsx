'use client'

import ShareButtons from '@/components/ShareButtons'

export default function CollectionShareButtons() {
  return <ShareButtons url={typeof window !== 'undefined' ? window.location.href : ''} />
}
