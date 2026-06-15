import { useEffect, useState } from 'react'
import { Moon, Sun, Check, User, Bell, LogOut } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import SkeletonLoader from '../components/ui/SkeletonLoader'
import { useTheme } from '../hooks/useTheme'
import { useLang } from '../hooks/useLang'

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium shadow-xl animate-fade-in">
      {message}
    </div>
  )
}

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-violet-600' : 'bg-gray-300 dark:bg-white/20'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : ''}`} />
    </button>
  )
}

// ── Section Wrapper ───────────────────────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
          {icon}
        </div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">{title}</h2>
      </div>
      <Card className="divide-y divide-gray-100 dark:divide-white/5">
        {children}
      </Card>
    </div>
  )
}

function SettingRow({ label, description, action }: { label: string; description?: string; action: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-4 gap-4">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{action}</div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const { theme, setTheme } = useTheme()
  const { lang, setLang } = useLang()

  // Notification toggles (local state)
  const [deadlineReminders, setDeadlineReminders] = useState(true)
  const [dayBeforeReminders, setDayBeforeReminders] = useState(true)
  const [weeklySummary, setWeeklySummary] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  function showToast(msg: string) {
    setToast(msg)
  }

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <SkeletonLoader className="h-10 w-48 rounded-xl" />
        {[1, 2, 3, 4].map(i => <SkeletonLoader key={i} className="h-40 rounded-2xl" />)}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-playfair text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage your preferences and account</p>
      </div>

      {/* Profile */}
      <Section title="Profile" icon={<User className="w-4 h-4" />}>
        <div className="p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            Z
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white">Zayed</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">HCT · Data Science · 3rd Year</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => showToast('Coming soon')}>
            Edit Profile
          </Button>
        </div>
      </Section>

      {/* Appearance */}
      <Section title="Appearance" icon={<Sun className="w-4 h-4" />}>
        <div className="p-4 space-y-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Theme</p>
          <div className="grid grid-cols-2 gap-3">
            {/* Dark Mode Card */}
            <button
              onClick={() => setTheme('dark')}
              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                theme === 'dark'
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                  : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
              }`}
            >
              {theme === 'dark' && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <Moon className="w-6 h-6 text-violet-500 mb-2" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Easy on the eyes</p>
            </button>

            {/* Light Mode Card */}
            <button
              onClick={() => setTheme('light')}
              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                theme === 'light'
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                  : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
              }`}
            >
              {theme === 'light' && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <Sun className="w-6 h-6 text-amber-500 mb-2" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">Light Mode</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Classic and bright</p>
            </button>
          </div>
        </div>
      </Section>

      {/* Language */}
      <Section title="Language" icon={<span className="text-sm font-bold">EN</span>}>
        <div className="p-4 space-y-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Select Language</p>
          <div className="grid grid-cols-2 gap-3">
            {/* English Card */}
            <button
              onClick={() => setLang('en')}
              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                lang === 'en'
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                  : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
              }`}
            >
              {lang === 'en' && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <p className="text-2xl mb-1">🇬🇧</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">English</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Left-to-right</p>
            </button>

            {/* Arabic Card */}
            <button
              onClick={() => setLang('ar')}
              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                lang === 'ar'
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                  : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
              }`}
            >
              {lang === 'ar' && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <p className="text-2xl mb-1">🇦🇪</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">عربي (Arabic)</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Right-to-left</p>
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Arabic mode applies RTL layout to the entire app
          </p>
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Notifications" icon={<Bell className="w-4 h-4" />}>
        <SettingRow
          label="Deadline Reminders"
          description="Get notified when an assignment is due"
          action={<Toggle value={deadlineReminders} onChange={setDeadlineReminders} />}
        />
        <SettingRow
          label="Day-before Reminders"
          description="Reminder the day before a deadline"
          action={<Toggle value={dayBeforeReminders} onChange={setDayBeforeReminders} />}
        />
        <SettingRow
          label="Weekly Summary"
          description="A weekly recap of your progress"
          action={<Toggle value={weeklySummary} onChange={setWeeklySummary} />}
        />
      </Section>

      {/* Account */}
      <Section title="Account" icon={<LogOut className="w-4 h-4" />}>
        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Sign Out</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">z4y3d.k@gmail.com</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => showToast('Signed out!')}>
            Sign Out
          </Button>
        </div>
        <div className="px-4 py-3">
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">UniMate v1.0.0 — Aurora</p>
        </div>
      </Section>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
