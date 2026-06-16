import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, BookOpen, Trash2, Pencil, FileText, ListChecks,
  ClipboardList, GraduationCap, Sparkles, Upload, AlertTriangle,
  StickyNote, MessageSquare, ChevronRight,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import SkeletonLoader from '../components/ui/SkeletonLoader'
import { useCourses, getCourse, type Course } from '../hooks/useCourses'
import { useAssignments } from '../hooks/useAssignments'
import { useNotes } from '../hooks/useNotes'
import { useWeakSpots } from '../hooks/useWeakSpots'
import { calculateCourseGrade } from '../utils/gpa'

const TABS = [
  { key: 'info', label: 'Info', icon: BookOpen },
  { key: 'syllabus', label: 'Syllabus', icon: FileText },
  { key: 'notes', label: 'Notes', icon: StickyNote },
  { key: 'topics', label: 'Topics', icon: ListChecks },
  { key: 'tasks', label: 'Tasks', icon: ClipboardList },
  { key: 'grades', label: 'Grades', icon: GraduationCap },
  { key: 'ai', label: 'AI Tools', icon: Sparkles },
] as const

type TabKey = typeof TABS[number]['key']

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { updateCourse, deleteCourse } = useCourses()
  const { assignments, loading: assignmentsLoading } = useAssignments()
  const { notes, loading: notesLoading } = useNotes()
  const { weakSpots, loading: weakSpotsLoading } = useWeakSpots()

  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabKey>('info')
  const [showDelete, setShowDelete] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [syllabusText, setSyllabusText] = useState('')
  const [extractedTopics, setExtractedTopics] = useState<string[]>([])
  const [extracting, setExtracting] = useState(false)

  useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)
    getCourse(id).then(({ data }) => {
      if (!active) return
      setCourse(data)
      setSyllabusText(data?.syllabus_text ?? '')
      const t = data?.topics
      setExtractedTopics(Array.isArray(t) ? (t as string[]) : [])
      setLoading(false)
    })
    return () => { active = false }
  }, [id])

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <SkeletonLoader className="h-10 w-48 rounded-xl" />
        <SkeletonLoader className="h-32 rounded-2xl" />
        <SkeletonLoader className="h-64 rounded-2xl" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center py-20">
        <p className="text-gray-500 dark:text-gray-400">Course not found.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/courses')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Courses
        </Button>
      </div>
    )
  }

  const courseAssignments = assignments.filter(a => a.course_id === course.id)
  const courseNotes = notes.filter(n => n.course_id === course.id)
  const courseWeakSpots = weakSpots.filter(w => w.course_id === course.id)

  async function handleExtract() {
    const current = course
    if (!syllabusText.trim() || !current) return
    setExtracting(true)
    // Mock extraction: split on lines / sentences, take short fragments as "topics"
    await new Promise(r => setTimeout(r, 600))
    const guesses = syllabusText
      .split(/\n|\.|;/)
      .map(s => s.trim())
      .filter(s => s.length > 4 && s.length < 60)
      .slice(0, 8)
    setExtracting(false)
    setExtractedTopics(guesses)
    await updateCourse(current.id, { syllabus_text: syllabusText, topics: guesses })
    setCourse(c => c ? { ...c, syllabus_text: syllabusText, topics: guesses } : c)
  }

  async function handleDelete() {
    const current = course
    if (!current) return
    await deleteCourse(current.id)
    setShowDelete(false)
    navigate('/courses')
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate('/courses')}
          className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-playfair text-2xl font-bold text-gray-900 dark:text-white">{course.name}</h1>
            {course.status === 'completed' && <Badge variant="success">Completed</Badge>}
            {course.status === 'upcoming' && <Badge variant="info">Upcoming</Badge>}
            {course.status === 'active' && <Badge variant="default">{course.credits} cr</Badge>}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{course.code} · {course.instructor}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl w-fit overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              tab === t.key
                ? 'bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'info' && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl" style={{ backgroundColor: `${course.color}20` }}>
              <BookOpen className="w-6 h-6" style={{ color: course.color }} />
            </div>
            <div className="grid grid-cols-2 gap-4 flex-1 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Instructor</p>
                <p className="text-gray-900 dark:text-white font-medium">{course.instructor || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Credits</p>
                <p className="text-gray-900 dark:text-white font-medium">{course.credits}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Status</p>
                <p className="text-gray-900 dark:text-white font-medium capitalize">{course.status}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Color</p>
                <div className="w-5 h-5 rounded-full mt-0.5" style={{ backgroundColor: course.color }} />
              </div>
            </div>
          </div>

          {course.status !== 'completed' && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Progress</span>
                <span>{course.progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${course.progress}%`, backgroundColor: course.color }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-white/5">
            <Button variant="secondary" size="sm" onClick={() => setShowEdit(true)}>
              <Pencil className="w-4 h-4 mr-1" /> Edit
            </Button>
            <Button variant="ghost" size="sm" className="text-red-600 dark:text-red-400" onClick={() => setShowDelete(true)}>
              <Trash2 className="w-4 h-4 mr-1" /> Delete Course
            </Button>
          </div>
        </Card>
      )}

      {tab === 'syllabus' && (
        <Card className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Paste syllabus text
            </label>
            <textarea
              value={syllabusText}
              onChange={e => setSyllabusText(e.target.value)}
              rows={8}
              placeholder="Paste your syllabus here. We'll mock-extract a topic list from it..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-gray-400 dark:placeholder:text-gray-600"
            />
          </div>
          <Button variant="primary" size="sm" onClick={handleExtract} disabled={extracting || !syllabusText.trim()}>
            <Upload className="w-4 h-4 mr-1" /> {extracting ? 'Extracting…' : 'Extract Topics'}
          </Button>

          {extractedTopics.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Extracted topics</p>
              <div className="flex flex-wrap gap-2">
                {extractedTopics.map((topic, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-full text-xs font-medium bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-700/50">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {tab === 'notes' && (
        <Card className="p-6">
          {notesLoading ? (
            <SkeletonLoader className="h-32 rounded-xl" />
          ) : courseNotes.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <StickyNote className="w-8 h-8 text-gray-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No notes for this course yet</p>
              <Button variant="primary" size="sm" onClick={() => navigate('/notes')}>Go to Notes</Button>
            </div>
          ) : (
            <div className="space-y-2">
              {courseNotes.map(n => (
                <div
                  key={n.id}
                  onClick={() => navigate('/notes')}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{n.title || 'Untitled note'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{n.content}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'topics' && (
        <Card className="p-6">
          {weakSpotsLoading ? (
            <SkeletonLoader className="h-32 rounded-xl" />
          ) : courseWeakSpots.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <ListChecks className="w-8 h-8 text-emerald-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No weak topics tracked for this course</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {courseWeakSpots.map(w => (
                <span key={w.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/50">
                  <AlertTriangle className="w-3 h-3" /> {w.topic} <span className="opacity-60">×{w.wrong_count}</span>
                </span>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'tasks' && (
        <Card className="p-6">
          {assignmentsLoading ? (
            <SkeletonLoader className="h-32 rounded-xl" />
          ) : courseAssignments.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <ClipboardList className="w-8 h-8 text-gray-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No tasks for this course</p>
              <Button variant="primary" size="sm" onClick={() => navigate('/assignments')}>Go to Assignments</Button>
            </div>
          ) : (
            <div className="space-y-2">
              {courseAssignments.map(a => (
                <div
                  key={a.id}
                  onClick={() => navigate('/assignments')}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Due {new Date(a.due_date).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={a.status === 'graded' ? 'success' : a.status === 'submitted' ? 'info' : 'default'}>
                    {a.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'grades' && (() => {
        const gradedAssignments = courseAssignments.filter(
          a => a.points_earned != null && a.points_possible != null
        )
        const computed = calculateCourseGrade(courseAssignments, course.grade)
        return (
          <div className="space-y-4">
            <Card className="p-6 space-y-1">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-6 h-6 text-violet-500" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Current grade</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {computed.letter ?? 'Not graded yet'}
                    {computed.percentage != null && (
                      <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                        ({computed.percentage}%)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 pt-2">
                {computed.source === 'assignments'
                  ? 'Computed from graded assignments below.'
                  : computed.source === 'manual'
                    ? 'Based on the manually-entered grade — grade individual assignments to compute this automatically.'
                    : 'No grades recorded yet.'}
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Graded Assignments
              </h3>
              {assignmentsLoading ? (
                <SkeletonLoader className="h-32 rounded-xl" />
              ) : gradedAssignments.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
                  No assignments graded yet for this course.
                </p>
              ) : (
                <div className="space-y-2">
                  {gradedAssignments.map(a => {
                    const pct = Math.round((a.points_earned! / a.points_possible!) * 1000) / 10
                    return (
                      <div
                        key={a.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {a.points_earned} / {a.points_possible} pts
                          </p>
                        </div>
                        <Badge variant={pct >= 90 ? 'success' : pct >= 70 ? 'info' : 'warning'}>
                          {pct}%
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>
        )
      })()}

      {tab === 'ai' && (
        <Card className="p-6 space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Quick AI-powered actions for {course.name}.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <Button variant="primary" onClick={() => navigate(`/ai-tutor?course=${encodeURIComponent(course.name)}`)}>
              <MessageSquare className="w-4 h-4 mr-2" /> Ask AI Tutor
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/ai-tutor?course=${encodeURIComponent(course.name)}&mode=quiz`)}>
              <Sparkles className="w-4 h-4 mr-2" /> Generate Practice Quiz
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/ai-tutor?course=${encodeURIComponent(course.name)}&mode=summary`)}>
              <FileText className="w-4 h-4 mr-2" /> Summarize Topics
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/planner`)}>
              <ListChecks className="w-4 h-4 mr-2" /> Plan Study Sessions
            </Button>
          </div>
        </Card>
      )}

      {/* Delete confirmation */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Delete Course">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Are you sure you want to delete <span className="font-medium">{course.name}</span>? This cannot be undone.
        </p>
        <div className="flex gap-3 pt-4">
          <Button variant="secondary" className="flex-1" onClick={() => setShowDelete(false)}>Cancel</Button>
          <Button variant="primary" className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>

      {/* Edit modal */}
      <EditCourseModal
        isOpen={showEdit}
        course={course}
        onClose={() => setShowEdit(false)}
        onSave={async patch => {
          const { data } = await updateCourse(course.id, patch)
          if (data) setCourse(data)
          setShowEdit(false)
        }}
      />
    </div>
  )
}

function EditCourseModal({
  isOpen, course, onClose, onSave,
}: {
  isOpen: boolean
  course: Course
  onClose: () => void
  onSave: (patch: Partial<Course>) => void
}) {
  const [form, setForm] = useState({
    name: course.name, code: course.code, instructor: course.instructor,
    credits: String(course.credits), status: course.status,
  })

  useEffect(() => {
    setForm({
      name: course.name, code: course.code, instructor: course.instructor,
      credits: String(course.credits), status: course.status,
    })
  }, [course])

  const field = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Course">
      <form
        onSubmit={e => {
          e.preventDefault()
          onSave({
            name: form.name.trim(),
            code: form.code.trim(),
            instructor: form.instructor.trim(),
            credits: parseInt(form.credits) || course.credits,
            status: form.status,
          })
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Course Name</label>
            <input className={field} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Code</label>
            <input className={field} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Credits</label>
            <input className={field} type="number" value={form.credits} onChange={e => setForm(f => ({ ...f, credits: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Instructor</label>
            <input className={field} value={form.instructor} onChange={e => setForm(f => ({ ...f, instructor: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
            <select className={field} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Course['status'] }))}>
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" className="flex-1">Save Changes</Button>
        </div>
      </form>
    </Modal>
  )
}
