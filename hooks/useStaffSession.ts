'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Session } from '@supabase/supabase-js'
import type { StaffProfile } from '@/types'

const ACTIVE_BRANCH_KEY = 'rishtedar_active_branch'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StaffSession {
  session:          Session | null
  profile:          StaffProfile | null
  /** Slug del local activo, o '*' para vista global (solo super_admin) */
  activeBranch:     string
  setActiveBranch:  (branchId: string) => void
  isLoading:        boolean
  signOut:          () => Promise<void>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStaffSession(): StaffSession {
  const [session, setSession]         = useState<Session | null>(null)
  const [profile, setProfile]         = useState<StaffProfile | null>(null)
  const [activeBranch, setActiveBranchState] = useState<string>('*')
  const [isLoading, setIsLoading]     = useState(true)

  const supabase = createClient()

  // Fetch profile from staff_profiles (RLS allows reading own row)
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('staff_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error && data) {
      const prof = data as StaffProfile

      setProfile(prof)

      // Para managers: forzar activeBranch a su único local asignado
      if (prof.role !== 'super_admin' && prof.branches.length > 0 && !prof.branches.includes('*')) {
        const stored = localStorage.getItem(ACTIVE_BRANCH_KEY)
        // Solo usar el stored si está dentro de sus branches permitidos
        const validStored = stored && prof.branches.includes(stored)
        setActiveBranchState(validStored ? stored : prof.branches[0])
      } else {
        // super_admin: leer preferencia guardada
        const stored = localStorage.getItem(ACTIVE_BRANCH_KEY)
        setActiveBranchState(stored ?? '*')
      }
    }

    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      if (s?.user) {
        fetchProfile(s.user.id)
      } else {
        setIsLoading(false)
      }
    })

    // Suscribirse a cambios de sesión (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s?.user) {
        fetchProfile(s.user.id)
      } else {
        setProfile(null)
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile, supabase.auth])

  function setActiveBranch(branchId: string) {
    localStorage.setItem(ACTIVE_BRANCH_KEY, branchId)
    setActiveBranchState(branchId)
  }

  async function signOut() {
    await supabase.auth.signOut()
    localStorage.removeItem(ACTIVE_BRANCH_KEY)
    setProfile(null)
    setSession(null)
  }

  return { session, profile, activeBranch, setActiveBranch, isLoading, signOut }
}
