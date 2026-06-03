import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, CheckCircle2, Circle, Clock, X, Loader2 } from 'lucide-react'
import {
  getNotionTasks,
  createNotionTask,
  updateNotionTaskStatus,
  type NotionTask,
} from '../api/client'

type FilterTab = 'all' | '未着手' | '進行中' | '完了'

const PRIORITY_BORDER: Record<string, string> = {
  高: 'border-l-rose-500',
  中: 'border-l-amber-400',
  低: 'border-l-emerald-400',
}
const PRIORITY_DOT: Record<string, string> = {
  高: 'bg-rose-500',
  中: 'bg-amber-400',
  低: 'bg-emerald-400',
}
const PRIORITY_BADGE: Record<string, string> = {
  高: 'bg-rose-50 text-rose-600',
  中: 'bg-amber-50 text-amber-600',
  低: 'bg-emerald-50 text-emerald-600',
}
const STATUS_NEXT: Record<string, string> = {
  未着手: '進行中',
  進行中: '完了',
  完了: '未着手',
}
const STATUS_ICON = {
  未着手: Circle,
  進行中: Clock,
  完了: CheckCircle2,
}

export default function NotionTasks() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<FilterTab>('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', due_date: '', priority: '中' })

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['notion-tasks'],
    queryFn: () => getNotionTasks(),
  })

  const createMut = useMutation({
    mutationFn: createNotionTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notion-tasks'] })
      setForm({ title: '', due_date: '', priority: '中' })
      setShowForm(false)
    },
  })

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateNotionTaskStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notion-tasks'] }),
  })

  const filtered =
    tab === 'all' ? tasks : tasks.filter((t) => t.status === tab)

  const counts = {
    all: tasks.length,
    未着手: tasks.filter((t) => t.status === '未着手').length,
    進行中: tasks.filter((t) => t.status === '進行中').length,
    完了: tasks.filter((t) => t.status === '完了').length,
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notion タスク</h1>
          <p className="text-sm text-gray-500 mt-0.5">Notionと同期されたタスク管理</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-colors"
          style={{ background: '#4c0519' }}
        >
          <Plus size={16} />
          タスク追加
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="mb-6 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="font-medium text-gray-800 text-sm">新しいタスク</p>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
          <div className="space-y-3">
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-900/30"
              placeholder="タスク名"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <div className="flex gap-3">
              <input
                type="date"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-900/30"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
              <select
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-900/30"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="高">🔴 高</option>
                <option value="中">🟡 中</option>
                <option value="低">🟢 低</option>
              </select>
            </div>
            <button
              disabled={!form.title || createMut.isPending}
              onClick={() => createMut.mutate(form)}
              className="w-full py-2 rounded-xl text-white text-sm font-medium disabled:opacity-40 transition-colors"
              style={{ background: '#4c0519' }}
            >
              {createMut.isPending ? '追加中...' : '追加する'}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['all', '未着手', '進行中', '完了'] as FilterTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              tab === t
                ? 'bg-rose-950 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t === 'all' ? 'すべて' : t} ({counts[t]})
          </button>
        ))}
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 size={24} className="animate-spin mr-2" />
          読み込み中...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">タスクがありません</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => {
            const StatusIcon = STATUS_ICON[task.status as keyof typeof STATUS_ICON] ?? Circle
            const isDone = task.status === '完了'
            return (
              <div
                key={task.id}
                className={`bg-white rounded-2xl border-l-4 shadow-sm p-4 flex items-center gap-3 ${
                  PRIORITY_BORDER[task.priority] ?? 'border-l-gray-200'
                }`}
              >
                <button
                  onClick={() =>
                    statusMut.mutate({ id: task.id, status: STATUS_NEXT[task.status] ?? '未着手' })
                  }
                  className="flex-shrink-0 text-gray-400 hover:text-rose-900 transition-colors"
                >
                  <StatusIcon size={20} className={isDone ? 'text-emerald-500' : ''} />
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {task.title}
                  </p>
                  {task.due_date && (
                    <p className="text-xs text-gray-400 mt-0.5">📅 {task.due_date}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      PRIORITY_BADGE[task.priority] ?? 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {task.priority}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${PRIORITY_DOT[task.priority] ?? 'bg-gray-300'}`} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
