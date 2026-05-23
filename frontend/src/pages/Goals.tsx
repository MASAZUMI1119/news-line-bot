import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, Trash2, Target } from 'lucide-react'
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  type Goal,
} from '../api/client'

const STATUS_CYCLE: Record<Goal['status'], Goal['status']> = {
  not_started: 'in_progress',
  in_progress: 'done',
  done: 'not_started',
}

const STATUS_LABEL: Record<Goal['status'], string> = {
  not_started: '未着手',
  in_progress: '進行中',
  done: '達成',
}

const STATUS_BADGE: Record<Goal['status'], string> = {
  not_started: 'bg-stone-100 text-slate-500',
  in_progress: 'bg-brand-50 text-brand-700',
  done: 'bg-emerald-50 text-emerald-600',
}

const STATUS_PROGRESS_BAR: Record<Goal['status'], string> = {
  not_started: 'bg-stone-300',
  in_progress: 'bg-brand-800',
  done: 'bg-emerald-500',
}

const STATUS_SLIDER_ACCENT: Record<Goal['status'], string> = {
  not_started: 'accent-slate-400',
  in_progress: 'accent-rose-800',
  done: 'accent-emerald-500',
}

export default function Goals() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')

  const qc = useQueryClient()
  const queryKey = ['goals', month, year]

  const { data: goals = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => getGoals(month, year),
  })

  const createMut = useMutation({
    mutationFn: createGoal,
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Goal> }) =>
      updateGoal(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  })

  const deleteMut = useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  })

  function prevMonth() {
    if (month === 1) {
      setMonth(12)
      setYear((y: number) => y - 1)
    } else {
      setMonth((m: number) => m - 1)
    }
  }

  function nextMonth() {
    if (month === 12) {
      setMonth(1)
      setYear((y: number) => y + 1)
    } else {
      setMonth((m: number) => m + 1)
    }
  }

  function resetForm() {
    setFormTitle('')
    setFormDescription('')
    setShowForm(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formTitle.trim()) return
    createMut.mutate(
      {
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        month,
        year,
        status: 'not_started',
        progress: 0,
      },
      { onSuccess: resetForm },
    )
  }

  function cycleStatus(goal: Goal) {
    updateMut.mutate({ id: goal.id, data: { status: STATUS_CYCLE[goal.status] } })
  }

  function handleProgressChange(goal: Goal, value: number) {
    updateMut.mutate({ id: goal.id, data: { progress: value } })
  }

  const doneCount = goals.filter((g: Goal) => g.status === 'done').length
  const totalCount = goals.length

  const overallProgress = useMemo(() => {
    if (totalCount === 0) return 0
    const sum = goals.reduce((acc: number, g: Goal) => acc + g.progress, 0)
    return Math.round(sum / totalCount)
  }, [goals, totalCount])

  return (
    <div className="p-8 max-w-3xl mx-auto animate-fade-in">

      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="section-label mb-1">Monthly Goals</p>
          <h1 className="text-2xl font-bold text-slate-800 leading-tight">月別目標</h1>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-secondary text-sm"
        >
          <Plus size={14} />
          目標を追加
        </button>
      </div>

      {/* Month Navigation & Summary */}
      <div className="card mb-4">
        {/* Month selector */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft size={17} />
          </button>

          <span className="text-xl font-bold text-slate-800 tracking-tight">
            {year}年{month}月
          </span>

          <button
            onClick={nextMonth}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronRight size={17} />
          </button>
        </div>

        {/* Summary stats */}
        <div className="mt-5 pt-4 border-t border-stone-100">
          <div className="flex items-center gap-5 mb-3">
            <div className="flex items-center gap-1.5">
              <Target size={14} className="text-slate-400" />
              <span className="text-xs text-slate-400">合計</span>
              <span className="text-sm font-bold text-slate-800">{totalCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-slate-400">達成</span>
              <span className="text-sm font-bold text-emerald-600">{doneCount}</span>
            </div>
            {totalCount > 0 && (
              <div className="ml-auto">
                <span className="text-xs font-bold text-brand-800">{overallProgress}%</span>
              </div>
            )}
          </div>

          {totalCount > 0 && (
            <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-800 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Add Goal Form */}
      {showForm && (
        <div className="card mb-4 animate-fade-in border-brand-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full bg-brand-800" />
            <h2 className="font-semibold text-slate-700 text-sm">
              新しい目標 — {year}年{month}月
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              className="input"
              placeholder="目標のタイトル *"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              required
              autoFocus
            />
            <textarea
              className="textarea"
              placeholder="説明（任意）"
              rows={2}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={resetForm} className="btn-secondary text-sm">
                キャンセル
              </button>
              <button
                type="submit"
                disabled={createMut.isPending || !formTitle.trim()}
                className="btn-primary text-sm"
              >
                {createMut.isPending ? '追加中...' : '追加する'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goal Cards */}
      {isLoading ? (
        <div className="card text-center text-slate-300 py-14 text-sm">読み込み中...</div>
      ) : goals.length === 0 ? (
        <div className="card text-center py-14">
          <Target size={36} className="text-stone-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium text-sm">この月の目標はまだありません</p>
          <p className="text-slate-300 text-xs mt-1.5">
            「目標を追加」ボタンで最初の目標を設定しましょう
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onCycleStatus={cycleStatus}
              onProgressChange={handleProgressChange}
              onDelete={(id) => deleteMut.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface GoalCardProps {
  goal: Goal
  onCycleStatus: (goal: Goal) => void
  onProgressChange: (goal: Goal, value: number) => void
  onDelete: (id: number) => void
}

function GoalCard({ goal, onCycleStatus, onProgressChange, onDelete }: GoalCardProps) {
  const [localProgress, setLocalProgress] = useState(goal.progress)

  return (
    <div className="card group hover:shadow-card-hover transition-shadow duration-200">

      {/* Top row: title + controls */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h3
            className={`font-semibold leading-snug transition-all ${
              goal.status === 'done'
                ? 'line-through text-slate-300'
                : 'text-slate-800'
            }`}
          >
            {goal.title}
          </h3>
          {goal.description && (
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">{goal.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onCycleStatus(goal)}
            className={`badge text-[10px] cursor-pointer hover:opacity-75 transition-opacity ${STATUS_BADGE[goal.status]}`}
            title="クリックでステータス変更"
          >
            {STATUS_LABEL[goal.status]}
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
            title="削除"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Progress section */}
      <div className="space-y-3">

        {/* Large progress number */}
        <div className="flex items-end justify-between">
          <span className="section-label">進捗</span>
          <span
            className={`text-3xl font-black leading-none tabular-nums ${
              goal.status === 'done'
                ? 'text-emerald-500'
                : goal.status === 'in_progress'
                ? 'text-brand-800'
                : 'text-slate-300'
            }`}
          >
            {localProgress}
            <span className="text-base font-semibold ml-0.5 opacity-60">%</span>
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-150 ${STATUS_PROGRESS_BAR[goal.status]}`}
            style={{ width: `${localProgress}%` }}
          />
        </div>

        {/* Range slider */}
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={localProgress}
          onChange={(e) => setLocalProgress(Number(e.target.value))}
          onMouseUp={(e) =>
            onProgressChange(goal, Number((e.target as HTMLInputElement).value))
          }
          onTouchEnd={(e) =>
            onProgressChange(goal, Number((e.target as HTMLInputElement).value))
          }
          className={`w-full h-1 rounded-full appearance-none cursor-pointer bg-stone-100 ${STATUS_SLIDER_ACCENT[goal.status]}`}
        />
      </div>
    </div>
  )
}
