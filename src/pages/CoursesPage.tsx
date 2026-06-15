import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, BookOpen, Clock, ChevronRight, CheckCircle2, GraduationCap } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import SkeletonLoader from '../components/ui/SkeletonLoader'
import { useEffect } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Course {
  id: number
  name: string
  code: string
  instructor: string
  color: string
  status: 'active' | 'completed' | 'upcoming'
  credits: number
  progress: number // 0–100
  nextDeadline: string | null
  nextClassDay: string | null
  topics: number
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const INITIAL_COURSES: Course[] = [
  {
    id: 1, name: 'Big Data Analytics', code: 'IS401', instructor: 'Dr. Al Mansoori',
    color: '#7c3aed', status: 'active', credits: 3, progress: 65,
    nextDeadline: 'Lab Report 3 — Today', nextClassDay: 'Sun, 09:00–10:30', topics: 10,
  },
  {
    id: 2, name: 'Database Systems', code: 'IS312', instructor: 'Dr. Hassan',
    color: '#0891b2', status: 'active', credits: 3, progress: 48,
    nextDeadline: 'ERD Assignment — Tomorrow', nextClassDay: 'Mon, 11:00–12:30', topics: 12,
  },
  {
    id: 3, name: 'Applied Statistics', code: 'MATH301', instructor: 'Dr. Fatima Al Zaabi',
    color: '#059669', status: 'active', credits: 3, progress: 72,
    nextDeadline: 'Assignment 2 — in 4 days', nextClassDay: 'Tue, 08:00–09:30', topics: 9,
  },
  {
    id: 4, name: 'Cybersecurity Fundamentals', code: 'IS320', instructor: 'Dr. Ahmed Khalil',
    color: '#dc2626', status: 'active', credits: 3, progress: 30,
    nextDeadline: 'Network Quiz — in 6 days', nextClassDay: 'Wed, 13:00–14:30', topics: 8,
  },
  {
    id: 5, name: 'Data Structures', code: 'CS201', instructor: 'Dr. Sara Mahmoud',
    color: '#d97706', status: 'completed', credits: 3, progress: 100,
    nextDeadline: null, nextClassDay: null, topics: 14,
  },
  {
    id: 6, name: 'Web Development', code: 'CS305', instructor: 'Dr. Omar Al Rashidi',
    color: '#7c3aed', status: 'upcoming', credits: 3, progress: 0,
    nextDeadline: null, nextClassDay: 'Starts next semester', topics: 0,
  },
]

const COLOR_OPTIONS = [
  { value: '#7c3aed', label: 'Violet' },
  { value: '#0891b2', label: 'Cyan' },
  { value: '#059669', label: 'Green' },
  { value: '#dc2626', label: 'Red' },
  { value: '#d97706', label: 'Amber' },
  { value: '#db2777', label: 'Pink' },
]

// ── Course Card ───────────────────────────────────────────────────────────────
function CourseCard({ course, onClick }: { course: Course; onClick: () => void }) {
  const isCompleted = course.status === 'completed'
  const isUpcoming = course.status === 'upcoming'

  return (
    <Card
      className="p-5 cursor-pointer hover:shadow-md transition-all duration-200 group overflow-hidden relative"
      onClick={onClick}
    >
      {/* Color accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, ${course.color}, ${course.color}88)` }}
      />

      <div className="mt-1 flex items-start justify-between gap-3">
        {/* Icon + name */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl flex-shrink-0" style={{ backgroundColor: `${course.color}20` }}>
            <BookOpen className="w-5 h-5" style={{ color: course.color }} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors leading-snug">
              {course.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{course.code} · {course.instructor}</p>
          </div>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          {isCompleted && <Badge variant="success">✓ Completed</Badge>}
          {isUpcoming && <Badge variant="info">Upcoming</Badge>}
          {!isCompleted && !isUpcoming && <Badge variant="default">{course.credits} cr</Badge>}
          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-600 mt-1" />
        </div>
      </div>

      {/* Progress bar */}
      {!isCompleted ? (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>{isUpcoming ? 'Not started' : `${course.progress}% complete`}</span>
            <span>{course.topics} topics</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${course.progress}%`, backgroundColor: course.color }}
            />
          </div>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>All topics covered · {course.credits} credits earned</span>
        </div>
      )}

      {/* Meta row */}
      {(course.nextDeadline || course.nextClassDay) && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
          {course.nextDeadline && (
            <span className="flex items-center gap-1">
              <GraduationCap className="w-3 h-3" /> {course.nextDeadline}
            </span>
          )}
          {course.nextClassDay && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {course.nextClassDay}
            </span>
          )}
        </div>
      )}
    </Card>
  )
}

// ── Add Course Modal ──────────────────────────────────────────────────────────
interface AddCourseModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (course: Course) => void
}

function AddCourseModal({ isOpen, onClose, onAdd }: AddCourseModalProps) {
  const [form, setForm] = useState({
    name: '', code: '', instructor: '', credits: '3',
    color: '#7c3aed', status: 'active' as Course['status'],
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.code.trim()) return
    onAdd({
      id: Date.now(),
      name: form.name.trim(),
      code: form.code.trim(),
      instructor: form.instructor.trim(),
      color: form.color,
      status: form.status,
      credits: parseInt(form.credits) || 3,
      progress: 0,
      nextDeadline: null,
      nextClassDay: null,
      topics: 0,
    })
    setForm({ name: '', code: '', instructor: '', credits: '3', color: '#7c3aed', status: 'active' })
    onClose()
  }

  const field = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-gray-400 dark:placeholder:text-gray-600'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Course">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Course Name *</label>
            <input className={field} placeholder="e.g. Big Data Analytics" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Course Code *</label>
            <input className={field} placeholder="e.g. IS401" value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Credits</label>
            <select className={field} value={form.credits}
              onChange={e => setForm(f => ({ ...f, credits: e.target.value }))}>
              {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Instructor</label>
            <input className={field} placeholder="e.g. Dr. Al Mansoori" value={form.instructor}
              onChange={e => setForm(f => ({ ...f, instructor: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
            <select className={field} value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value as Course['status'] }))}>
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Color</label>
            <div className="flex gap-2 mt-1">
              {COLOR_OPTIONS.map(c => (
                <button key={c.value} type="button"
                  onClick={() => setForm(f => ({ ...f, color: c.value }))}
                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c.value,
                    borderColor: form.color === c.value ? c.value : 'transparent',
                    boxShadow: form.color === c.value ? `0 0 0 2px white, 0 0 0 4px ${c.value}` : 'none',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" className="flex-1">Add Course</Button>
        </div>
      </form>
    </Modal>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'upcoming'>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(t)
  }, [])

  const filtered = filter === 'all' ? courses : courses.filter(c => c.status === filter)
  const counts = {
    all: courses.length,
    active: courses.filter(c => c.status === 'active').length,
    completed: courses.filter(c => c.status === 'completed').length,
    upcoming: courses.filter(c => c.status === 'upcoming').length,
  }

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'upcoming', label: 'Upcoming' },
  ] as const

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <SkeletonLoader className="h-16 w-80 rounded-2xl" />
        <SkeletonLoader className="h-10 w-96 rounded-full" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonLoader key={i} className="h-44 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-playfair text-3xl font-bold text-gray-900 dark:text-white">Courses</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            {counts.active} active · {counts.completed} completed · {counts.upcoming} upcoming
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 flex-shrink-0">
          <Plus className="w-4 h-4" /> Add Course
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl w-fit">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              filter === f.key
                ? 'bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            {f.label} <span className="text-xs opacity-60 ml-1">{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {/* Course grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="p-4 rounded-2xl bg-gray-100 dark:bg-white/5">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400">No {filter === 'all' ? '' : filter} courses yet</p>
          <Button variant="primary" size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Course
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(course => (
            <CourseCard key={course.id} course={course}
              onClick={() => navigate(`/courses/${course.id}`)} />
          ))}
        </div>
      )}

      {/* Add Course Modal */}
      <AddCourseModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={c => setCourses(prev => [c, ...prev])}
      />
    </div>
  )
}
