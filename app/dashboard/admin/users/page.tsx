import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { StaffAdminView } from '@/components/dashboard/StaffAdminView'

export const metadata: Metadata = {
  title: 'Usuarios · Rishtedar Admin',
  robots: { index: false, follow: false },
}

export default async function AdminUsersPage() {
  // Server-side guard: solo super_admin puede ver esta página
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/dashboard/login')
  }

  const adminClient = await createAdminClient()
  const { data: profile } = await adminClient
    .from('staff_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_admin') {
    redirect('/dashboard')
  }

  return <StaffAdminView />
}
