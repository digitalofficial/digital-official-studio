'use client'

import { useEffect, useState } from 'react'

interface Profile {
  id: string
  email: string
  display_name: string | null
  role: 'admin' | 'photographer' | 'client'
  assigned_galleries: string[]
  password_plain: string | null
  created_at: string
  last_sign_in_at: string | null
}

interface Gallery {
  id: string
  event_name: string
  client_name: string
}

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([])
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'client' as string,
    assignedGalleries: [] as string[],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set())
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null)

  async function fetchUsers() {
    const res = await fetch('/api/admin/users')
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }

  async function fetchGalleries() {
    const res = await fetch('/api/admin/galleries')
    if (res.ok) {
      const data = await res.json()
      setGalleries(data.map((g: any) => ({ id: g.id, event_name: g.event_name, client_name: g.client_name })))
    }
  }

  useEffect(() => { fetchUsers(); fetchGalleries() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      setForm({ email: '', password: '', displayName: '', role: 'client', assignedGalleries: [] })
      setShowForm(false)
      fetchUsers()
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to create user')
    }
    setSaving(false)
  }

  async function handleUpdate(id: string) {
    setSaving(true)
    setError('')
    const user = users.find((u) => u.id === id)
    if (!user) return

    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: form.role,
        displayName: form.displayName,
        assignedGalleries: form.assignedGalleries,
      }),
    })

    if (res.ok) {
      setEditingId(null)
      fetchUsers()
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to update user')
    }
    setSaving(false)
  }

  function startEdit(user: Profile) {
    setEditingId(user.id)
    setForm({
      email: user.email,
      password: '',
      displayName: user.display_name || '',
      role: user.role,
      assignedGalleries: user.assigned_galleries || [],
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm({ email: '', password: '', displayName: '', role: 'client', assignedGalleries: [] })
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this user?')) return
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchUsers()
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to delete user')
    }
  }

  async function handleResetPassword(user: Profile) {
    if (!confirm(`Send a password reset email to ${user.email}?`)) return
    const res = await fetch(`/api/admin/users/${user.id}/reset-password`, { method: 'POST' })
    if (res.ok) {
      alert(`Password reset email sent to ${user.email}`)
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to send reset email')
    }
  }

  function togglePasswordVisible(userId: string) {
    setVisiblePasswords((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  async function handlePasswordUpdate(userId: string) {
    if (!newPassword.trim()) return
    setSavingPassword(true)
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    })
    if (res.ok) {
      setEditingPasswordId(null)
      setNewPassword('')
      fetchUsers()
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to update password')
    }
    setSavingPassword(false)
  }

  function copyUserInfo(u: Profile) {
    const lines = [
      `Here are your login details:`,
      ``,
      `Email: ${u.email}`,
      ...(u.password_plain ? [`Password: ${u.password_plain}`] : []),
      `Login: ${typeof window !== 'undefined' ? window.location.origin : ''}/login`,
      ``,
      `Let us know if you have any questions!`,
    ]
    navigator.clipboard.writeText(lines.join('\n'))
    setCopiedUserId(u.id)
    setTimeout(() => setCopiedUserId(null), 2500)
  }

  function toggleGallery(galleryId: string) {
    setForm((prev) => {
      const has = prev.assignedGalleries.includes(galleryId)
      return {
        ...prev,
        assignedGalleries: has
          ? prev.assignedGalleries.filter((id) => id !== galleryId)
          : [...prev.assignedGalleries, galleryId],
      }
    })
  }

  const inputClass = "w-full bg-navy border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm placeholder:text-muted focus:outline-none focus:border-icy/50"
  const labelClass = "block text-xs text-silver mb-1.5"

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: 'bg-red-400/10 text-red-400',
      photographer: 'bg-purple-400/10 text-purple-400',
      client: 'bg-icy/10 text-icy',
    }
    return styles[role] || styles.client
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-text">Users</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null) }} className="btn-primary text-sm !py-2 !px-5">
          {showForm ? 'Cancel' : '+ New User'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass-card rounded-xl p-6 mb-8 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass}
                placeholder="user@example.com"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Password *</label>
              <input
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={inputClass}
                placeholder="Minimum 6 characters"
                required
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Display Name</label>
              <input
                type="text"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                className={inputClass}
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className={labelClass}>Role *</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className={inputClass}
              >
                <option value="admin">Admin</option>
                <option value="photographer">Photographer</option>
                <option value="client">Client</option>
              </select>
            </div>
          </div>

          {(form.role === 'client' || form.role === 'photographer') && galleries.length > 0 && (
            <div>
              <label className={labelClass}>Assign Galleries</label>
              <div className="grid sm:grid-cols-2 gap-2 mt-1">
                {galleries.map((g) => (
                  <label key={g.id} className="flex items-center gap-2 cursor-pointer bg-navy/50 rounded-lg px-3 py-2">
                    <input
                      type="checkbox"
                      checked={form.assignedGalleries.includes(g.id)}
                      onChange={() => toggleGallery(g.id)}
                      className="w-4 h-4 rounded border-white/10 bg-navy text-icy focus:ring-icy"
                    />
                    <span className="text-sm text-silver truncate">{g.event_name} <span className="text-muted">({g.client_name})</span></span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary text-sm !py-2 disabled:opacity-50">
            {saving ? 'Creating...' : 'Create User'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-muted">Loading users...</p>
      ) : users.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <p className="text-muted">No users found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="glass-card rounded-lg p-4 cursor-pointer hover:ring-1 hover:ring-icy/20 transition-all" onClick={() => editingId !== u.id && startEdit(u)}>
              {editingId === u.id ? (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>Display Name</label>
                      <input
                        type="text"
                        value={form.displayName}
                        onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Role</label>
                      <select
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                        className={inputClass}
                      >
                        <option value="admin">Admin</option>
                        <option value="photographer">Photographer</option>
                        <option value="client">Client</option>
                      </select>
                    </div>
                  </div>
                  {(form.role === 'client' || form.role === 'photographer') && galleries.length > 0 && (
                    <div>
                      <label className={labelClass}>Assigned Galleries</label>
                      <div className="grid sm:grid-cols-2 gap-2 mt-1">
                        {galleries.map((g) => (
                          <label key={g.id} className="flex items-center gap-2 cursor-pointer bg-navy/50 rounded-lg px-3 py-2">
                            <input
                              type="checkbox"
                              checked={form.assignedGalleries.includes(g.id)}
                              onChange={() => toggleGallery(g.id)}
                              className="w-4 h-4 rounded border-white/10 bg-navy text-icy focus:ring-icy"
                            />
                            <span className="text-sm text-silver truncate">{g.event_name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdate(u.id)} disabled={saving} className="btn-primary text-sm !py-1.5 !px-4 disabled:opacity-50">
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={cancelEdit} className="text-sm text-muted hover:text-silver transition-colors">Cancel</button>
                  </div>
                  {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-text font-medium">{u.display_name || u.email}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${roleBadge(u.role)}`}>
                          {u.role}
                        </span>
                      </div>
                      <p className="text-muted text-sm mt-0.5">
                        {u.email}
                        {u.assigned_galleries?.length > 0 && ` · ${u.assigned_galleries.length} galleries`}
                      </p>
                      <p className="text-muted text-xs mt-0.5">
                        {u.last_sign_in_at
                          ? `Last login: ${new Date(u.last_sign_in_at).toLocaleDateString()} at ${new Date(u.last_sign_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : 'Never logged in'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); copyUserInfo(u) }}
                        className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                          copiedUserId === u.id
                            ? 'bg-green-400/10 text-green-400'
                            : 'bg-icy/10 text-icy hover:bg-icy/20'
                        }`}
                      >
                        {copiedUserId === u.id ? 'Copied!' : 'Send Info'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleResetPassword(u) }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 transition-colors"
                      >
                        Reset PW
                      </button>
                      <button
                        onClick={() => startEdit(u)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-card text-silver hover:bg-card-hover transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Password field */}
                  <div className="mt-3 pt-3 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted shrink-0">Password:</span>
                      {editingPasswordId === u.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="flex-1 bg-navy border border-white/10 rounded-lg px-3 py-1.5 text-text text-sm placeholder:text-muted focus:outline-none focus:border-icy/50"
                            placeholder="New password (min 6 chars)"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handlePasswordUpdate(u.id)
                              if (e.key === 'Escape') { setEditingPasswordId(null); setNewPassword('') }
                            }}
                          />
                          <button
                            onClick={() => handlePasswordUpdate(u.id)}
                            disabled={savingPassword || !newPassword.trim()}
                            className="text-xs px-3 py-1.5 rounded-lg bg-icy/10 text-icy hover:bg-icy/20 transition-colors disabled:opacity-50"
                          >
                            {savingPassword ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => { setEditingPasswordId(null); setNewPassword('') }}
                            className="text-xs text-muted hover:text-silver transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-1">
                          <code className="bg-navy px-2.5 py-1 rounded text-sm text-text">
                            {visiblePasswords.has(u.id)
                              ? (u.password_plain || 'Not stored')
                              : '••••••••'}
                          </code>
                          <button
                            onClick={() => togglePasswordVisible(u.id)}
                            className="text-muted hover:text-silver transition-colors"
                            title={visiblePasswords.has(u.id) ? 'Hide' : 'Show'}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {visiblePasswords.has(u.id) ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              )}
                            </svg>
                          </button>
                          {u.password_plain && (
                            <button
                              onClick={() => navigator.clipboard.writeText(u.password_plain!)}
                              className="text-muted hover:text-icy transition-colors"
                              title="Copy password"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => { setEditingPasswordId(u.id); setNewPassword(u.password_plain || '') }}
                            className="text-muted hover:text-icy transition-colors"
                            title="Edit password"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
