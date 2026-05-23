import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTasks,
  getGoals,
  getMilestones,
  getEssays,
  getAchievements,
  updateTask,
  generateTasks,
} from '../api/client'
import type { Task, Milestone, Goal } from '../api/client'
import {
  Sparkles,
  CheckCircle2,
  Circle,
  CalendarDays,
  BookOpen,
  Trophy,
  TrendingUp,
} from 'lucide-react'

const today = new Date().toISOString().split('T')[0]

// ── helpers ────────────────────────────────────────────────────────────────

function todayJP(): string {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

/** Progress 0–100 from 2026-05-01 to the target date, relative to today */
function preparationProgress(targetDateStr: string): number {
  const start = new Date('2026-05-01').getTime()
  const end = new Date(targetDateStr).getTime()
  const now = Date.now()
  if (end <= start) return 100
  const raw = ((now - start) / (end - start)) * 100
  return Math.min(100, Math.max(0, raw))
}

// ── category colors ────────────────────────────────────────────────────────

type MilestoneCategory = Milestone['category']

const categoryBg: Record<MilestoneCategory, string> = {
  application: 'bg-blue-100 text-blue-700',
  document: 'bg-orange-100 text-orange-700',
  essay: 'bg-purple-100 text-purple-700',
  test: 'bg-emerald-100 text-emerald-700',
  interview: 'bg-amber-100 text-amber-700',
  other: 'bg-slate-100 text-slate-600',
}

const categoryBgDark: Record<MilestoneCategory, string> = {
  application: 'bg-blue-900/40 text-blue-200',
  document: 'bg-orange-900/40 text-orange-200',
  essay: 'bg-purple-900/40 text-purple-200',
  test: 'bg-emerald-900/40 text-emerald-200',
  interview: 'bg-amber-900/40 text-amber-200',
  other: 'bg-white/10 text-white/60',
}

const categoryLabel: Record<MilestoneCategory, string> = {
  application: '出願',
  document: '書類',
  essay: 'エッセイ',
  test: 'テスト',
  interview: '面接',
  other: 'その他',
}

// ── status colors ──────────────────────────────────────────────────────────

type MilestoneStatus = Milestone['status']

const statusBg: Record<MilestoneStatus, string> = {
  upcoming: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-emerald-100 text-emerald-700',
  missed: 'bg-red-100 text-red-600',
}

const statusLabel: Record<MilestoneStatus, string> = {
  upcoming: '予定',
  in_progress: '進行中',
  done: '完了',
  missed: '未達成',
}

// ── priority colors ────────────────────────────────────────────────────────

type TaskPriority = Task['priority']

const priorityBg: Record<TaskPriority, string> = {
  high: 'bg-red-100 text-red-600',
  medium: 'bg-amber-100 text-amber-600',
  low: 'bg-emerald-100 text-emerald-600',
}

const priorityLabel: Record<TaskPriority, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

// ── goal status ────────────────────────────────────────────────────────────

type GoalStatus = Goal['status']

const goalStatusBg: Record<GoalStatus, string> = {
  not_started: 'bg-slate-100 text-slate-500',
  in_progress: 'bg-amber-100 text-amber-700',
  done: 'bg-emerald-100 text-emerald-700',
}

const goalStatusLabel: Record<GoalStatus, string> = {
  not_started: '未着手',
  in_progress: '進行中',
  done: '完了',
}

// ── circular progress ring ─────────────────────────────────────────────────

function CircularProgress({ value }: { value: number }) {
  const radius = 36
  const stroke = 5
  const normalizedRadius = radius - stroke / 2
  const circumference = 2 * Math.PI * normalizedRadius
  const offset = circumference - (value / 100) * circumference

  return (
    <svg
      width={radius * 2}
      height={radius * 2}
      style={{ transform: 'rotate(-90deg)' }}
      aria-label={`${Math.round(value)}% 準備完了`}
    >
      {/* background track */}
      <circle
        cx={radius}
        cy={radius}
        r={normalizedRadius}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={stroke}
      />
      {/* foreground value */}
      <circle
        cx={radius}
        cy={radius}
        r={normalizedRadius}
        fill="none"
        stroke="#fbbf24"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  )
}

// ── hero card ──────────────────────────────────────────────────────────────

function HeroCard({ milestone }: { milestone: Milestone }) {
  const days = daysUntil(milestone.date)
  const progress = preparationProgress(milestone.date)

  return (
    <div className="relative bg-rose-950 rounded-2xl p-8 overflow-hidden animate-fade-in">
      {/* Decorative circle */}
      <div
        className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full"
        style={{ background: 'rgba(159,18,57,0.25)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-12 w-48 h-48 rounded-full"
        style={{ background: 'rgba(159,18,57,0.15)' }}
      />

      {/* Top row: category + status */}
      <div className="relative flex items-center gap-2 mb-6">
        <span className={`badge ${categoryBgDark[milestone.category]}`}>
          {categoryLabel[milestone.category]}
        </span>
        <span className="badge bg-white/10 text-white/60">
          {statusLabel[milestone.status]}
        </span>
      </div>

      {/* Main content row */}
      <div className="relative flex items-center gap-8">
        {/* Countdown number */}
        <div className="flex-shrink-0 text-center min-w-[80px]">
          {days < 0 ? (
            <>
              <span className="block text-6xl font-black text-white leading-none">
                {Math.abs(days)}
              </span>
              <span className="block mt-1 text-[10px] font-semibold tracking-widest text-white/40 uppercase">
                DAYS AGO
              </span>
            </>
          ) : days === 0 ? (
            <>
              <span className="block text-4xl font-black text-amber-400 leading-none">
                今日
              </span>
              <span className="block mt-1 text-[10px] font-semibold tracking-widest text-white/40 uppercase">
                TODAY
              </span>
            </>
          ) : (
            <>
              <span className="block text-6xl font-black text-white leading-none">
                {days}
              </span>
              <span className="block mt-1 text-[10px] font-semibold tracking-widest text-white/40 uppercase">
                DAYS LEFT
              </span>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="flex-shrink-0 w-px h-16 bg-white/10" />

        {/* Milestone title */}
        <div className="flex-1 min-w-0">
          <p className="section-label text-white/40 mb-2">次のマイルストーン</p>
          <h2 className="text-xl font-bold text-white leading-snug">
            {milestone.title}
          </h2>
          {milestone.description && (
            <p className="mt-1.5 text-sm text-white/50 line-clamp-2">
              {milestone.description}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-3 text-white/40 text-xs">
            <CalendarDays size={13} />
            <span>
              {(() => {
                const d = new Date(milestone.date)
                return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
              })()}
            </span>
          </div>
        </div>

        {/* Circular progress ring */}
        <div className="flex-shrink-0 flex flex-col items-center gap-2">
          <div className="relative">
            <CircularProgress value={progress} />
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-amber-400">
              {Math.round(progress)}%
            </span>
          </div>
          <span className="text-[10px] font-semibold tracking-widest text-white/40 uppercase">
            PREP
          </span>
        </div>
      </div>

      {/* Bottom amber progress bar */}
      <div className="relative mt-8 h-1 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400"
          style={{
            width: `${progress}%`,
            transition: 'width 0.8s ease',
          }}
        />
      </div>
    </div>
  )
}

// ── stats card ─────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode
  iconBg: string
  value: string | number
  label: string
  sub?: string
}

function StatCard({ icon, iconBg, value, label, sub }: StatCardProps) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-slate-800 leading-none">{value}</div>
        <div className="section-label mt-1">{label}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

// ── task row ───────────────────────────────────────────────────────────────

function TaskRow({ task }: { task: Task }) {
  const qc = useQueryClient()

  const toggle = useMutation({
    mutationFn: () =>
      updateTask(task.id, {
        status: task.status === 'done' ? 'pending' : 'done',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', today] })
    },
  })

  const done = task.status === 'done'

  return (
    <div
      className={`flex items-start gap-3 py-3.5 border-b border-stone-50 last:border-0 transition-opacity ${
        done ? 'opacity-50' : ''
      }`}
    >
      <button
        onClick={() => toggle.mutate()}
        disabled={toggle.isPending}
        className={`mt-0.5 flex-shrink-0 transition-colors ${
          done
            ? 'text-emerald-500'
            : 'text-slate-300 hover:text-brand-800'
        }`}
        aria-label={done ? '未完了にする' : '完了にする'}
      >
        {done ? <CheckCircle2 size={19} /> : <Circle size={19} />}
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium leading-snug ${
            done ? 'line-through text-slate-400' : 'text-slate-800'
          }`}
        >
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">{task.description}</p>
        )}
      </div>
      <span className={`badge flex-shrink-0 text-[11px] ${priorityBg[task.priority]}`}>
        {priorityLabel[task.priority]}
      </span>
    </div>
  )
}

// ── goal progress row ──────────────────────────────────────────────────────

function GoalProgressRow({ goal }: { goal: Goal }) {
  const progressColor =
    goal.status === 'done'
      ? 'bg-emerald-500'
      : goal.progress >= 60
      ? 'bg-amber-400'
      : 'bg-brand-800'

  return (
    <div className="py-3.5 border-b border-stone-50 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-slate-800 truncate pr-2 leading-snug">
          {goal.title}
        </p>
        <span className={`badge flex-shrink-0 text-[11px] ${goalStatusBg[goal.status]}`}>
          {goalStatusLabel[goal.status]}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="flex-1 bg-stone-100 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-1.5 rounded-full transition-all duration-700 ${progressColor}`}
            style={{ width: `${Math.min(100, Math.max(0, goal.progress))}%` }}
          />
        </div>
        <span className="text-xs text-slate-400 w-9 text-right tabular-nums">
          {goal.progress}%
        </span>
      </div>
    </div>
  )
}

// ── mini milestone card ────────────────────────────────────────────────────

function MiniMilestoneCard({ milestone }: { milestone: Milestone }) {
  const days = daysUntil(milestone.date)

  return (
    <div className="card hover:shadow-card-hover transition-shadow duration-200">
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className={`badge text-[11px] ${categoryBg[milestone.category]}`}>
          {categoryLabel[milestone.category]}
        </span>
        <span className={`badge text-[11px] ${statusBg[milestone.status]}`}>
          {statusLabel[milestone.status]}
        </span>
      </div>
      <p className="text-sm font-semibold text-slate-800 leading-snug mb-3">
        {milestone.title}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <CalendarDays size={12} />
          <span>
            {(() => {
              const d = new Date(milestone.date)
              return `${d.getMonth() + 1}/${d.getDate()}`
            })()}
          </span>
        </div>
        {days < 0 ? (
          <span className="text-xs font-semibold text-slate-400">
            {Math.abs(days)}日前
          </span>
        ) : days === 0 ? (
          <span className="text-xs font-bold text-red-500">今日!</span>
        ) : (
          <span className="text-xs font-bold text-brand-800">あと{days}日</span>
        )}
      </div>
    </div>
  )
}

// ── main page ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const qc = useQueryClient()
  const now = new Date()

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones'],
    queryFn: getMilestones,
  })

  const { data: todayTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', today],
    queryFn: () => getTasks(today),
  })

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', now.getMonth() + 1, now.getFullYear()],
    queryFn: () => getGoals(now.getMonth() + 1, now.getFullYear()),
  })

  const { data: essays = [] } = useQuery({
    queryKey: ['essays'],
    queryFn: getEssays,
  })

  const { data: achievements = [] } = useQuery({
    queryKey: ['achievements'],
    queryFn: getAchievements,
  })

  const generateMutation = useMutation({
    mutationFn: generateTasks,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', today] })
    },
  })

  // Hero milestone: next upcoming (status !== done, date >= today)
  const upcomingAll = milestones
    .filter((m) => m.status !== 'done' && m.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))

  const heroMilestone = upcomingAll[0] ?? null

  // Mini cards: next 3 after hero
  const miniMilestones = upcomingAll.slice(1, 4)

  // Stats
  const milestonesDone = milestones.filter((m) => m.status === 'done').length
  const tasksCompletedToday = todayTasks.filter((t) => t.status === 'done').length
  const essaysActive = essays.filter(
    (e) => e.status === 'drafting' || e.status === 'revising'
  ).length
  const achievementsCount = achievements.length

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">

      {/* ── Page header ───────────────────────────────────────────── */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="section-label mb-2">OVERVIEW</p>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">{todayJP()}</p>
        </div>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="btn-primary mt-1 flex-shrink-0"
        >
          <Sparkles size={15} />
          {generateMutation.isPending ? 'AIが生成中…' : 'AIタスク生成'}
        </button>
      </header>

      {/* ── Hero card ─────────────────────────────────────────────── */}
      {heroMilestone ? (
        <HeroCard milestone={heroMilestone} />
      ) : (
        <div className="bg-rose-950 rounded-2xl p-8 text-center text-white/40 text-sm">
          予定中のマイルストーンはありません
        </div>
      )}

      {/* ── Stats row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<TrendingUp size={18} className="text-emerald-600" />}
          iconBg="bg-emerald-50"
          value={milestonesDone}
          label="完了マイルストーン"
        />
        <StatCard
          icon={<CheckCircle2 size={18} className="text-brand-800" />}
          iconBg="bg-rose-50"
          value={`${tasksCompletedToday} / ${todayTasks.length}`}
          label="今日のタスク"
          sub={todayTasks.length > 0 ? `${Math.round((tasksCompletedToday / todayTasks.length) * 100)}% 完了` : undefined}
        />
        <StatCard
          icon={<BookOpen size={18} className="text-purple-600" />}
          iconBg="bg-purple-50"
          value={essaysActive}
          label="執筆中エッセイ"
        />
        <StatCard
          icon={<Trophy size={18} className="text-amber-500" />}
          iconBg="bg-amber-50"
          value={achievementsCount}
          label="実績数"
        />
      </div>

      {/* ── Two-column: tasks + goals ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Today's tasks */}
        <div className="card flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="section-label mb-1">DAILY</p>
              <h2 className="text-base font-bold text-slate-800">今日のタスク</h2>
            </div>
            {todayTasks.length > 0 && (
              <span className="text-xs text-slate-400 tabular-nums">
                {tasksCompletedToday}/{todayTasks.length} 完了
              </span>
            )}
          </div>

          {/* Mini progress bar */}
          {todayTasks.length > 0 && (
            <div className="bg-stone-100 rounded-full h-1 mb-5 overflow-hidden">
              <div
                className="h-1 rounded-full bg-brand-800 transition-all duration-500"
                style={{
                  width: `${(tasksCompletedToday / todayTasks.length) * 100}%`,
                }}
              />
            </div>
          )}

          {tasksLoading ? (
            <p className="text-sm text-slate-400 py-8 text-center">読み込み中…</p>
          ) : todayTasks.length === 0 ? (
            <div className="py-8 text-center flex-1 flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mb-3">
                <CheckCircle2 size={18} className="text-slate-300" />
              </div>
              <p className="text-sm text-slate-400">今日のタスクはありません</p>
              <p className="text-xs text-slate-300 mt-1">「AIタスク生成」で自動作成できます</p>
            </div>
          ) : (
            <div className="flex-1">
              {todayTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>

        {/* Monthly goals */}
        <div className="card flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="section-label mb-1">MONTHLY</p>
              <h2 className="text-base font-bold text-slate-800">
                {now.getMonth() + 1}月の目標
              </h2>
            </div>
            <span className="text-xs text-slate-400">{goals.length}件</span>
          </div>

          {goals.length === 0 ? (
            <div className="py-8 text-center flex-1 flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mb-3">
                <TrendingUp size={18} className="text-slate-300" />
              </div>
              <p className="text-sm text-slate-400">今月の目標はありません</p>
            </div>
          ) : (
            <div className="flex-1">
              {goals.map((goal) => (
                <GoalProgressRow key={goal.id} goal={goal} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Upcoming milestones (mini cards) ──────────────────────── */}
      {miniMilestones.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="section-label">UPCOMING MILESTONES</p>
            <span className="text-xs text-slate-400">{miniMilestones.length}件</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {miniMilestones.map((m) => (
              <MiniMilestoneCard key={m.id} milestone={m} />
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
