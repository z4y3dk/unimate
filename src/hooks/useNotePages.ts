import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Database } from '../lib/database.types'

export type NotePage = Database['public']['Tables']['note_pages']['Row']
export type NewNotePage = Database['public']['Tables']['note_pages']['Insert']

export function useNotePages(noteId: string | null) {
  const { user } = useAuth()
  const [pages, setPages] = useState<NotePage[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user || !noteId) {
      setPages([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('note_pages')
      .select('*')
      .eq('note_id', noteId)
      .order('page_number', { ascending: true })
    setPages(data ?? [])
    setLoading(false)
  }, [user, noteId])

  useEffect(() => { refresh() }, [refresh])

  async function addPage(p: Omit<NewNotePage, 'user_id' | 'note_id'>) {
    if (!user || !noteId) return
    const { data, error } = await supabase
      .from('note_pages')
      .insert({ ...p, note_id: noteId, user_id: user.id })
      .select()
      .single()
    if (!error && data) setPages(prev => [...prev, data].sort((a, b) => a.page_number - b.page_number))
    return { data, error }
  }

  async function updatePage(id: string, patch: Partial<NotePage>) {
    const { data, error } = await supabase
      .from('note_pages')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setPages(prev => prev.map(p => p.id === id ? data : p))
    return { data, error }
  }

  async function deletePage(id: string) {
    const { error } = await supabase.from('note_pages').delete().eq('id', id)
    if (!error) setPages(prev => prev.filter(p => p.id !== id))
    return { error }
  }

  return { pages, loading, refresh, addPage, updatePage, deletePage }
}
