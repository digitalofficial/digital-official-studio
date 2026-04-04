import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServiceRoleClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('role', 'photographer')
    .order('display_name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}
