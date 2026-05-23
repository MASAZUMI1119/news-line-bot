import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  Circle,
  CalendarDays,
  X,
} from 'lucide-react'
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  generateTasks,
  type Task,
} from '../api/client'

type FilterTab = 'all' | 'pending' | 'done'

const PRIORITY_ORDER: Record<Task['priority'], number> = { high: 0, medium: 1, low: 2 }

const PRIORITY_BORDER: Record<Task['priority'], string> = {
  high: 'border-l-rose-500',
  medium: 'border-l-amber-400',
  low: 'border-l-emerald-400',
}

const PRIORITY_DOT: Record<Task['priority'], string> = {
  high: 'bg-rose-500',
  medium: 'bg-amber-400',
  low: 'bg-emerald-400',
}

const PRIORITY_BADGE: Record<Task['priority'], string> = {
  high: 'bg-rose-50 text-rose-600',
  medium: 'bg-amber-50 text-amber-600',
  low: 'bg-emerald-50 text-emerald-600',
}

const PRIORITY_LABEL: Record<Task['priority'], string> = {
  high: '高',
  medium: '中',
  low: '低',
}

const STATUS_CYCLE: Record<Task['status'], Task['status']> = {
  pending: 'in_progress',
  in_progress: 'done',
  done: 'pending',
}

const STATUS_LABEL: Record<Task['status'], string> = {
  pending: '未着手',
  in_progress: '進行中',
  done: '完了',
}

const STATUS_BADGE: Record<Task['status'], string> = {
  pending: 'bg-stone-100 text-slate-500',
  in_progress: 'bg-brand-50 text-brand-700',
  done: 'bg-emerald-50 text-emerald-600',
}

