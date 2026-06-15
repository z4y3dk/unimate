import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  FileText,
  ClipboardList,
  MessageSquare,
  GraduationCap,
  Settings,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useTheme } from '../../contexts/ThemeContext'
import { useLang } from '../../contexts/LanguageContext'

const navItems = [
  { to: '/', icon: LayoutDashboard, key: 'dashboard' as const },
  { to: '/schedule', icon: Calendar, key: 'schedule' as const },
  { to: '/courses', icon: BookOpen, key: 'courses' as const },
  { to: '/notes', icon: FileText, key: 'notes' as const },
  { to: '/assignments', icon: ClipboardList, key: 'assignments' as const },
  { to: '/ai-tutor', icon: MessageSquare, key: 'aiTutor' as const },
  { to: '/planner', icon: GraduationCap, key: 'planner' as const },
]

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme()
  const { lang, setLang, t } = useLang()

  return (
    <aside className="hidden md:flex fixed top-0 ltr:left-0 rtl:right-0 h-screen w-60 flex-col bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-r border-gray-200 dark:border-white/10 z-40">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-6">
        <Sparkles size={22} className="text-violet-500" />
        <span className="font-playfair text-xl font-bold bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">
          UniMate
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ to, icon: Icon, key }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
              )
            }
          >
            <Icon size={18} />
            {t(key)}
          </NavLink>
        ))}
      </nav>

      {/* Bottom controls */}
      <div className="px-3 py-4 border-t border-gray-200 dark:border-white/10 space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
            )
          }
        >
          <Settings size={18} />
          {t('settings')}
        </NavLink>

        <div className="flex items-center justify-between px-3 py-2">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === 'dark' ? t('lightMode') : t('darkMode')}</span>
          </button>
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="text-xs font-medium px-2 py-1 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
          >
            {lang === 'en' ? 'عربي' : 'EN'}
          </button>
        </div>
      </div>
    </aside>
  )
}
