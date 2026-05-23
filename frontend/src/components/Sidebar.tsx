import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, CheckSquare, Target,
  FileText, Trophy, Bot, ChevronRight
} from 'lucide-react'

const nav = [
  { to: '/', label: 'ダッシュボード', icon: LayoutDashboard },
  { to: '/timeline', label: 'タイムライン', icon: Calendar },
  { to: '/tasks', label: 'デイリータスク', icon: CheckSquare },
  { to: '/goals', label: '月別目標', icon: Target },
  { to: '/essays', label: 'エッセイ管理', icon: FileText },
  { to: '/achievements', label: '実績・活動', icon: Trophy },
  { to: '/tutor', label: 'AIチューター', icon: Bot },
]

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="px-6 py-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center text-lg font-bold">M</div>
          <div>
            <p className="font-bold text-sm leading-tight">Minerva Tutor</p>
            <p className="text-slate-400 text-xs">受験サポートAI</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>
      <div className="px-6 py-4 border-t border-slate-700">
        <p className="text-slate-500 text-xs">Minerva University 2026</p>
        <p className="text-slate-400 text-xs">Fall Admission</p>
      </div>
    </aside>
  )
}
