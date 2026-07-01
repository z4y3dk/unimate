import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Database } from '../lib/database.types'

export type Assignment = Database['public']['Tables']['assignments']['Row']
export type NewAssignment = Database['public']['Tables']['assignments']['Insert']

export function useAssignments() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('assignments')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true })
    setAssignments(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  async function addAssignment(a: Omit<NewAssignment, 'user_id'>) {
    if (!user) return
    const { data, error } = await supabase
      .from('assignments')
      .insert({ ...a, user_id: user.id })
      .select()
      .single()
    if (!error && data) setAssignments(prev => [...prev, data].sort((x, y) => x.due_date.localeCompare(y.due_date)))
    return { data, error }
  }

  async function updateAssignment(id: string, patch: Partial<Assignment>) {
    const { data, error } = await supabase
      .from('assignments')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setAssignments(prev => prev.map(a => a.id === id ? data : a))
    return { data, error }
  }

  async function deleteAssignment(id: string) {
    const { error } = await supabase.from('assignments').delete().eq('id', id)
    if (!error) setAssignments(prev => prev.filter(a => a.id !== id))
    return { error }
  }

  async function gradeAssignment(id: string, pointsEarned: number, pointsPossible: number) {
    return updateAssignment(id, {
      points_earned: pointsEarned,
      points_possible: pointsPossible,
      status: 'graded',
    })
  }

  return { assignments, loading, refresh, addAssignment, updateAssignment, deleteAssignment, gradeAssignment }
}
