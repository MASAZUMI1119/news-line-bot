import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Timeline from './pages/Timeline'
import Tasks from './pages/Tasks'
import Goals from './pages/Goals'
import Essays from './pages/Essays'
import EssayEditor from './pages/EssayEditor'
import Achievements from './pages/Achievements'
import AiTutor from './pages/AiTutor'
import NotionTasks from './pages/NotionTasks'
import AiCoach from './pages/AiCoach'

export default function App() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/essays" element={<Essays />} />
          <Route path="/essays/:id" element={<EssayEditor />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/tutor" element={<AiTutor />} />
          <Route path="/notion-tasks" element={<NotionTasks />} />
          <Route path="/ai-coach" element={<AiCoach />} />
        </Routes>
      </main>
    </div>
  )
}