function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toJapanese(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${y}年${m}月${d}日`
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return toDateString(d)
}

const today = toDateString(new Date())

const FILTER_LABELS: Record<FilterTab, string> = {
  all: 'ALL',
  pending: 'PENDING',
  done: 'DONE',
}

export default function Tasks() {
  const qc = useQueryClient()
  const [date, setDate] = useState(today)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [showForm, setShowForm] = useState(false)
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formPriority, setFormPriority] = useState<Task['priority']>('medium')
  const [formCategory, setFormCategory] = useState('')
  const [formDescription, setFormDescription] = useState('')

  const queryKey = ['tasks', date]

  const { data: tasks = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => getTasks(date),
  })

  const createMut = useMutation({
    mutationFn: createTask,
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Task> }) =>
      updateTask(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  })

  const deleteMut = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  })

  const generateMut = useMutation({
    mutationFn: generateTasks,
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  })

  const sorted = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        const pd = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
        return pd !== 0 ? pd : a.id - b.id
      }),
    [tasks],
  )

  const filtered = useMemo(() => {
    if (filter === 'all') return sorted
    if (filter === 'done') return sorted.filter((t) => t.status === 'done')
    return sorted.filter((t) => t.status !== 'done')
  }, [sorted, filter])

  const doneCount = tasks.filter((t) => t.status === 'done').length
  const totalCount = tasks.length
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  function resetForm() {
    setFormTitle('')
    setFormPriority('medium')
    setFormCategory('')
    setFormDescription('')
    setShowForm(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formTitle.trim()) return
    createMut.mutate(
      {
        title: formTitle.trim(),
        priority: formPriority,
        category: formCategory.trim() || undefined,
        description: formDescription.trim() || undefined,
        date,
        status: 'pending',
        ai_generated: false,
      },
      { onSuccess: resetForm },
    )
  }

  function toggleDone(task: Task) {
    const next = task.status === 'done' ? 'pending' : 'done'
    updateMut.mutate({ id: task.id, data: { status: next } })
  }

  function cycleStatus(task: Task) {
    updateMut.mutate({ id: task.id, data: { status: STATUS_CYCLE[task.status] } })
  }

  const isToday = date === today

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto animate-fade-in">

      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="section-label mb-1.5">DAILY TASKS</p>
          <h1 className="text-2xl font-bold text-slate-800 leading-tight tracking-tight">
            デイリータスク
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {isToday && (
            <button
              onClick={() => generateMut.mutate()}
              disabled={generateMut.isPending}
              className="btn-primary text-sm"
            >
              <Sparkles size={14} />
              {generateMut.isPending ? '生成中...' : 'AI生成'}
            </button>
          )}
          <button
            onClick={() => setShowForm((v) => !v)}
            className="btn-secondary text-sm"
          >
            <Plus size={14} />
            タスク追加
          </button>
        </div>
      </div>

      {/* ── Date Navigation ─────────────────────────────── */}
      <div className="card mb-4">
        {/* Pill navigation row */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setDate((d) => addDays(d, -1))}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="前の日"
          >
            <ChevronLeft size={17} />
          </button>

          <div className="flex items-center gap-2.5">
            {/* Date display pill */}
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-100 rounded-full px-4 py-2">
              <CalendarDays size={13} className="text-slate-400 flex-shrink-0" />
              <span className="text-sm font-semibold text-slate-700 tracking-tight whitespace-nowrap">
                {toJapanese(date)}
              </span>
            </div>

            {/* "今日" badge */}
            {isToday && (
              <span className="badge bg-brand-800 text-white text-[10px] tracking-wider px-3 py-1">
                今日
              </span>
            )}

            {/* Date picker (icon-style) */}
            <input
              type="date"
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="w-7 h-7 opacity-0 absolute cursor-pointer"
              style={{ position: 'absolute' }}
              aria-label="日付選択"
            />
            <label className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-stone-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer relative">
              <CalendarDays size={14} />
              <input
                type="date"
                value={date}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                aria-label="日付選択"
              />
            </label>
          </div>

          <button
            onClick={() => setDate((d) => addDays(d, 1))}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="次の日"
          >
            <ChevronRight size={17} />
          </button>
        </div>

        {/* Progress Bar */}
        {totalCount > 0 && (
          <div className="mt-5 pt-5 border-t border-stone-100">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-xs text-slate-400">
                <span className="text-slate-700 font-bold tabular-nums">{doneCount}</span>
                <span className="text-slate-400"> / {totalCount} 完了</span>
              </span>
              <span className="text-xs font-bold text-brand-800 tabular-nums">{progress}%</span>
            </div>
            {/* Slim progress bar */}
            <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-800 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Add Task Form ────────────────────────────────── */}
      {showForm && (
        <div className="card mb-4 animate-fade-in border border-brand-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full bg-brand-800" />
              <h2 className="font-semibold text-slate-700 text-sm">新しいタスクを追加</h2>
            </div>
            <button
              onClick={resetForm}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-stone-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              className="input"
              placeholder="タスクのタイトル *"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              required
              autoFocus
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block section-label mb-1.5">優先度</label>
                <select
                  className="select"
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value as Task['priority'])}
                >
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>
              </div>
              <div>
                <label className="block section-label mb-1.5">カテゴリ</label>
                <input
                  className="input"
                  placeholder="study / essay..."
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                />
              </div>
            </div>
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

      {/* ── Filter Tabs ──────────────────────────────────── */}
      <div className="flex gap-1 mb-4 bg-stone-100 rounded-2xl p-1 w-fit">
        {(['all', 'pending', 'done'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 ${
              filter === tab
                ? 'bg-brand-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {FILTER_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* ── Task List ────────────────────────────────────── */}
      {isLoading ? (
        <div className="card flex items-center justify-center gap-3 py-14 text-slate-300">
          <div className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={22} className="text-stone-300" />
          </div>
          <p className="text-slate-500 font-medium text-sm">
            {filter === 'done'
              ? '完了したタスクはありません'
              : filter === 'pending'
              ? '未完了のタスクはありません'
              : 'この日のタスクはありません'}
          </p>
          {filter === 'all' && (
            <p className="text-slate-300 text-xs mt-1.5">
              「タスク追加」またはAI生成で始めましょう
            </p>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((task) => (
            <li
              key={task.id}
              onMouseEnter={() => setHoveredId(task.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`
                card p-0 overflow-hidden group
                border-l-[3px] ${PRIORITY_BORDER[task.priority]}
                hover:shadow-card-hover transition-all duration-200
              `}
            >
              <div className="px-5 py-4 flex items-start gap-3.5">

                {/* Custom Checkbox */}
                <button
                  onClick={() => toggleDone(task)}
                  className="mt-0.5 flex-shrink-0 transition-colors"
                  aria-label="完了トグル"
                >
                  {task.status === 'done' ? (
                    <CheckCircle2 size={19} className="text-brand-800" />
                  ) : (
                    <Circle size={19} className="text-slate-300 hover:text-brand-800 transition-colors" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Title row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-medium text-sm leading-snug transition-all ${
                        task.status === 'done'
                          ? 'line-through text-slate-300'
                          : 'text-slate-800'
                      }`}
                    >
                      {task.title}
                    </span>
                    {task.ai_generated && (
                      <Sparkles size={12} className="text-amber-400 flex-shrink-0" />
                    )}
                  </div>

                  {/* Badge row */}
                  <div className="flex items-center flex-wrap gap-1.5 mt-2">
                    {/* Priority dot + badge */}
                    <span className={`badge text-[10px] tracking-wide ${PRIORITY_BADGE[task.priority]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority]} inline-block`} />
                      {PRIORITY_LABEL[task.priority]}
                    </span>

                    {/* Status badge - clickable to cycle */}
                    <button
                      onClick={() => cycleStatus(task)}
                      className={`badge text-[10px] cursor-pointer hover:opacity-75 transition-opacity ${STATUS_BADGE[task.status]}`}
                      title="クリックでステータス変更"
                    >
                      {STATUS_LABEL[task.status]}
                    </button>

                    {/* Category tag */}
                    {task.category && (
                      <span className="badge bg-stone-100 text-slate-400 text-[10px]">
                        # {task.category}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {task.description && (
                    <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Delete button — hover reveal */}
                <button
                  onClick={() => deleteMut.mutate(task.id)}
                  className={`
                    p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50
                    transition-all flex-shrink-0 mt-0.5 duration-150
                    ${hoveredId === task.id ? 'opacity-100' : 'opacity-0'}
                  `}
                  title="削除"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
