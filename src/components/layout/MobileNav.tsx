import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  ClipboardList,
  MessageSquare,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useLang } from '../../contexts/LanguageContext'

const tabs = [
  { to: '/', icon: LayoutDashboard, key: 'dashboard' as const },
  { to: '/schedule', icon: Calendar, key: 'schedule' as const },
  { to: '/courses', icon: BookOpen, key: 'courses' as const },
  { to: '/assignments', icon: ClipboardList, key: 'assignments' as const },
  { to: '/ai-tutor', icon: MessageSquare, key: 'aiTutor' as const },
]

export default function MobileNav() {
  const { t } = useLang()

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-white/10">
      <div className="flex items-center justify-around py-2">
        {tabs.map(({ to, icon: Icon, key }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200',
                isActive
                  ? 'text-violet-600 dark:text-violet-400'
                  : 'text-gray-500 dark:text-gray-500'
              )
            }
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{t(key)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
