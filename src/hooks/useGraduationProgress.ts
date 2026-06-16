import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Database } from '../lib/database.types'

export type GraduationProgress = Database['public']['Tables']['graduation_progress']['Row']

export function useGraduationProgress() {
  const { user } = useAuth()
  const [data, setData] = useState<GraduationProgress | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data: row } = await supabase
      .from('graduation_progress')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    setData(row)
    setLoading(false)
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  async function update(patch: Partial<GraduationProgress>) {
    if (!user) return
    const { data: updated, error } = await supabase
      .from('graduation_progress')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .select()
      .single()
    if (!error && updated) setData(updated)
    return { data: updated, error }
  }

  return { progress: data, loading, refresh, update }
}
