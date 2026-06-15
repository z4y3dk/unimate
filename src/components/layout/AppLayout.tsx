import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import { useLang } from '../../contexts/LanguageContext'

export default function AppLayout() {
  const { lang } = useLang()

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50 dark:bg-[#0f0f1a]">
      <Sidebar />
      <main className="ltr:md:ml-60 rtl:md:mr-60 pb-16 md:pb-0 min-h-screen">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  )
}
