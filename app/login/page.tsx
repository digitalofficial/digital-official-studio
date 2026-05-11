'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Check role and redirect accordingly
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single()

      if (profile?.role === 'client') {
        router.push('/portal')
      } else {
        router.push('/admin/dashboard')
      }
      router.refresh()
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!email) {
      setError('Please enter your email address')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setResetSent(true)
    }
    setLoading(false)
  }

  const inputClass = "w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-text placeholder:text-muted focus:outline-none focus:border-icy/50 focus:ring-1 focus:ring-icy/50"

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-text mb-2">
            {resetMode ? 'Reset Password' : 'Login'}
          </h1>
          <p className="text-muted">Digital Official Studio</p>
        </div>

        {resetSent ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-green-400/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-text font-medium mb-2">Check your email</p>
            <p className="text-muted text-sm mb-4">We sent a password reset link to <span className="text-silver">{email}</span></p>
            <button
              onClick={() => { setResetMode(false); setResetSent(false) }}
              className="text-icy text-sm hover:underline"
            >
              Back to Login
            </button>
          </div>
        ) : resetMode ? (
          <form onSubmit={handleResetPassword} className="glass-card rounded-xl p-8 space-y-6">
            <p className="text-muted text-sm">Enter your email and we&apos;ll send you a link to reset your password.</p>
            <div>
              <label htmlFor="resetEmail" className="block text-sm text-silver mb-2">Email</label>
              <input
                id="resetEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <button
              type="button"
              onClick={() => { setResetMode(false); setError('') }}
              className="text-muted text-sm hover:text-silver transition-colors w-full text-center"
            >
              Back to Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="glass-card rounded-xl p-8 space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm text-silver mb-2">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm text-silver mb-2">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => { setResetMode(true); setError('') }}
              className="text-muted text-sm hover:text-silver transition-colors w-full text-center"
            >
              Forgot password?
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
