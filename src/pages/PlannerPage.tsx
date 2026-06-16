import { useState } from 'react'
import { Plus, RefreshCw, Lock, CheckCircle2 } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import SkeletonLoader from '../components/ui/SkeletonLoader'
import { calculateGPA } from '../utils/gpa'
import { useCourses, type Course as DbCourse } from '../hooks/useCourses'
import { useGraduationProgress } from '../hooks/useGraduationProgress'
import { useStudySessions } from '../hooks/useStudySessions'
import { useGamification } from '../hooks/useGamification'

// ── Types ─────────────────────────────────────────────────────────────────────
type GradeOption = 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F'

const GRADE_OPTIONS: GradeOption[] = ['A', 'B+', 'B', 'C+', 'C', 'D', 'F']

// ── Graduation Ring ───────────────────────────────────────────────────────────
function GraduationRing({ completed, required, gpa }: { completed: number; required: number; gpa: number }) {
  const pct = required > 0 ? Math.round((completed / required) * 100) : 0
  const r = 52
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="10"
            className="text-gray-200 dark:text-white/10" />
          <circle cx="60" cy="60" r={r} fill="none"
            stroke="url(#plannerGrad)" strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 0.8s ease' }} />
          <defs>
            <linearGradient id="plannerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">{pct}%</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">done</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <span className="font-semibold text-gray-900 dark:text-white">{completed}</span>/{required} credits
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          GPA <span className="font-semibold text-violet-600 dark:text-violet-400">{gpa.toFixed(2)}</span>
        </p>
      </div>
    </div>
  )
}

// ── Add Course Modal ──────────────────────────────────────────────────────────
interface AddCourseModalProps {
  onClose: () => void
  onAdd: (course: { name: string; code: string; credits: number; grade: GradeOption; semester: string }) => void
}

function AddCourseModal({ onClose, onAdd }: AddCourseModalProps) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [credits, setCredits] = useState(3)
  const [grade, setGrade] = useState<GradeOption>('A')
  const [semester, setSemester] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !code.trim() || !semester.trim()) return
    onAdd({ name: name.trim(), code: code.trim(), credits, grade, semester: semester.trim() })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Past Course</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Course Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Calculus II"
              className="mt-1 w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Code</label>
              <input
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="e.g. MATH201"
                className="mt-1 w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Credits</label>
              <input
                type="number"
                min={1}
                max={4}
                value={credits}
                onChange={e => setCredits(Number(e.target.value))}
                className="mt-1 w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Grade</label>
              <select
                value={grade}
                onChange={e => setGrade(e.target.value as GradeOption)}
                className="mt-1 w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Semester</label>
              <input
                value={semester}
                onChange={e => setSemester(e.target.value)}
                placeholder="e.g. Sem 3"
                className="mt-1 w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1">Add Course</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

// ── Priority Badge ────────────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  if (priority === 'high') return <Badge variant="danger">High</Badge>
  if (priority === 'medium') return <Badge variant="warning">Medium</Badge>
  return <Badge variant="default">Low</Badge>
}

