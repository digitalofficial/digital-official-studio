import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminSidebar from './AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get or create profile
  let { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // First-time user without profile — assume admin (for existing users before profiles table)
    await supabase.from('profiles').insert({
      id: user.id,
      email: user.email!,
      role: 'admin',
    })
    profile = { role: 'admin' }
  }

  // Clients can't access admin panel
  if (profile.role === 'client') {
    redirect('/portal')
  }

  return (
    <div className="min-h-screen bg-navy flex">
      <AdminSidebar role={profile.role} />
      <main className="flex-1 lg:ml-64 p-4 pb-24 lg:pb-8 lg:p-8">
        {children}
      </main>
    </div>
  )
}
