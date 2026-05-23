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
import { Sparkles, CheckCircle2, Circle } from 'lucide-react'

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

// ── category colors ────────────────────────────────────────────────────────

type MilestoneCategory = Milestone['category']

const categoryBg: Record<MilestoneCategory, string> = {
  application: 'bg-blue-100 text-blue-700',
  document: 'bg-orange-100 text-orange-700',
  essay: 'bg-purple-100 text-purple-700',
  test: 'bg-green-100 text-green-700',
  interview: 'bg-yellow-100 text-yellow-700',
  other: 'bg-slate-100 text-slate-700',
}

const categoryDot: Record<MilestoneCategory, string> = {
  application: 'bg-blue-500',
  document: 'bg-orange-500',
  essay: 'bg-purple-500',
  test: 'bg-green-500',
  interview: 'bg-yellow-500',
  other: 'bg-slate-400',
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
  done: 'bg-green-100 text-green-700',
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
  medium: 'bg-yellow-100 text-yellow-600',
  low: 'bg-green-100 text-green-600',
}

const priorityLabel: Record<TaskPriority, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

// ── goal status ────────────────────────────────────────────────────────────

type GoalStatus = Goal['status']

const goalStatusBg: Record<GoalStatus, string> = {
  not_started: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
}

const goalStatusLabel: Record<GoalStatus, string> = {
  not_started: '未着手',
  in_progress: '進行中',
  done: '完了',
}

// ── countdown card ─────────────────────────────────────────────────────────

function CountdownCard({ milestone }: { milestone: Milestone }) {
  const days = daysUntil(milestone.date)
  const d = new Date(milestone.date)
  const dateStr = `${d.getMonth() + 1}月${d.getDate()}日`

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <span className={`badge ${categoryBg[milestone.category]}`}>
          {categoryLabel[milestone.category]}
        </span>
        <span className={`badge ${statusBg[milestone.status]}`}>
          {statusLabel[milestone.status]}
        </span>
      </div>
      <p className="font-semibold text-slate-800 leading-snug">{milestone.title}</p>
      <div className="flex items-end justify-between mt-auto">
        <span className="text-sm text-slate-500">{dateStr}</span>
        <div className="text-right">
          {days < 0 ? (
            <span className="text-2xl font-bold text-slate-400">{Math.abs(days)}日前</span>
          ) : days === 0 ? (
            <span className="text-2xl font-bold text-red-500">今日!</span>
          ) : (
            <span className="text-2xl font-bold text-blue-600">{days}日後</span>
          )}
        </div>
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
      className={`flex items-start gap-3 py-3 border-b border-slate-50 last:border-0 ${done ? 'opacity-60' : ''}`}
    >
      <button
        onClick={() => toggle.mutate()}
        disabled={toggle.isPending}
        className="mt-0.5 flex-shrink-0 text-slate-400 hover:text-blue-600 transition-colors"
        aria-label={done ? '未完了にする' : '完了にする'}
      >
        {done ? (
          <CheckCircle2 size={20} className="text-green-500" />
        ) : (
          <Circle size={20} />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${done ? 'line-through text-slate-400' : 'text-slate-800'}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-slate-500 mt-0.5 truncate">{task.description}</p>
        )}
      </div>
      <span className={`badge flex-shrink-0 ${priorityBg[task.priority]}`}>
        {priorityLabel[task.priority]}
      </span>
    </div>
  )
}

// ── goal progress ──────────────────────────────────────────────────────────

function GoalProgressRow({ goal }: { goal: Goal }) {
  return (
    <div className="py-3 border-b border-slate-50 last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm font-medium text-slate-800 truncate pr-2">{goal.title}</p>
        <span className={`badge flex-shrink-0 ${goalStatusBg[goal.status]}`}>
          {goalStatusLabel[goal.status]}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, goal.progress))}%` }}
          />
        </div>
        <span className="text-xs text-slate-500 w-8 text-right">{goal.progress}%</span>
      </div>
    </div>
  )
}

// ── main page ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const qc = useQueryClient()

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones'],
    queryFn: getMilestones,
  })

  const { data: todayTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', today],
    queryFn: () => getTasks(today),
  })

  const now = new Date()
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

  // Upcoming milestones sorted by date, status !== 'done', take next 3
  const upcomingMilestones = milestones
    .filter((m) => m.status !== 'done')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3)

  // Quick stats
  const milestonesDone = milestones.filter((m) => m.status === 'done').length
  const tasksCompletedToday = todayTasks.filter((t) => t.status === 'done').length
  const essaysInProgress = essays.filter(
    (e) => e.status === 'drafting' || e.status === 'revising'
  ).length
  const achievementsCount = achievements.length

  const stats = [
    { label: '完了マイルストーン', value: milestonesDone, color: 'text-green-600' },
    { label: '今日完了タスク', value: tasksCompletedToday, color: 'text-blue-600' },
    { label: '執筆中エッセイ', value: essaysInProgress, color: 'text-purple-600' },
    { label: '実績数', value: achievementsCount, color: 'text-orange-600' },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">ダッシュボード</h1>
        <p className="text-sm text-slate-500 mt-1">{todayJP()}</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="card flex flex-col gap-1 py-4">
            <span className={`text-3xl font-bold ${s.color}`}>{s.value}</span>
            <span className="text-xs text-slate-500">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Countdown cards */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">直近のマイルストーン</h2>
        {upcomingMilestones.length === 0 ? (
          <div className="card text-center text-slate-400 py-10 text-sm">
            予定中のマイルストーンはありません
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingMilestones.map((m) => (
              <CountdownCard key={m.id} milestone={m} />
            ))}
          </div>
        )}
      </section>

      {/* Today's tasks + Monthly goals — two columns on wide screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <section>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-700">今日のタスク</h2>
              <button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="btn-secondary flex items-center gap-1.5 text-sm py-1.5"
              >
                <Sparkles size={15} />
                {generateMutation.isPending ? '生成中…' : 'AIがタスクを生成'}
              </button>
            </div>

            {tasksLoading ? (
              <p className="text-sm text-slate-400 py-6 text-center">読み込み中…</p>
            ) : todayTasks.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-400">今日のタスクはありません</p>
                <p className="text-xs text-slate-300 mt-1">
                  「AIがタスクを生成」で自動作成できます
                </p>
              </div>
            ) : (
              <div>
                {todayTasks.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </div>
            )}

            {todayTasks.length > 0 && (
              <p className="text-xs text-slate-400 mt-3 text-right">
                {tasksCompletedToday} / {todayTasks.length} 完了
              </p>
            )}
          </div>
        </section>

        {/* Monthly Goals */}
        <section>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-700">
                {now.getMonth() + 1}月の目標
              </h2>
              <span className="text-xs text-slate-400">{goals.length}件</span>
            </div>

            {goals.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-400">今月の目標はありません</p>
              </div>
            ) : (
              <div>
                {goals.map((goal) => (
                  <GoalProgressRow key={goal.id} goal={goal} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
