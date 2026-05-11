'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Supabase will auto-detect the recovery token from the URL hash
    // and establish a session. We just need to wait for it.
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
    // Also check if already in a session (token already exchanged)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })
  }, [supabase.auth])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
  }

  const inputClass = "w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-text placeholder:text-muted focus:outline-none focus:border-icy/50 focus:ring-1 focus:ring-icy/50"

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-text mb-2">Reset Password</h1>
          <p className="text-muted">Digital Official Studio</p>
        </div>

        {success ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-green-400/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-text font-medium mb-2">Password updated!</p>
            <p className="text-muted text-sm">Redirecting to login...</p>
          </div>
        ) : !ready ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <p className="text-muted">Verifying reset link...</p>
            <p className="text-muted text-sm mt-2">If this takes too long, the link may have expired.</p>
            <Link href="/login" className="text-icy text-sm hover:underline mt-4 inline-block">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-card rounded-xl p-8 space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm text-silver mb-2">New Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="Minimum 6 characters"
                required
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm text-silver mb-2">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                placeholder="Confirm your password"
                required
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
