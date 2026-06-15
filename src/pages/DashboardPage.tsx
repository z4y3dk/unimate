import { useEffect, useState } from 'react'
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

// ── Mock data ────────────────────────────────────────────────────────────────
const MOCK_USER = { name: 'Zayed', university: 'HCT', major: 'Data Science' }

const MOCK_CLASS_NOW = {
  course: 'Big Data Analytics',
  room: 'C204',
  color: '#7c3aed',
  start: '09:00',
  end: '10:30',
  day: 0,
}

const MOCK_ASSIGNMENTS = [
  { id: 1, title: 'Lab Report 3', course: 'Big Data Analytics', courseColor: '#7c3aed', dueDate: new Date(Date.now()) },
  { id: 2, title: 'Database ERD', course: 'Database Systems', courseColor: '#0891b2', dueDate: new Date(Date.now() + 1 * 86400000) },
  { id: 3, title: 'Statistics Assignment 2', course: 'Applied Statistics', courseColor: '#059669', dueDate: new Date(Date.now() + 4 * 86400000) },
  { id: 4, title: 'Network Security Quiz', course: 'Cybersecurity', courseColor: '#dc2626', dueDate: new Date(Date.now() + 6 * 86400000) },
]

const MOCK_WEAK_SPOTS = ['MapReduce Concepts', 'SQL Joins', 'Probability Distributions']
const MOCK_GAMIFICATION = { streak: 12, xp: 1840, level: 7 }
const MOCK_GRADUATION = { completed: 45, required: 120, gpa: 3.4 }
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

function isClassLive(start: string, end: string) {
  const now = new Date()
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const startMins = sh * 60 + sm
  const endMins = eh * 60 + em
  const nowMins = now.getHours() * 60 + now.getMinutes()
  return nowMins >= startMins && nowMins <= endMins
}

function minutesRemaining(end: string) {
  const [eh, em] = end.split(':').map(Number)
  const now = new Date()
  return eh * 60 + em - (now.getHours() * 60 + now.getMinutes())
}

// ── Graduation Ring ───────────────────────────────────────────────────────────
function GraduationRing({ completed, required, gpa }: { completed: number; required: number; gpa: number }) {
  const pct = Math.round((completed / required) * 100)
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
  const [loading, setLoading] = useState(true)
  const { t } = useLang()
  const navigate = useNavigate()
  const live = isClassLive(MOCK_CLASS_NOW.start, MOCK_CLASS_NOW.end)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 900)
    return () => clearTimeout(timer)
  }, [])

  // suppress unused warning — t() will be used when translations are wired to dynamic content
  void t

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <SkeletonLoader className="h-24 w-96 rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Greeting */}
      <div>
        <h1 className="font-playfair text-3xl font-bold text-gray-900 dark:text-white">
          {getGreeting(MOCK_USER.name)}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          {format(new Date(), 'EEEE, d MMMM yyyy')} &nbsp;·&nbsp; Week {getSemesterWeek()} of Semester
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: <Flame className="w-5 h-5 text-orange-400" />, value: `${MOCK_GAMIFICATION.streak} days`, label: 'Streak' },
          { icon: <Zap className="w-5 h-5 text-yellow-400" />, value: `${MOCK_GAMIFICATION.xp.toLocaleString()} XP`, label: 'Total XP' },
          { icon: <Trophy className="w-5 h-5 text-violet-400" />, value: `Level ${MOCK_GAMIFICATION.level}`, label: 'Rank' },
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

          {/* Right Now */}
          <Card className="p-5">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              {live ? '⚡ Right Now' : '⏰ Next Class'}
            </h2>
            <div className="flex items-start gap-4">
              <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: MOCK_CLASS_NOW.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{MOCK_CLASS_NOW.course}</h3>
                  {live
                    ? <Badge variant="danger">Live Now</Badge>
                    : <Badge variant="info">Upcoming</Badge>
                  }
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {MOCK_CLASS_NOW.room}
                  </span>
                  <span>{MOCK_CLASS_NOW.start} – {MOCK_CLASS_NOW.end}</span>
                  {live && (
                    <span className="text-violet-600 dark:text-violet-400 font-medium">
                      {minutesRemaining(MOCK_CLASS_NOW.end)} min remaining
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* This Week */}
          <Card className="p-5">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              📅 This Week's Deadlines
            </h2>
            <div className="space-y-3">
              {MOCK_ASSIGNMENTS.map(a => (
                <div key={a.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => navigate('/assignments')}
                >
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: a.courseColor }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{a.course}</p>
                  </div>
                  <div className="flex-shrink-0">{getDueBadge(a.dueDate)}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Graduation ring */}
          <Card className="p-5 flex flex-col items-center gap-2">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-full">
              🎓 Graduation Progress
            </h2>
            <GraduationRing {...MOCK_GRADUATION} />
          </Card>

          {/* Weak Spots */}
          <Card className="p-5">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              ⚠️ Weak Spots
            </h2>
            {MOCK_WEAK_SPOTS.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No weak spots — great work!</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {MOCK_WEAK_SPOTS.map(spot => (
                  <span key={spot}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/50"
                  >
                    <AlertTriangle className="w-3 h-3" /> {spot}
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
