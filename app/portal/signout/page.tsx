'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignOut() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.signOut().then(() => {
      router.push('/login')
      router.refresh()
    })
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center">
      <p className="text-muted">Signing out...</p>
    </div>
  )
}
