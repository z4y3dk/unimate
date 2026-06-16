import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Database } from '../lib/database.types'

export type Note = Database['public']['Tables']['notes']['Row']
export type NewNote = Database['public']['Tables']['notes']['Insert']

export function useNotes() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
    setNotes(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  async function addNote(n: Omit<NewNote, 'user_id'>) {
    if (!user) return
    const { data, error } = await supabase
      .from('notes')
      .insert({ ...n, user_id: user.id })
      .select()
      .single()
    if (!error && data) setNotes(prev => [data, ...prev])
    return { data, error }
  }

  async function updateNote(id: string, patch: Partial<Note>) {
    const { data, error } = await supabase
      .from('notes')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setNotes(prev => prev.map(n => n.id === id ? data : n))
    return { data, error }
  }

  async function deleteNote(id: string) {
    const { error } = await supabase.from('notes').delete().eq('id', id)
    if (!error) setNotes(prev => prev.filter(n => n.id !== id))
    return { error }
  }

  return { notes, loading, refresh, addNote, updateNote, deleteNote }
}
