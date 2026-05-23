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
  not_started: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
}

const STATUS_PROGRESS_BAR: Record<Goal['status'], string> = {
  not_started: 'bg-slate-300',
  in_progress: 'bg-blue-500',
  done: 'bg-green-500',
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
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">月別目標</h1>
          <p className="text-slate-500 text-sm mt-0.5">月ごとの目標を設定・管理しましょう</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-secondary flex items-center gap-1.5 text-sm"
        >
          <Plus size={15} />
          目標を追加
        </button>
      </div>

      {/* Month Navigation */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-lg font-semibold text-slate-800">
            {year}年{month}月
          </span>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Month Summary */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-blue-500" />
            <span className="text-sm text-slate-600">
              <span className="font-semibold text-slate-800">{totalCount}個</span>の目標 /{' '}
              <span className="font-semibold text-green-600">{doneCount}個</span>達成
            </span>
          </div>
          {totalCount > 0 && (
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <span className="text-xs font-medium text-slate-600 w-10 text-right">
                {overallProgress}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Add Goal Form */}
      {showForm && (
        <div className="card mb-4">
          <h2 className="font-semibold text-slate-700 mb-4">
            新しい目標 — {year}年{month}月
          </h2>
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
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary text-sm"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={createMut.isPending || !formTitle.trim()}
                className="btn-primary text-sm"
              >
                {createMut.isPending ? '追加中...' : '追加'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goal Cards */}
      {isLoading ? (
        <div className="card text-center text-slate-400 py-12">読み込み中...</div>
      ) : goals.length === 0 ? (
        <div className="card text-center py-12">
          <div className="flex justify-center mb-3">
            <Target size={40} className="text-slate-200" />
          </div>
          <p className="text-slate-500 font-medium">この月の目標はまだありません</p>
          <p className="text-slate-400 text-sm mt-1">
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

  // Keep local state in sync when goal data refreshes
  const syncedProgress = localProgress !== goal.progress && localProgress === goal.progress
    ? goal.progress
    : localProgress

  return (
    <div className="card group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3
            className={`font-semibold text-slate-800 leading-snug ${
              goal.status === 'done' ? 'line-through text-slate-400' : ''
            }`}
          >
            {goal.title}
          </h3>
          {goal.description && (
            <p className="text-slate-500 text-sm mt-1 leading-relaxed">{goal.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onCycleStatus(goal)}
            className={`badge cursor-pointer hover:opacity-80 transition-opacity ${STATUS_BADGE[goal.status]}`}
            title="クリックでステータス変更"
          >
            {STATUS_LABEL[goal.status]}
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
            title="削除"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>進捗</span>
          <span className="font-semibold text-slate-700">{syncedProgress}%</span>
        </div>

        {/* Progress bar visualization */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-150 ${STATUS_PROGRESS_BAR[goal.status]}`}
            style={{ width: `${syncedProgress}%` }}
          />
        </div>

        {/* Slider */}
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={syncedProgress}
          onChange={(e) => setLocalProgress(Number(e.target.value))}
          onMouseUp={(e) => onProgressChange(goal, Number((e.target as HTMLInputElement).value))}
          onTouchEnd={(e) => onProgressChange(goal, Number((e.target as HTMLInputElement).value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-100 accent-blue-500"
        />
      </div>
    </div>
  )
}
