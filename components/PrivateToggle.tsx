'use client'

import { useState } from 'react'

interface Props {
  isPrivate: boolean
  currentPassword?: string | null
  onToggle: (isPrivate: boolean, password?: string) => Promise<void>
  label?: string
  className?: string
}

export default function PrivateToggle({ isPrivate, currentPassword, onToggle, label, className = '' }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [password, setPassword] = useState(currentPassword || '')
  const [saving, setSaving] = useState(false)

  async function handleMakePublic() {
    setSaving(true)
    await onToggle(false)
    setSaving(false)
  }

  async function handleMakePrivate() {
    if (!password.trim()) return
    setSaving(true)
    await onToggle(true, password)
    setSaving(false)
    setShowModal(false)
  }

  function handleClick() {
    if (isPrivate) {
      // Making public — no password needed
      handleMakePublic()
    } else {
      // Making private — need password
      setPassword(currentPassword || '')
      setShowModal(true)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={saving}
        className={`text-xs px-2 py-1 rounded bg-card text-silver hover:bg-card-hover transition-colors disabled:opacity-50 ${className}`}
      >
        {saving ? '...' : isPrivate ? (label || 'Make Public') : (label || 'Make Private')}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-navy/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="glass-card rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-[family-name:var(--font-fraunces)] text-lg text-text mb-2">Set Password</h3>
            <p className="text-muted text-sm mb-4">Enter a password to protect this content.</p>
            <div className="mb-4">
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-card border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm placeholder:text-muted focus:outline-none focus:border-icy/50"
                placeholder="Enter password"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleMakePrivate}
                disabled={saving || !password.trim()}
                className="btn-primary text-sm !py-2 flex-1 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Make Private'}
              </button>
              <button onClick={() => setShowModal(false)} className="btn-secondary text-sm !py-2">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
