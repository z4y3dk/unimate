import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Database } from '../lib/database.types'

export type WeakSpot = Database['public']['Tables']['weak_spots']['Row']

export function useWeakSpots() {
  const { user } = useAuth()
  const [weakSpots, setWeakSpots] = useState<WeakSpot[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('weak_spots')
      .select('*')
      .eq('user_id', user.id)
      .eq('resolved', false)
      .order('created_at', { ascending: false })
    setWeakSpots(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  async function recordWrongAnswer(courseId: string | null, topic: string) {
    if (!user) return
    const { data: existing } = await supabase
      .from('weak_spots')
      .select('*')
      .eq('user_id', user.id)
      .eq('topic', topic)
      .eq('resolved', false)
      .maybeSingle()

    if (existing) {
      const { data, error } = await supabase
        .from('weak_spots')
        .update({ wrong_count: existing.wrong_count + 1 })
        .eq('id', existing.id)
        .select()
        .single()
      if (!error && data) setWeakSpots(prev => prev.map(w => w.id === data.id ? data : w))
      return { data, error }
    }

    const { data, error } = await supabase
      .from('weak_spots')
      .insert({ user_id: user.id, course_id: courseId, topic })
      .select()
      .single()
    if (!error && data) setWeakSpots(prev => [data, ...prev])
    return { data, error }
  }

  async function resolve(id: string) {
    const { error } = await supabase.from('weak_spots').update({ resolved: true }).eq('id', id)
    if (!error) setWeakSpots(prev => prev.filter(w => w.id !== id))
    return { error }
  }

  return { weakSpots, loading, refresh, recordWrongAnswer, resolve }
}
