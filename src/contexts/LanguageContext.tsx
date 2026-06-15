import { createContext, useContext, useEffect, useState } from 'react'
import { translations }
import type { TranslationKey } from '../utils/translations'

type Lang = 'en' | 'ar'

interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem('lang') as Lang) ?? 'en'
  )

  useEffect(() => {
    const root = document.documentElement
    root.dir = lang === 'ar' ? 'rtl' : 'ltr'
    root.lang = lang
    localStorage.setItem('lang', lang)
  }, [lang])

  const setLang = (l: Lang) => setLangState(l)
  const t = (key: TranslationKey): string => translations[lang][key] ?? key

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used within LanguageProvider')
  return ctx
}
