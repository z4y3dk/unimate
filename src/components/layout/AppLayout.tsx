import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { WifiOff } from 'lucide-react'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import { useLang } from '../../contexts/LanguageContext'

export default function AppLayout() {
  const { lang } = useLang()
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const on = () => setIsOffline(false)
    const off = () => setIsOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50 dark:bg-[#0f0f1a]">
      {isOffline && (
        <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-amber-500 text-white text-sm py-1.5 px-4">
          <WifiOff className="w-4 h-4" />
          You're offline — showing cached data
        </div>
      )}
      <Sidebar />
      <main className={`ltr:md:ml-60 rtl:md:mr-60 pb-16 md:pb-0 min-h-screen${isOffline ? ' pt-8' : ''}`}>
        <Outlet />
      </main>
      <MobileNav />
    </div>
  )
}
