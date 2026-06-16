import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns'
import {
  Plus, ClipboardList, CheckCircle2, Clock, MessageSquare,
  AlertCircle, ChevronDown, Filter, GraduationCap,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import SkeletonLoader from '../components/ui/SkeletonLoader'
import { useAssignments, type Assignment } from '../hooks/useAssignments'
import { useCourses } from '../hooks/useCourses'

// ── Types ─────────────────────────────────────────────────────────────────────
type Status = Assignment['status']
type Priority = Assignment['priority']
type AssignmentType = Assignment['type']

// ── Helpers ───────────────────────────────────────────────────────────────────
function getDueBadge(date: Date, status: Status) {
  if (status === 'submitted') return <Badge variant="success">Submitted</Badge>
  if (status === 'graded') return <Badge variant="info">Graded</Badge>
  if (isPast(date) && !isToday(date)) return <Badge variant="danger">Overdue</Badge>
  if (isToday(date)) return <Badge variant="danger">Due Today</Badge>
  if (isTomorrow(date)) return <Badge variant="warning">Due Tomorrow</Badge>
  const days = differenceInDays(date, new Date())
  return <Badge variant="default">in {days} days</Badge>
}

const TYPE_LABELS: Record<AssignmentType, string> = {
  assignment: 'Assignment', quiz: 'Quiz', project: 'Project', exam: 'Exam', lab: 'Lab',
}

const PRIORITY_COLORS: Record<Priority, string> = {
  high: 'text-red-500 dark:text-red-400',
  medium: 'text-amber-500 dark:text-amber-400',
  low: 'text-gray-400 dark:text-gray-500',
}


// ── Assignment Card ───────────────────────────────────────────────────────────
function AssignmentCard({
  a, onMarkComplete, onAskAI, onGrade,
}: {
  a: Assignment
  onMarkComplete: (id: string) => void
  onAskAI: (a: Assignment) => void
  onGrade: (a: Assignment) => void
}) {
  const done = a.status === 'submitted' || a.status === 'graded'
  const dueDate = new Date(a.due_date)
  const hasScore = a.points_earned != null && a.points_possible != null && a.points_possible > 0
  const pct = hasScore ? Math.round((a.points_earned! / a.points_possible!) * 1000) / 10 : null

  return (
    <Card className={`p-4 transition-all duration-200 ${done ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Color dot */}
        <div className="mt-1 w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: a.course_color }} />

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h3 className={`font-medium text-gray-900 dark:text-white ${done ? 'line-through' : ''}`}>
              {a.title}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              {getDueBadge(dueDate, a.status)}
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs text-gray-500 dark:text-gray-400">{a.course_name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400">
              {TYPE_LABELS[a.type]}
            </span>
            <span className={`text-xs font-medium ${PRIORITY_COLORS[a.priority]}`}>
              ● {a.priority} priority
            </span>
            {hasScore && (
              <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                {a.points_earned}/{a.points_possible} ({pct}%)
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{a.description}</p>

          {/* Due date + actions */}
          <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
            <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(dueDate, 'EEE, d MMM yyyy · h:mm a')}
            </span>
            <div className="flex gap-2">
              {!done && (
                <>
                  <button
                    onClick={() => onAskAI(a)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 border border-violet-200 dark:border-violet-700/50 transition-colors"
                  >
                    <MessageSquare className="w-3 h-3" /> Ask AI
                  </button>
                  <button
                    onClick={() => onMarkComplete(a.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50 transition-colors"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Mark Complete
                  </button>
                </>
              )}
              {a.status === 'submitted' || a.status === 'graded' ? (
                <button
                  onClick={() => onGrade(a)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 transition-colors"
                >
                  <GraduationCap className="w-3 h-3" /> {hasScore ? 'Edit Grade' : 'Add Grade'}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

// ── Grade Modal ───────────────────────────────────────────────────────────────
function GradeModal({ isOpen, assignment, onClose, onSave }: {
  isOpen: boolean
  assignment: Assignment | null
  onClose: () => void
  onSave: (id: string, pointsEarned: number, pointsPossible: number) => void
}) {
  const [earned, setEarned] = useState('')
  const [possible, setPossible] = useState('')

  useEffect(() => {
    if (isOpen && assignment) {
      setEarned(assignment.points_earned != null ? String(assignment.points_earned) : '')
      setPossible(assignment.points_possible != null ? String(assignment.points_possible) : '')
    }
  }, [isOpen, assignment])

  const field = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!assignment) return
    const e1 = parseFloat(earned)
    const p1 = parseFloat(possible)
    if (Number.isNaN(e1) || Number.isNaN(p1) || p1 <= 0) return
    onSave(assignment.id, e1, p1)
    setEarned('')
    setPossible('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Grade: ${assignment?.title ?? ''}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Points Earned</label>
            <input type="number" step="0.1" min="0" className={field} value={earned}
              onChange={e => setEarned(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Points Possible</label>
            <input type="number" step="0.1" min="0.1" className={field} value={possible}
              onChange={e => setPossible(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" className="flex-1">Save Grade</Button>
        </div>
      </form>
    </Modal>
  )
}

// ── Add Assignment Modal ──────────────────────────────────────────────────────
function AddAssignmentModal({ isOpen, onClose, onAdd, courses }: {
  isOpen: boolean
  onClose: () => void
  onAdd: (a: { title: string; course_name: string; course_color: string; due_date: string; type: AssignmentType; priority: Priority; description: string }) => void
  courses: { name: string; color: string }[]
}) {
  const defaultCourse = courses[0] ?? { name: '', color: '#7c3aed' }
  const [form, setForm] = useState({
    title: '', course: defaultCourse.name, dueDate: '', type: 'assignment' as AssignmentType,
    priority: 'medium' as Priority, description: '',
  })

  const field = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-gray-400 dark:placeholder:text-gray-600'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.dueDate) return
    const courseObj = courses.find(c => c.name === form.course) ?? defaultCourse
    onAdd({
      title: form.title.trim(), course_name: form.course,
      course_color: courseObj.color, due_date: new Date(form.dueDate).toISOString(),
      type: form.type, priority: form.priority,
      description: form.description.trim(),
    })
    setForm({ title: '', course: defaultCourse.name, dueDate: '', type: 'assignment', priority: 'medium', description: '' })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Assignment">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Title *</label>
          <input className={field} placeholder="e.g. Lab Report 3" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Course</label>
            <select className={field} value={form.course}
              onChange={e => setForm(f => ({ ...f, course: e.target.value }))}>
              {courses.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Due Date *</label>
            <input type="datetime-local" className={field} value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type</label>
            <select className={field} value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value as AssignmentType }))}>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Priority</label>
            <select className={field} value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
          <textarea className={`${field} resize-none`} rows={3} placeholder="What needs to be done?"
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" className="flex-1">Add Assignment</Button>
        </div>
      </form>
    </Modal>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AssignmentsPage() {
  const { assignments, loading, addAssignment, updateAssignment, gradeAssignment } = useAssignments()
  const { courses } = useCourses()
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all')
  const [courseFilter, setCourseFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [gradingAssignment, setGradingAssignment] = useState<Assignment | null>(null)
  const navigate = useNavigate()

  const courseOptions = courses.length > 0
    ? courses.map(c => ({ name: c.name, color: c.color }))
    : [{ name: 'General', color: '#7c3aed' }]

  function markComplete(id: string) {
    updateAssignment(id, { status: 'submitted' })
  }

  function askAI(a: Assignment) {
    navigate(`/ai-tutor?assignment=${encodeURIComponent(a.title)}&course=${encodeURIComponent(a.course_name)}`)
  }

  async function saveGrade(id: string, pointsEarned: number, pointsPossible: number) {
    await gradeAssignment(id, pointsEarned, pointsPossible)
  }

  const filtered = assignments.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false
    if (courseFilter !== 'all' && a.course_name !== courseFilter) return false
    return true
  })

  // Sort: overdue first, then by due date, done items last
  const sorted = [...filtered].sort((a, b) => {
    const aDone = a.status === 'submitted' || a.status === 'graded'
    const bDone = b.status === 'submitted' || b.status === 'graded'
    if (aDone !== bDone) return aDone ? 1 : -1
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  })

  const overdue = assignments.filter(a =>
    isPast(new Date(a.due_date)) && !isToday(new Date(a.due_date)) && a.status === 'pending'
  ).length

  const pending = assignments.filter(a => a.status === 'pending' || a.status === 'in_progress').length

  const STATUS_FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'submitted', label: 'Submitted' },
    { key: 'graded', label: 'Graded' },
  ] as const

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <SkeletonLoader className="h-16 w-72 rounded-2xl" />
        <SkeletonLoader className="h-10 w-full rounded-2xl" />
        {[1, 2, 3, 4].map(i => <SkeletonLoader key={i} className="h-36 rounded-2xl" />)}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-playfair text-3xl font-bold text-gray-900 dark:text-white">Assignments</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-gray-500 dark:text-gray-400">{pending} pending</span>
            {overdue > 0 && (
              <span className="flex items-center gap-1 text-sm text-red-500 dark:text-red-400 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> {overdue} overdue
              </span>
            )}
          </div>
        </div>
        <Button variant="primary" size="md" onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 flex-shrink-0">
          <Plus className="w-4 h-4" /> Add
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Status tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl w-fit overflow-x-auto">
          {STATUS_FILTERS.map(f => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                statusFilter === f.key
                  ? 'bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Course filter toggle */}
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(f => !f)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 transition-colors">
            <Filter className="w-3.5 h-3.5" /> Course filter
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          {courseFilter !== 'all' && (
            <button onClick={() => setCourseFilter('all')}
              className="text-xs text-violet-600 dark:text-violet-400 hover:underline">
              Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setCourseFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                courseFilter === 'all'
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-violet-400'
              }`}>
              All courses
            </button>
            {courseOptions.map(c => (
              <button key={c.name} onClick={() => setCourseFilter(c.name)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  courseFilter === c.name
                    ? 'text-white border-transparent'
                    : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400'
                }`}
                style={courseFilter === c.name ? { backgroundColor: c.color, borderColor: c.color } : {}}>
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Assignment list */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="p-4 rounded-2xl bg-gray-100 dark:bg-white/5">
            <ClipboardList className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400">No assignments match your filters</p>
          <Button variant="primary" size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Assignment
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(a => (
            <AssignmentCard
              key={a.id}
              a={a}
              onMarkComplete={markComplete}
              onAskAI={askAI}
              onGrade={setGradingAssignment}
            />
          ))}
        </div>
      )}

      <AddAssignmentModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={a => addAssignment(a)}
        courses={courseOptions}
      />

      <GradeModal
        isOpen={gradingAssignment != null}
        assignment={gradingAssignment}
        onClose={() => setGradingAssignment(null)}
        onSave={saveGrade}
      />
    </div>
  )
}
