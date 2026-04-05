'use client'

import ShareButtons from '@/components/ShareButtons'

export default function ShareShareButtons() {
  return <ShareButtons url={typeof window !== 'undefined' ? window.location.href : ''} />
}
