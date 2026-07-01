import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Database } from '../lib/database.types'

export type Gamification = Database['public']['Tables']['gamification']['Row']

function levelFromXp(xp: number) {
  return Math.floor(xp / 250) + 1
}

export function useGamification() {
  const { user } = useAuth()
  const [data, setData] = useState<Gamification | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data: row } = await supabase
      .from('gamification')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    setData(row)
    setLoading(false)
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  async function addXp(amount: number) {
    if (!user || !data) return
    const newXp = data.total_xp + amount
    const newLevel = levelFromXp(newXp)
    const { data: updated, error } = await supabase
      .from('gamification')
      .update({ total_xp: newXp, level: newLevel, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .select()
      .single()
    if (!error && updated) setData(updated)
    return { data: updated, error }
  }

  return { gamification: data, loading, refresh, addXp }
}