// ── Tab 1: Academic Plan ──────────────────────────────────────────────────────
function AcademicPlanTab() {
  const { courses, loading, addCourse, updateCourse } = useCourses()
  const { progress } = useGraduationProgress()
  const [showModal, setShowModal] = useState(false)

  const completedCourses = courses.filter((c) => c.grade)
  const gpa = calculateGPA(completedCourses.map(c => ({ grade: c.grade as string, credits: c.credits })))

  const creditsCompleted = progress?.credits_completed ?? completedCourses.reduce((sum, c) => sum + c.credits, 0)
  const totalCreditsRequired = progress?.total_credits_required ?? 120
  const expectedGraduation = progress?.expected_graduation ?? 'TBD'

  function updateGrade(id: string, grade: GradeOption) {
    updateCourse(id, { grade })
  }

  function addCourseRow(course: { name: string; code: string; credits: number; grade: GradeOption; semester: string }) {
    addCourse({
      name: course.name,
      code: course.code,
      credits: course.credits,
      grade: course.grade,
      semester: course.semester,
      status: 'completed',
    })
  }

  if (loading) {
    return <SkeletonLoader className="h-64 rounded-2xl" />
  }

  return (
    <div className="space-y-6">
      {/* Graduation Progress */}
      <Card className="p-6">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-5">
          🎓 Graduation Progress
        </h2>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <GraduationRing completed={creditsCompleted} required={totalCreditsRequired} gpa={gpa} />
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 text-center">
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{gpa.toFixed(2)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Current GPA</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{expectedGraduation}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Expected Graduation</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 text-center flex flex-col items-center justify-center gap-1">
                <Badge variant="success" className="text-sm px-3 py-1">On Track</Badge>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Status</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Course Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Completed Courses
          </h2>
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Past Course
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10">
                {['Course', 'Code', 'Credits', 'Grade', 'Semester'].map(col => (
                  <th key={col} className="text-left py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {completedCourses.map((course: DbCourse) => (
                <tr key={course.id} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3 font-medium text-gray-900 dark:text-white">{course.name}</td>
                  <td className="py-3 px-3 text-gray-500 dark:text-gray-400 font-mono text-xs">{course.code}</td>
                  <td className="py-3 px-3 text-gray-700 dark:text-gray-300 text-center">{course.credits}</td>
                  <td className="py-3 px-3">
                    <select
                      value={course.grade ?? 'A'}
                      onChange={e => updateGrade(course.id, e.target.value as GradeOption)}
                      className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </td>
                  <td className="py-3 px-3 text-gray-500 dark:text-gray-400">{course.semester}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          Live GPA: <span className="font-semibold text-violet-600 dark:text-violet-400">{gpa.toFixed(2)}</span> — updates as you change grades
        </p>
      </Card>

      {showModal && <AddCourseModal onClose={() => setShowModal(false)} onAdd={addCourseRow} />}
    </div>
  )
}

// ── Tab 2: Study Schedule ─────────────────────────────────────────────────────
function StudyScheduleTab() {
  const { sessions, loading, toggleDone, regenerate } = useStudySessions()
  const [regenerating, setRegenerating] = useState(false)

  const days = Array.from(new Set(sessions.map((s) => s.day_of_week)))

  async function handleRegenerate() {
    setRegenerating(true)
    // Re-create sessions fresh (resetting done state) using the same data
    const fresh = sessions.map((s) => ({
      day_of_week: s.day_of_week,
      course_name: s.course_name,
      topic: s.topic,
      duration_minutes: s.duration_minutes,
      priority: s.priority,
      done: false,
    }))
    await regenerate(fresh)
    setRegenerating(false)
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => <SkeletonLoader key={i} className="h-48 rounded-2xl" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Study Plan</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Personalized for your current courses and weak spots</p>
        </div>
        <Button variant="secondary" onClick={handleRegenerate} disabled={regenerating}>
          <RefreshCw className={`w-4 h-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
          {regenerating ? 'Regenerating…' : 'Regenerate Plan'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {days.map((day) => (
          <Card key={day} className="p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 inline-block" />
              {day}
            </h3>
            <div className="space-y-3">
              {sessions.filter((s) => s.day_of_week === day).map((session) => (
                <div
                  key={session.id}
                  className={`p-3 rounded-xl border transition-all ${session.done
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-700/30 opacity-60'
                    : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleDone(session.id, !session.done)}
                      className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${session.done
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300 dark:border-white/30 hover:border-violet-400'
                        }`}
                    >
                      {session.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${session.done ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                        {session.topic}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{session.course_name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{session.duration_minutes} min</span>
                        <PriorityBadge priority={session.priority} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ── Tab 3: Achievements ───────────────────────────────────────────────────────
function AchievementsTab() {
  const { gamification, loading } = useGamification()

  if (loading || !gamification) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <SkeletonLoader key={i} className="h-32 rounded-2xl" />)}
        </div>
        <SkeletonLoader className="h-32 rounded-2xl" />
      </div>
    )
  }

  const currentXP = gamification.total_xp
  const level = gamification.level
  const levelThreshold = (level - 1) * 250
  const nextLevelThreshold = level * 250
  const xpInLevel = currentXP - levelThreshold
  const xpNeeded = nextLevelThreshold - levelThreshold
  const xpToNext = nextLevelThreshold - currentXP
  const progress = xpNeeded > 0 ? (xpInLevel / xpNeeded) * 100 : 0

  const BADGES = [
    { icon: '📝', name: 'First Note', desc: 'Created your first note', earned: currentXP > 0, color: 'from-violet-500 to-purple-600' },
    { icon: '🔥', name: 'Week Warrior', desc: '7-day study streak', earned: gamification.current_streak >= 7, color: 'from-orange-500 to-red-500' },
    { icon: '🧠', name: 'Quiz Master', desc: 'Completed 10 quizzes', earned: currentXP >= 500, color: 'from-blue-500 to-cyan-500' },
    { icon: '🤖', name: 'AI Explorer', desc: 'First AI chat session', earned: currentXP > 0, color: 'from-emerald-500 to-teal-500' },
    { icon: '⏰', name: 'Deadline Crusher', desc: 'Submit 5 assignments on time', earned: false, color: 'from-gray-400 to-gray-500' },
    { icon: '🔥', name: 'Study Streak 30', desc: '30-day study streak', earned: gamification.current_streak >= 30, color: 'from-gray-400 to-gray-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Big stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: '🔥', label: 'Streak', value: `${gamification.current_streak} days`, color: 'from-orange-500/20 to-red-500/20 border-orange-500/30' },
          { icon: '⚡', label: 'Total XP', value: currentXP.toLocaleString(), color: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30' },
          { icon: '🏆', label: 'Level', value: String(level), color: 'from-violet-500/20 to-purple-500/20 border-violet-500/30' },
          { icon: '🏅', label: 'Longest Streak', value: `${gamification.longest_streak} days`, color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30' },
        ].map(stat => (
          <Card key={stat.label} className={`p-5 bg-gradient-to-br ${stat.color} border text-center`}>
            <div className="text-3xl mb-2">{stat.icon}</div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* XP Progress */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Level {level} → Level {level + 1}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{xpToNext} XP to Level {level + 1}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-violet-600 dark:text-violet-400">{currentXP.toLocaleString()} XP</p>
            <p className="text-xs text-gray-400">/ {nextLevelThreshold.toLocaleString()} XP</p>
          </div>
        </div>
        <div className="h-3 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-gray-400">
          <span>{levelThreshold.toLocaleString()} XP</span>
          <span>{nextLevelThreshold.toLocaleString()} XP</span>
        </div>
      </Card>

      {/* Badges grid */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Badges</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {BADGES.map(badge => (
            <Card
              key={badge.name}
              className={`p-5 relative overflow-hidden ${badge.earned ? '' : 'opacity-70'}`}
            >
              {badge.earned ? (
                <>
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${badge.color} flex items-center justify-center text-2xl mb-3 shadow-lg`}>
                    {badge.icon}
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{badge.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{badge.desc}</p>
                  <Badge variant="success" className="mt-2">Earned</Badge>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-white/10 flex items-center justify-center text-2xl mb-3 grayscale">
                    {badge.icon}
                  </div>
                  <p className="font-semibold text-gray-500 dark:text-gray-400 text-sm">{badge.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{badge.desc}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Lock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-400">Locked</span>
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
type Tab = 'academic' | 'schedule' | 'achievements'

export default function PlannerPage() {
  const [activeTab, setActiveTab] = useState<Tab>('academic')

  const TABS: { key: Tab; label: string }[] = [
    { key: 'academic', label: 'Academic Plan' },
    { key: 'schedule', label: 'Study Schedule' },
    { key: 'achievements', label: 'Achievements' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-playfair text-3xl font-bold text-gray-900 dark:text-white">Planner</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Track your academic journey and study schedule</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-white/5 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'academic' && <AcademicPlanTab />}
      {activeTab === 'schedule' && <StudyScheduleTab />}
      {activeTab === 'achievements' && <AchievementsTab />}
    </div>
  )
}
