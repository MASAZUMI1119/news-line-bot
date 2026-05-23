import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, CheckSquare, Target,
  FileText, Trophy, Bot,
} from 'lucide-react'

const nav = [
  { to: '/',             label: 'DASHBOARD',     sub: 'ダッシュボード',   icon: LayoutDashboard },
  { to: '/timeline',     label: 'TIMELINE',      sub: 'タイムライン',     icon: CalendarDays },
  { to: '/tasks',        label: 'DAILY TASKS',   sub: 'デイリータスク',   icon: CheckSquare },
  { to: '/goals',        label: 'GOALS',         sub: '月別目標',         icon: Target },
  { to: '/essays',       label: 'ESSAYS',        sub: 'エッセイ管理',     icon: FileText },
  { to: '/achievements', label: 'ACHIEVEMENTS',  sub: '実績・活動',       icon: Trophy },
  { to: '/tutor',        label: 'AI TUTOR',      sub: 'AIチューター',     icon: Bot },
]

export default function Sidebar() {
  return (
    <aside
      className="w-64 min-h-screen flex flex-col flex-shrink-0"
      style={{ background: 'linear-gradient(180deg, #3b0f1e 0%, #4c0519 100%)' }}
    >
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#fbbf24' }}>
            <span className="text-xs font-black tracking-tight" style={{ color: '#4c0519' }}>M</span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-bold tracking-widest leading-tight">MINERVA TUTOR</p>
            <p className="text-white/30 text-xs font-light mt-0.5">Class of 2031</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-white/20 text-xs font-semibold tracking-widest uppercase px-3 mb-3">MENU</p>
        {nav.map(({ to, label, sub, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive ? 'bg-white/10' : 'hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                  isActive ? 'bg-amber-400' : 'bg-white/5 group-hover:bg-white/10'
                }`}>
                  <Icon
                    size={14}
                    className={isActive ? 'text-rose-950' : 'text-white/40 group-hover:text-white/70'}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold tracking-wider leading-tight ${
                    isActive ? 'text-white' : 'text-white/40 group-hover:text-white/70'
                  }`}>
                    {label}
                  </p>
                  <p className={`text-xs font-light mt-0.5 ${
                    isActive ? 'text-white/60' : 'text-white/20 group-hover:text-white/40'
                  }`}>
                    {sub}
                  </p>
                </div>
                {isActive && (
                  <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: '#fbbf24' }} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <span className="text-white/25 text-xs">AI Connected</span>
        </div>
        <p className="text-white/15 text-xs">Minerva University · 2027</p>
      </div>
    </aside>
  )
}
