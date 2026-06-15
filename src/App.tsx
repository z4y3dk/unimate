import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider } from './contexts/LanguageContext'
import AppLayout from './components/layout/AppLayout'
import DashboardPage from './pages/DashboardPage'
import SchedulePage from './pages/SchedulePage'
import CoursesPage from './pages/CoursesPage'
import NotesPage from './pages/NotesPage'
import AssignmentsPage from './pages/AssignmentsPage'
import AITutorPage from './pages/AITutorPage'
import PlannerPage from './pages/PlannerPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/assignments" element={<AssignmentsPage />} />
              <Route path="/ai-tutor" element={<AITutorPage />} />
              <Route path="/planner" element={<PlannerPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  )
}
