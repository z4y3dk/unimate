import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Database } from '../lib/database.types'

export type Course = Database['public']['Tables']['courses']['Row']
export type NewCourse = Database['public']['Tables']['courses']['Insert']

export function useCourses() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setCourses(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  async function addCourse(course: Omit<NewCourse, 'user_id'>) {
    if (!user) return
    const { data, error } = await supabase
      .from('courses')
      .insert({ ...course, user_id: user.id })
      .select()
      .single()
    if (!error && data) setCourses(prev => [data, ...prev])
    return { data, error }
  }

  async function updateCourse(id: string, patch: Partial<Course>) {
    const { data, error } = await supabase
      .from('courses')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setCourses(prev => prev.map(c => c.id === id ? data : c))
    return { data, error }
  }

  async function deleteCourse(id: string) {
    const { error } = await supabase.from('courses').delete().eq('id', id)
    if (!error) setCourses(prev => prev.filter(c => c.id !== id))
    return { error }
  }

  return { courses, loading, refresh, addCourse, updateCourse, deleteCourse }
}

export async function getCourse(id: string) {
  const { data, error } = await supabase.from('courses').select('*').eq('id', id).single()
  return { data, error }
}
