import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Database } from '../lib/database.types'

export type ClassEntry = Database['public']['Tables']['class_schedule']['Row']
export type NewClassEntry = Database['public']['Tables']['class_schedule']['Insert']

export function useSchedule() {
  const { user } = useAuth()
  const [classes, setClasses] = useState<ClassEntry[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('class_schedule')
      .select('*')
      .eq('user_id', user.id)
      .order('start_time', { ascending: true })
    setClasses(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  // Adds one row per selected day (mirrors FR-3.3 multi-day behavior)
  async function addClassForDays(entry: Omit<NewClassEntry, 'user_id' | 'day_of_week'>, days: number[]) {
    if (!user) return
    const rows = days.map(d => ({ ...entry, user_id: user.id, day_of_week: d }))
    const { data, error } = await supabase.from('class_schedule').insert(rows).select()
    if (!error && data) setClasses(prev => [...prev, ...data])
    return { data, error }
  }

  async function deleteClass(id: string) {
    const { error } = await supabase.from('class_schedule').delete().eq('id', id)
    if (!error) setClasses(prev => prev.filter(c => c.id !== id))
    return { error }
  }

  return { classes, loading, refresh, addClassForDays, deleteClass }
}
