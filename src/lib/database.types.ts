export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          university: string
          major: string
          year_level: string
          gpa_goal: number
          language: 'en' | 'ar'
          theme: 'dark' | 'light'
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
        Relationships: never[]
      }
      courses: {
        Row: {
          id: string
          user_id: string
          name: string
          code: string
          instructor: string
          color: string
          status: 'active' | 'completed' | 'upcoming'
          credits: number
          progress: number
          grade: string | null
          semester: string | null
          topics: unknown
          syllabus_text: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['courses']['Row']> & { user_id: string; name: string }
        Update: Partial<Database['public']['Tables']['courses']['Row']>
        Relationships: never[]
      }
      class_schedule: {
        Row: {
          id: string
          user_id: string
          course_id: string | null
          course_name: string
          color: string
          room: string
          day_of_week: number
          start_time: string
          end_time: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['class_schedule']['Row']> & {
          user_id: string; course_name: string; day_of_week: number; start_time: string; end_time: string
        }
        Update: Partial<Database['public']['Tables']['class_schedule']['Row']>
        Relationships: never[]
      }
      assignments: {
        Row: {
          id: string
          user_id: string
          course_id: string | null
          course_name: string
          course_color: string
          title: string
          description: string
          due_date: string
          type: 'assignment' | 'quiz' | 'project' | 'exam' | 'lab'
          status: 'pending' | 'in_progress' | 'submitted' | 'graded'
          priority: 'low' | 'medium' | 'high'
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['assignments']['Row']> & {
          user_id: string; course_name: string; title: string; due_date: string
        }
        Update: Partial<Database['public']['Tables']['assignments']['Row']>
        Relationships: never[]
      }
      notes: {
        Row: {
          id: string
          user_id: string
          course_id: string | null
          course_name: string
          course_color: string
          title: string
          content: string
          canvas_data: string | null
          updated_at: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['notes']['Row']> & { user_id: string }
        Update: Partial<Database['public']['Tables']['notes']['Row']>
        Relationships: never[]
      }
      weak_spots: {
        Row: {
          id: string
          user_id: string
          course_id: string | null
          topic: string
          wrong_count: number
          resolved: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['weak_spots']['Row']> & { user_id: string; topic: string }
        Update: Partial<Database['public']['Tables']['weak_spots']['Row']>
        Relationships: never[]
      }
      gamification: {
        Row: {
          user_id: string
          total_xp: number
          current_streak: number
          longest_streak: number
          level: number
          last_active_date: string | null
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['gamification']['Row']> & { user_id: string }
        Update: Partial<Database['public']['Tables']['gamification']['Row']>
        Relationships: never[]
      }
      graduation_progress: {
        Row: {
          user_id: string
          gpa: number
          credits_completed: number
          total_credits_required: number
          expected_graduation: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['graduation_progress']['Row']> & { user_id: string }
        Update: Partial<Database['public']['Tables']['graduation_progress']['Row']>
        Relationships: never[]
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          day_of_week: string
          course_name: string
          topic: string
          duration_minutes: number
          priority: 'low' | 'medium' | 'high'
          done: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['study_sessions']['Row']> & {
          user_id: string; day_of_week: string; course_name: string; topic: string
        }
        Update: Partial<Database['public']['Tables']['study_sessions']['Row']>
        Relationships: never[]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
