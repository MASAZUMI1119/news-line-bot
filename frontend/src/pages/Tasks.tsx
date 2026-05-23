import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Sparkles,
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

const PRIORITY_BADGE: Record<Task['priority'], string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
}

const PRIORITY_CHECKBOX: Record<Task['priority'], string> = {
  high: 'accent-red-500',
  medium: 'accent-yellow-500',
  low: 'accent-green-500',
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
  pending: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
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
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">デイリータスク</h1>
          <p className="text-slate-500 text-sm mt-0.5">今日のタスクを管理しましょう</p>
        </div>
        <div className="flex items-center gap-2">
          {isToday && (
            <button
              onClick={() => generateMut.mutate()}
              disabled={generateMut.isPending}
              className="btn-primary flex items-center gap-1.5 text-sm"
            >
              <Sparkles size={15} />
              {generateMut.isPending ? '生成中...' : 'AIでタスク生成'}
            </button>
          )}
          <button
            onClick={() => setShowForm((v) => !v)}
            className="btn-secondary flex items-center gap-1.5 text-sm"
          >
            <Plus size={15} />
            タスク追加
          </button>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="card mb-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setDate((d) => addDays(d, -1))}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-slate-800">{toJapanese(date)}</span>
            {isToday && (
              <span className="badge bg-blue-100 text-blue-700">今日</span>
            )}
            <input
              type="date"
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setDate((d) => addDays(d, 1))}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Progress Bar */}
        {totalCount > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-slate-600 mb-1.5">
              <span>
                {doneCount} / {totalCount} 完了
              </span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Add Task Form */}
      {showForm && (
        <div className="card mb-4">
          <h2 className="font-semibold text-slate-700 mb-4">新しいタスク</h2>
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
                <label className="block text-xs text-slate-500 mb-1">優先度</label>
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
                <label className="block text-xs text-slate-500 mb-1">カテゴリ</label>
                <input
                  className="input"
                  placeholder="study / essay / document"
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

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 rounded-xl p-1 w-fit">
        {(['all', 'pending', 'done'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
              filter === tab
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'all' ? 'すべて' : tab === 'pending' ? '未完了' : '完了'}
          </button>
        ))}
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="card text-center text-slate-400 py-12">読み込み中...</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-slate-300 text-5xl mb-3">✓</div>
          <p className="text-slate-500 font-medium">
            {filter === 'done'
              ? '完了したタスクはありません'
              : filter === 'pending'
              ? '未完了のタスクはありません'
              : 'この日のタスクはありません'}
          </p>
          {filter === 'all' && (
            <p className="text-slate-400 text-sm mt-1">
              「タスク追加」またはAI生成で始めましょう
            </p>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((task) => (
            <li
              key={task.id}
              className="card py-4 group relative"
              onMouseEnter={() => setHoveredId(task.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={task.status === 'done'}
                  onChange={() => toggleDone(task)}
                  className={`mt-0.5 w-5 h-5 rounded cursor-pointer flex-shrink-0 ${PRIORITY_CHECKBOX[task.priority]}`}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-1.5 mb-0.5">
                    <span
                      className={`font-medium text-sm leading-snug ${
                        task.status === 'done'
                          ? 'line-through text-slate-400'
                          : 'text-slate-800'
                      }`}
                    >
                      {task.title}
                    </span>
                    {task.ai_generated && (
                      <Sparkles
                        size={13}
                        className="text-purple-400 flex-shrink-0"
                      />
                    )}
                  </div>

                  <div className="flex items-center flex-wrap gap-1.5 mt-1">
                    {/* Priority badge */}
                    <span className={`badge ${PRIORITY_BADGE[task.priority]}`}>
                      {PRIORITY_LABEL[task.priority]}
                    </span>

                    {/* Status badge - clickable */}
                    <button
                      onClick={() => cycleStatus(task)}
                      className={`badge cursor-pointer hover:opacity-80 transition-opacity ${STATUS_BADGE[task.status]}`}
                      title="クリックでステータス変更"
                    >
                      {STATUS_LABEL[task.status]}
                    </button>

                    {/* Category tag */}
                    {task.category && (
                      <span className="badge bg-slate-100 text-slate-600">
                        {task.category}
                      </span>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Delete button */}
                <button
                  onClick={() => deleteMut.mutate(task.id)}
                  className={`p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0 ${
                    hoveredId === task.id ? 'opacity-100' : 'opacity-0'
                  }`}
                  title="削除"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
