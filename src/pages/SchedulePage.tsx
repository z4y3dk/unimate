import { useEffect, useState } from 'react'
import { Plus, MapPin, Clock } from 'lucide-react'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import SkeletonLoader from '../components/ui/SkeletonLoader'

// ── Types ─────────────────────────────────────────────────────────────────────
interface ClassEntry {
  id: number
  course: string
  code: string
  room: string
  instructor: string
  color: string
  days: number[]   // 0=Sun … 6=Sat
  startTime: string // "HH:MM"
  endTime: string
}

// ── Constants ─────────────────────────────────────────────────────────────────
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu']
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Time slots 07:00 – 20:00
const TIME_SLOTS: string[] = []
for (let h = 7; h <= 20; h++) TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`)

const COLOR_OPTIONS = [
  { value: '#7c3aed', label: 'Violet' },
  { value: '#0891b2', label: 'Cyan' },
  { value: '#059669', label: 'Green' },
  { value: '#dc2626', label: 'Red' },
  { value: '#d97706', label: 'Amber' },
  { value: '#db2777', label: 'Pink' },
]

const COURSES_LIST = [
  { name: 'Big Data Analytics', code: 'IS401', color: '#7c3aed' },
  { name: 'Database Systems', code: 'IS312', color: '#0891b2' },
  { name: 'Applied Statistics', code: 'MATH301', color: '#059669' },
  { name: 'Cybersecurity Fundamentals', code: 'IS320', color: '#dc2626' },
]

// ── Mock schedule ─────────────────────────────────────────────────────────────
const INITIAL_CLASSES: ClassEntry[] = [
  { id: 1, course: 'Big Data Analytics', code: 'IS401', room: 'C204', instructor: 'Dr. Al Mansoori', color: '#7c3aed', days: [0, 2], startTime: '09:00', endTime: '10:30' },
  { id: 2, course: 'Database Systems', code: 'IS312', room: 'B105', instructor: 'Dr. Hassan', color: '#0891b2', days: [1, 3], startTime: '11:00', endTime: '12:30' },
  { id: 3, course: 'Applied Statistics', code: 'MATH301', room: 'A210', instructor: 'Dr. Fatima Al Zaabi', color: '#059669', days: [0, 2, 4], startTime: '08:00', endTime: '09:00' },
  { id: 4, course: 'Cybersecurity Fundamentals', code: 'IS320', room: 'D301', instructor: 'Dr. Ahmed Khalil', color: '#dc2626', days: [1, 4], startTime: '13:00', endTime: '14:30' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}

function isNowInSlot(start: string, end: string) {
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  return nowMin >= timeToMinutes(start) && nowMin < timeToMinutes(end)
}

const SLOT_HEIGHT = 56 // px per 60 min
const GRID_START = 7 * 60 // 07:00 in minutes

function topOffset(startTime: string) {
  return ((timeToMinutes(startTime) - GRID_START) / 60) * SLOT_HEIGHT
}

function blockHeight(startTime: string, endTime: string) {
  return ((timeToMinutes(endTime) - timeToMinutes(startTime)) / 60) * SLOT_HEIGHT
}

// ── Add Class Modal ───────────────────────────────────────────────────────────
function AddClassModal({ isOpen, onClose, onAdd }: {
  isOpen: boolean; onClose: () => void; onAdd: (c: ClassEntry) => void
}) {
  const [courseIdx, setCourseIdx] = useState(0)
  const [room, setRoom] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:30')
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [color, setColor] = useState(COURSES_LIST[0].color)

  // sync color when course changes
  function handleCourseChange(idx: number) {
    setCourseIdx(idx)
    setColor(COURSES_LIST[idx].color)
  }

  function toggleDay(d: number) {
    setSelectedDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  // duration label
  const durationMins = timeToMinutes(endTime) - timeToMinutes(startTime)
  const durationLabel = durationMins > 0
    ? `${Math.floor(durationMins / 60)}h ${durationMins % 60 > 0 ? `${durationMins % 60}m` : ''}`.trim()
    : 'Invalid'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDays.length || durationMins <= 0) return
    const c = COURSES_LIST[courseIdx]
    onAdd({
      id: Date.now(), course: c.name, code: c.code,
      room: room.trim() || 'TBD', instructor: '', color,
      days: selectedDays, startTime, endTime,
    })
    setRoom(''); setStartTime('09:00'); setEndTime('10:30'); setSelectedDays([])
    onClose()
  }

  const field = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Class">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Course */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Course</label>
          <select className={field} value={courseIdx}
            onChange={e => handleCourseChange(Number(e.target.value))}>
            {COURSES_LIST.map((c, i) => <option key={c.code} value={i}>{c.name}</option>)}
          </select>
        </div>

        {/* Days (multi-select) */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Days *</label>
          <div className="flex gap-2">
            {DAYS.map((d, i) => (
              <button key={d} type="button" onClick={() => toggleDay(i)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                  selectedDays.includes(i)
                    ? 'text-white border-transparent'
                    : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-violet-400'
                }`}
                style={selectedDays.includes(i) ? { backgroundColor: color, borderColor: color } : {}}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Times */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Start Time</label>
            <input type="time" className={field} value={startTime}
              onChange={e => setStartTime(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              End Time <span className="text-gray-400 font-normal">({durationLabel})</span>
            </label>
            <input type="time" className={field} value={endTime}
              onChange={e => setEndTime(e.target.value)} />
          </div>
        </div>

        {/* Room */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Room</label>
          <input className={field} placeholder="e.g. C204" value={room}
            onChange={e => setRoom(e.target.value)} />
        </div>

        {/* Color */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Color</label>
          <div className="flex gap-2">
            {COLOR_OPTIONS.map(c => (
              <button key={c.value} type="button" onClick={() => setColor(c.value)}
                className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: c.value,
                  borderColor: 'transparent',
                  boxShadow: color === c.value ? `0 0 0 2px white, 0 0 0 4px ${c.value}` : 'none',
                }} />
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" className="flex-1"
            disabled={!selectedDays.length || durationMins <= 0}>
            Add Class
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ── Timetable Grid ────────────────────────────────────────────────────────────
function Timetable({ classes }: { classes: ClassEntry[] }) {
  const todayIdx = new Date().getDay() // 0=Sun
  const totalHeight = TIME_SLOTS.length * SLOT_HEIGHT

  // current time indicator position
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes()
  const nowTop = ((nowMin - GRID_START) / 60) * SLOT_HEIGHT
  const showNow = nowMin >= GRID_START && nowMin <= GRID_START + TIME_SLOTS.length * 60

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5">
      <div className="min-w-[640px]">
        {/* Day headers */}
        <div className="grid border-b border-gray-200 dark:border-white/10"
          style={{ gridTemplateColumns: '64px repeat(5, 1fr)' }}>
          <div className="p-3" />
          {DAYS.map((d, i) => (
            <div key={d} className={`p-3 text-center border-l border-gray-100 dark:border-white/5 ${
              i === todayIdx ? 'bg-violet-50 dark:bg-violet-900/20' : ''
            }`}>
              <p className={`text-xs font-semibold uppercase tracking-wider ${
                i === todayIdx ? 'text-violet-600 dark:text-violet-400' : 'text-gray-500 dark:text-gray-400'
              }`}>{d}</p>
              {i === todayIdx && (
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mx-auto mt-1" />
              )}
            </div>
          ))}
        </div>

        {/* Grid body */}
        <div className="relative grid" style={{ gridTemplateColumns: '64px repeat(5, 1fr)', height: totalHeight }}>
          {/* Time labels */}
          <div className="relative">
            {TIME_SLOTS.map((t, i) => (
              <div key={t} className="absolute w-full flex items-start justify-end pr-2"
                style={{ top: i * SLOT_HEIGHT, height: SLOT_HEIGHT }}>
                <span className="text-xs text-gray-400 dark:text-gray-600 mt-[-8px]">{formatTime(t)}</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DAYS.map((_, dayIdx) => (
            <div key={dayIdx}
              className={`relative border-l border-gray-100 dark:border-white/5 ${
                dayIdx === todayIdx ? 'bg-violet-50/50 dark:bg-violet-900/10' : ''
              }`}>
              {/* Hour lines */}
              {TIME_SLOTS.map((_, i) => (
                <div key={i} className="absolute w-full border-t border-gray-100 dark:border-white/5"
                  style={{ top: i * SLOT_HEIGHT }} />
              ))}

              {/* Current time line */}
              {showNow && dayIdx === todayIdx && (
                <div className="absolute w-full flex items-center z-20" style={{ top: nowTop }}>
                  <div className="w-2 h-2 rounded-full bg-violet-500 -ml-1 flex-shrink-0" />
                  <div className="flex-1 h-px bg-violet-500" />
                </div>
              )}

              {/* Class blocks */}
              {classes
                .filter(c => c.days.includes(dayIdx))
                .map(c => {
                  const top = topOffset(c.startTime)
                  const height = blockHeight(c.startTime, c.endTime)
                  const live = isNowInSlot(c.startTime, c.endTime) && dayIdx === todayIdx
                  return (
                    <div key={c.id}
                      className="absolute left-1 right-1 rounded-xl px-2 py-1.5 overflow-hidden cursor-pointer hover:brightness-110 transition-all z-10"
                      style={{ top, height, backgroundColor: `${c.color}20`, borderLeft: `3px solid ${c.color}` }}>
                      <p className="text-xs font-semibold truncate" style={{ color: c.color }}>{c.course}</p>
                      {height > 48 && (
                        <>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5" /> {c.room}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> {formatTime(c.startTime)}–{formatTime(c.endTime)}
                          </p>
                        </>
                      )}
                      {live && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      )}
                    </div>
                  )
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Today's Classes List ──────────────────────────────────────────────────────
function TodayList({ classes }: { classes: ClassEntry[] }) {
  const todayIdx = new Date().getDay()
  const todayClasses = classes
    .filter(c => c.days.includes(todayIdx))
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))

  if (todayClasses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
        No classes today 🎉
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {todayClasses.map(c => {
        const live = isNowInSlot(c.startTime, c.endTime)
        return (
          <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5">
            <div className="w-1 self-stretch rounded-full" style={{ backgroundColor: c.color }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.course}</p>
                {live && <span className="text-xs font-semibold text-red-500 animate-pulse">● LIVE</span>}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatTime(c.startTime)} – {formatTime(c.endTime)} · {c.room}
              </p>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {minutesToTime(timeToMinutes(c.endTime) - timeToMinutes(c.startTime)).replace(':', 'h ')}m
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const [classes, setClasses] = useState<ClassEntry[]>(INITIAL_CLASSES)
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'week' | 'today'>('week')

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(t)
  }, [])

  const todayName = DAY_FULL[new Date().getDay()]

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <SkeletonLoader className="h-16 w-72 rounded-2xl" />
        <SkeletonLoader className="h-10 w-48 rounded-full" />
        <SkeletonLoader className="h-[480px] rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-playfair text-3xl font-bold text-gray-900 dark:text-white">Schedule</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            {todayName} · {classes.length} classes this week
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 flex-shrink-0">
          <Plus className="w-4 h-4" /> Add Class
        </Button>
      </div>

      {/* View toggle */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl w-fit">
        {(['week', 'today'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-5 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 capitalize ${
              view === v
                ? 'bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            {v === 'today' ? `Today (${todayName})` : 'Week View'}
          </button>
        ))}
      </div>

      {/* Content */}
      {view === 'week' ? (
        <Timetable classes={classes} />
      ) : (
        <div className="max-w-xl">
          <TodayList classes={classes} />
        </div>
      )}

      <AddClassModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={c => setClasses(prev => [...prev, c])}
      />
    </div>
  )
}
