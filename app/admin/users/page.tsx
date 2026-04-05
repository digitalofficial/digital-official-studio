'use client'

import { useEffect, useState } from 'react'

interface Profile {
  id: string
  email: string
  display_name: string | null
  role: 'admin' | 'photographer' | 'client'
  assigned_galleries: string[]
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
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
