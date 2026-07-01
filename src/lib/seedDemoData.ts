import { supabase } from './supabase'
import type { Database } from './database.types'

type CourseInsert = Database['public']['Tables']['courses']['Insert']

// Populates a brand-new account with realistic starter data so the app
// isn't empty on first login. Safe to call multiple times — checks first.
export async function seedDemoDataIfEmpty(userId: string) {
  const { count } = await supabase
    .from('courses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (count && count > 0) return // already has data

  const courses: CourseInsert[] = [
    { user_id: userId, name: 'Big Data Analytics', code: 'IS401', instructor: 'Dr. Al Mansoori', color: '#7c3aed', status: 'active', credits: 3, progress: 65 },
    { user_id: userId, name: 'Database Systems', code: 'IS312', instructor: 'Dr. Hassan', color: '#0891b2', status: 'active', credits: 3, progress: 48 },
    { user_id: userId, name: 'Applied Statistics', code: 'MATH301', instructor: 'Dr. Fatima Al Zaabi', color: '#059669', status: 'active', credits: 3, progress: 72 },
    { user_id: userId, name: 'Cybersecurity Fundamentals', code: 'IS320', instructor: 'Dr. Ahmed Khalil', color: '#dc2626', status: 'active', credits: 3, progress: 30 },
    { user_id: userId, name: 'Data Structures', code: 'CS201', instructor: 'Dr. Sara Mahmoud', color: '#d97706', status: 'completed', credits: 3, progress: 100, grade: 'B+', semester: 'Sem 2' },
  ]

  const { data: insertedCourses } = await supabase.from('courses').insert(courses).select()
  if (!insertedCourses) return

  const byName = (n: string) => insertedCourses.find(c => c.name === n)!

  const now = Date.now()
  const day = 86400000

  await supabase.from('assignments').insert([
    { user_id: userId, course_id: byName('Big Data Analytics').id, course_name: 'Big Data Analytics', course_color: '#7c3aed', title: 'Lab Report 3', due_date: new Date(now).toISOString(), type: 'lab', status: 'in_progress', priority: 'high', description: 'Complete the Hadoop MapReduce lab and submit a written report.' },
    { user_id: userId, course_id: byName('Database Systems').id, course_name: 'Database Systems', course_color: '#0891b2', title: 'Database ERD', due_date: new Date(now + day).toISOString(), type: 'assignment', status: 'pending', priority: 'high', description: 'Design an ERD for the hospital management case study.' },
    { user_id: userId, course_id: byName('Applied Statistics').id, course_name: 'Applied Statistics', course_color: '#059669', title: 'Statistics Assignment 2', due_date: new Date(now + 4 * day).toISOString(), type: 'assignment', status: 'pending', priority: 'medium', description: 'Hypothesis testing and confidence intervals.' },
    { user_id: userId, course_id: byName('Cybersecurity Fundamentals').id, course_name: 'Cybersecurity Fundamentals', course_color: '#dc2626', title: 'Network Security Quiz', due_date: new Date(now + 6 * day).toISOString(), type: 'quiz', status: 'pending', priority: 'medium', description: 'Covers encryption, firewalls, and VPNs.' },
  ])

  await supabase.from('class_schedule').insert([
    { user_id: userId, course_id: byName('Big Data Analytics').id, course_name: 'Big Data Analytics', color: '#7c3aed', room: 'C204', day_of_week: 0, start_time: '09:00', end_time: '10:30' },
    { user_id: userId, course_id: byName('Big Data Analytics').id, course_name: 'Big Data Analytics', color: '#7c3aed', room: 'C204', day_of_week: 2, start_time: '09:00', end_time: '10:30' },
    { user_id: userId, course_id: byName('Database Systems').id, course_name: 'Database Systems', color: '#0891b2', room: 'B105', day_of_week: 1, start_time: '11:00', end_time: '12:30' },
    { user_id: userId, course_id: byName('Database Systems').id, course_name: 'Database Systems', color: '#0891b2', room: 'B105', day_of_week: 3, start_time: '11:00', end_time: '12:30' },
    { user_id: userId, course_id: byName('Applied Statistics').id, course_name: 'Applied Statistics', color: '#059669', room: 'A210', day_of_week: 0, start_time: '08:00', end_time: '09:00' },
    { user_id: userId, course_id: byName('Cybersecurity Fundamentals').id, course_name: 'Cybersecurity Fundamentals', color: '#dc2626', room: 'D301', day_of_week: 1, start_time: '13:00', end_time: '14:30' },
  ])

  await supabase.from('notes').insert([
    { user_id: userId, course_id: byName('Big Data Analytics').id, course_name: 'Big Data Analytics', course_color: '#7c3aed', title: 'MapReduce Overview', content: '# MapReduce Overview\n\nMapReduce is a programming model for processing large datasets...\n\n## Key Concepts\n- **Map Phase**: Processes input data and produces key-value pairs\n- **Reduce Phase**: Aggregates the key-value pairs\n- **HDFS**: Hadoop Distributed File System' },
    { user_id: userId, course_id: byName('Database Systems').id, course_name: 'Database Systems', course_color: '#0891b2', title: 'SQL Joins Cheatsheet', content: '# SQL Joins\n\n## Types of Joins\n- **INNER JOIN**: Returns matching rows from both tables\n- **LEFT JOIN**: All rows from left + matching from right' },
  ])

  await supabase.from('weak_spots').insert([
    { user_id: userId, course_id: byName('Big Data Analytics').id, topic: 'MapReduce Concepts' },
    { user_id: userId, course_id: byName('Database Systems').id, topic: 'SQL Joins' },
    { user_id: userId, course_id: byName('Applied Statistics').id, topic: 'Probability Distributions' },
  ])

  await supabase.from('study_sessions').insert([
    { user_id: userId, day_of_week: 'Monday', course_name: 'Big Data Analytics', topic: 'MapReduce Deep Dive', duration_minutes: 60, priority: 'high' },
    { user_id: userId, day_of_week: 'Monday', course_name: 'Database Systems', topic: 'SQL Joins Practice', duration_minutes: 45, priority: 'medium' },
    { user_id: userId, day_of_week: 'Tuesday', course_name: 'Applied Statistics', topic: 'Hypothesis Testing', duration_minutes: 90, priority: 'high' },
    { user_id: userId, day_of_week: 'Wednesday', course_name: 'Big Data Analytics', topic: 'Hadoop Ecosystem', duration_minutes: 60, priority: 'high' },
    { user_id: userId, day_of_week: 'Thursday', course_name: 'Database Systems', topic: 'Normalization', duration_minutes: 60, priority: 'medium' },
    { user_id: userId, day_of_week: 'Friday', course_name: 'Cybersecurity Fundamentals', topic: 'Network Security Review', duration_minutes: 90, priority: 'low' },
  ])

  await supabase.from('graduation_progress').update({
    gpa: 3.4, credits_completed: 45, total_credits_required: 120, expected_graduation: 'May 2027',
  }).eq('user_id', userId)

  await supabase.from('gamification').update({
    total_xp: 1840, current_streak: 12, longest_streak: 21, level: 7, last_active_date: new Date().toISOString().slice(0, 10),
  }).eq('user_id', userId)
}
