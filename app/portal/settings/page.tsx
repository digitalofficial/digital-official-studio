'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import WatermarkSettings from '@/components/WatermarkSettings'

export default function PortalSettings() {
  const [deleting, setDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function handleDeleteAccount() {
    if (confirmText !== 'DELETE') return
    setDeleting(true)

    const res = await fetch('/api/auth/delete-account', { method: 'DELETE' })

    if (res.ok) {
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } else {
      alert('Failed to delete account. Please try again.')
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy pb-20 lg:pb-0">
      <nav className="border-b border-white/5 bg-navy/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 lg:px-6 h-14 lg:h-16 flex items-center justify-between">
          <Link href="/" className="font-[family-name:var(--font-fraunces)] text-base lg:text-lg text-text">
            Digital Official Studio
          </Link>
          <Link href="/portal" className="text-sm text-silver hover:text-icy transition-colors">Back to Portal</Link>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 lg:px-6 py-8 lg:py-12">
        <Link href="/portal" className="inline-flex items-center gap-2 text-muted hover:text-icy transition-colors mb-6 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-text mb-8">Account Settings</h1>

        {/* Watermark Settings */}
        <div className="glass-card rounded-xl p-6 mb-6">
          <h2 className="text-text font-medium mb-2">Watermark Settings</h2>
          <p className="text-muted text-sm mb-4">Configure how watermarks appear on your galleries when enabled.</p>
          <WatermarkSettings />
        </div>

        {/* Sign Out */}
        <div className="glass-card rounded-xl p-6 mb-6">
          <h2 className="text-text font-medium mb-2">Sign Out</h2>
          <p className="text-muted text-sm mb-4">Sign out of your account on this device.</p>
          <button onClick={handleSignOut} className="btn-secondary text-sm !py-2">Sign Out</button>
        </div>

        {/* Delete Account */}
        <div className="glass-card rounded-xl p-6 border border-red-400/20">
          <h2 className="text-red-400 font-medium mb-2">Delete Account</h2>
          <p className="text-muted text-sm mb-2">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <p className="text-muted text-sm mb-4">
            Your collections will be deleted. Gallery photos you uploaded will remain but will no longer be associated with your account.
          </p>
          <div className="mb-4">
            <label className="block text-xs text-silver mb-1.5">Type DELETE to confirm</label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full bg-card border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm placeholder:text-muted focus:outline-none focus:border-red-400/50"
              placeholder="DELETE"
            />
          </div>
          <button
            onClick={handleDeleteAccount}
            disabled={deleting || confirmText !== 'DELETE'}
            className="text-sm px-4 py-2 rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete My Account'}
          </button>
        </div>
      </div>
    </div>
  )
}
