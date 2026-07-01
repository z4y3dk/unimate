import { useNavigate } from 'react-router-dom'
import { format, differenceInDays, isToday, isTomorrow } from 'date-fns'
import {
  FileText, Calendar, ClipboardList, MessageSquare,
  BookOpen, Brain, Flame, Zap, Trophy, MapPin,
  CheckCircle2, AlertTriangle,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import SkeletonLoader from '../components/ui/SkeletonLoader'
import { useLang } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { useCourses } from '../hooks/useCourses'
import { useAssignments } from '../hooks/useAssignments'
import { useWeakSpots } from '../hooks/useWeakSpots'
import { useGamification } from '../hooks/useGamification'
import { useGraduationProgress } from '../hooks/useGraduationProgress'

const SEMESTER_START = new Date('2026-01-19')

// ── Helpers ──────────────────────────────────────────────────────────────────
function getGreeting(name: string) {
  const h = new Date().getHours()
  if (h < 12) return `Good morning, ${name}!`
  if (h < 17) return `Good afternoon, ${name}!`
  return `Good evening, ${name}!`
}

function getSemesterWeek() {
  const weeks = Math.floor(differenceInDays(new Date(), SEMESTER_START) / 7) + 1
  return Math.max(1, Math.min(weeks, 16))
}

function getDueBadge(date: Date) {
  if (isToday(date)) return <Badge variant="danger">Due Today</Badge>
  if (isTomorrow(date)) return <Badge variant="warning">Due Tomorrow</Badge>
  return <Badge variant="default">{format(date, 'dd MMM')}</Badge>
}

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
            stroke="url(#grad)" strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 0.8s ease' }} />
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
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

// ── Quick Actions ─────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: 'Notes', icon: FileText, path: '/notes', color: 'from-violet-500 to-violet-700' },
  { label: 'Schedule', icon: Calendar, path: '/schedule', color: 'from-blue-500 to-blue-700' },
  { label: 'Assignments', icon: ClipboardList, path: '/assignments', color: 'from-rose-500 to-rose-700' },
  { label: 'AI Tutor', icon: MessageSquare, path: '/ai-tutor', color: 'from-cyan-500 to-cyan-700' },
  { label: 'Courses', icon: BookOpen, path: '/courses', color: 'from-emerald-500 to-emerald-700' },
  { label: 'Study', icon: Brain, path: '/ai-tutor', color: 'from-amber-500 to-amber-700' },
]

// ── Main Component ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { t } = useLang()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { courses, loading: coursesLoading } = useCourses()
  const { assignments, loading: assignmentsLoading } = useAssignments()
  const { weakSpots, loading: weakSpotsLoading } = useWeakSpots()
  const { gamification, loading: gamificationLoading } = useGamification()
  const { progress, loading: progressLoading } = useGraduationProgress()

  // suppress unused warning — t() will be used when translations are wired to dynamic content
  void t

  const loading = coursesLoading || assignmentsLoading || weakSpotsLoading || gamificationLoading || progressLoading

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <SkeletonLoader className="h-24 w-full sm:w-96 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <SkeletonLoader key={i} className="h-20 rounded-2xl" />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <SkeletonLoader className="h-40 rounded-2xl" />
            <SkeletonLoader className="h-64 rounded-2xl" />
          </div>
          <div className="space-y-4">
            <SkeletonLoader className="h-52 rounded-2xl" />
            <SkeletonLoader className="h-40 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  const userName = (user?.user_metadata?.name as string | undefined) || user?.email?.split('@')[0] || 'there'

  const upcomingAssignments = assignments
    .filter(a => a.status !== 'graded' && a.status !== 'submitted')
    .slice(0, 5)

  const courseByName = (name: string) => courses.find(c => c.name === name)
  const nowClass = courses.length > 0 ? courses[0] : null

  const streak = gamification?.current_streak ?? 0
  const xp = gamification?.total_xp ?? 0
  const level = gamification?.level ?? 1

  const credsCompleted = progress?.credits_completed ?? 0
  const credsRequired = progress?.total_credits_required ?? 120
  const gpa = progress?.gpa ?? 0

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">

      {/* Greeting */}
      <div>
        <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          {getGreeting(userName)}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          {format(new Date(), 'EEEE, d MMMM yyyy')} &nbsp;·&nbsp; Week {getSemesterWeek()} of Semester
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: <Flame className="w-5 h-5 text-orange-400" />, value: `${streak} days`, label: 'Streak' },
          { icon: <Zap className="w-5 h-5 text-yellow-400" />, value: `${xp.toLocaleString()} XP`, label: 'Total XP' },
          { icon: <Trophy className="w-5 h-5 text-violet-400" />, value: `Level ${level}`, label: 'Rank' },
        ].map(s => (
          <Card key={s.label} className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gray-100 dark:bg-white/10">{s.icon}</div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Right Now / Next class */}
          <Card className="p-5">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              ⏰ {nowClass ? 'Course Spotlight' : 'No Courses Yet'}
            </h2>
            {nowClass ? (
              <div className="flex items-start gap-4">
                <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: nowClass.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{nowClass.name}</h3>
                    <Badge variant="info">{nowClass.status}</Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {nowClass.code}
                    </span>
                    <span>{nowClass.instructor}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Add a course to see it here.</p>
            )}
          </Card>

          {/* This Week */}
          <Card className="p-5">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              📅 Upcoming Deadlines
            </h2>
            {upcomingAssignments.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming deadlines — you're all caught up!</p>
            ) : (
              <div className="space-y-3">
                {upcomingAssignments.map(a => (
                  <div key={a.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => navigate('/assignments')}
                  >
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: a.course_color || courseByName(a.course_name)?.color || '#7c3aed' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{a.course_name}</p>
                    </div>
                    <div className="flex-shrink-0">{getDueBadge(new Date(a.due_date))}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Graduation ring */}
          <Card className="p-5 flex flex-col items-center gap-2">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-full">
              🎓 Graduation Progress
            </h2>
            <GraduationRing completed={credsCompleted} required={credsRequired} gpa={gpa} />
          </Card>

          {/* Weak Spots */}
          <Card className="p-5">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              ⚠️ Weak Spots
            </h2>
            {weakSpots.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No weak spots — great work!</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {weakSpots.slice(0, 8).map(spot => (
                  <span key={spot.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/50"
                  >
                    <AlertTriangle className="w-3 h-3" /> {spot.topic}
                  </span>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card className="p-5">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              ⚡ Quick Actions
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_ACTIONS.map(({ label, icon: Icon, path, color }) => (
                <button key={label} onClick={() => navigate(path)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:scale-105 transition-transform"
                >
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${color}`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{label}</span>
                </button>
              ))}
            </div>
          </Card>

        </div>
      </div>
    </div>
  )
}
