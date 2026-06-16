import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Database } from '../lib/database.types'

export type NoteFolder = Database['public']['Tables']['note_folders']['Row']
export type NewNoteFolder = Database['public']['Tables']['note_folders']['Insert']

export function useNoteFolders() {
  const { user } = useAuth()
  const [folders, setFolders] = useState<NoteFolder[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('note_folders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    setFolders(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  async function addFolder(f: Omit<NewNoteFolder, 'user_id'>) {
    if (!user) return
    const { data, error } = await supabase
      .from('note_folders')
      .insert({ ...f, user_id: user.id })
      .select()
      .single()
    if (!error && data) setFolders(prev => [...prev, data])
    return { data, error }
  }

  async function updateFolder(id: string, patch: Partial<NoteFolder>) {
    const { data, error } = await supabase
      .from('note_folders')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setFolders(prev => prev.map(f => f.id === id ? data : f))
    return { data, error }
  }

  async function deleteFolder(id: string) {
    const { error } = await supabase.from('note_folders').delete().eq('id', id)
    if (!error) setFolders(prev => prev.filter(f => f.id !== id))
    return { error }
  }

  return { folders, loading, refresh, addFolder, updateFolder, deleteFolder }
}
