import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Database } from '../lib/database.types'

export type StudySession = Database['public']['Tables']['study_sessions']['Row']
export type NewStudySession = Database['public']['Tables']['study_sessions']['Insert']

export function useStudySessions() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    setSessions(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  async function toggleDone(id: string, done: boolean) {
    const { data, error } = await supabase
      .from('study_sessions')
      .update({ done })
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setSessions(prev => prev.map(s => s.id === id ? data : s))
    return { data, error }
  }

  async function regenerate(newSessions: Omit<NewStudySession, 'user_id'>[]) {
    if (!user) return
    await supabase.from('study_sessions').delete().eq('user_id', user.id)
    const { data, error } = await supabase
      .from('study_sessions')
      .insert(newSessions.map(s => ({ ...s, user_id: user.id })))
      .select()
    if (!error && data) setSessions(data)
    return { data, error }
  }

  return { sessions, loading, refresh, toggleDone, regenerate }
}
