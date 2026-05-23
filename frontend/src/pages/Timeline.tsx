import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from '../api/client'
import type { Milestone } from '../api/client'
import { Plus, Trash2, Check } from 'lucide-react'

const today = new Date().toISOString().split('T')[0]

// ── category config ────────────────────────────────────────────────────────

type MilestoneCategory = Milestone['category']
type MilestoneStatus = Milestone['status']

const categoryDotClass: Record<MilestoneCategory, string> = {
  application: 'bg-blue-500',
  document: 'bg-orange-500',
  essay: 'bg-purple-500',
  test: 'bg-green-500',
  interview: 'bg-yellow-400',
  other: 'bg-slate-400',
}

const categoryBadgeClass: Record<MilestoneCategory, string> = {
  application: 'bg-blue-100 text-blue-700',
  document: 'bg-orange-100 text-orange-700',
  essay: 'bg-purple-100 text-purple-700',
  test: 'bg-green-100 text-green-700',
  interview: 'bg-yellow-100 text-yellow-700',
  other: 'bg-slate-100 text-slate-600',
}

const categoryLabel: Record<MilestoneCategory, string> = {
  application: '出願',
  document: '書類',
  essay: 'エッセイ',
  test: 'テスト',
  interview: '面接',
  other: 'その他',
}

const categoryOptions: MilestoneCategory[] = [
  'application',
  'document',
  'essay',
  'test',
  'interview',
  'other',
]

// ── status config ──────────────────────────────────────────────────────────

const statusBadgeClass: Record<MilestoneStatus, string> = {
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

const statusCycle: MilestoneStatus[] = ['upcoming', 'in_progress', 'done', 'missed']

function nextStatus(current: MilestoneStatus): MilestoneStatus {
  const idx = statusCycle.indexOf(current)
  return statusCycle[(idx + 1) % statusCycle.length]
}

// ── date helpers ───────────────────────────────────────────────────────────

function parseYearMonth(dateStr: string): { year: number; month: number } {
  const [y, m] = dateStr.split('-').map(Number)
  return { year: y, month: m }
}

function formatDayMonth(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function groupKey(dateStr: string): string {
  const { year, month } = parseYearMonth(dateStr)
  return `${year}-${String(month).padStart(2, '0')}`
}

function groupLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return `${y}年${m}月`
}

// ── add form ───────────────────────────────────────────────────────────────

interface AddFormProps {
  onClose: () => void
}

function AddMilestoneForm({ onClose }: AddFormProps) {
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(today)
  const [category, setCategory] = useState<MilestoneCategory>('application')
  const [description, setDescription] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      createMilestone({ title, date, category, description: description || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['milestones'] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !date) return
    mutation.mutate()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card mb-6 border-blue-100 bg-blue-50/40"
    >
      <h3 className="text-sm font-semibold text-slate-700 mb-4">マイルストーンを追加</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">タイトル *</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="マイルストーンのタイトル"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">日付 *</label>
          <input
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">カテゴリ</label>
          <select
            className="select"
            value={category}
            onChange={(e) => setCategory(e.target.value as MilestoneCategory)}
          >
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {categoryLabel[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">説明</label>
          <textarea
            className="textarea"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="詳細（任意）"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="btn-secondary text-sm py-1.5"
          disabled={mutation.isPending}
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="btn-primary text-sm py-1.5 flex items-center gap-1.5"
          disabled={mutation.isPending || !title.trim()}
        >
          <Plus size={15} />
          {mutation.isPending ? '追加中…' : '追加'}
        </button>
      </div>
    </form>
  )
}

// ── milestone item ─────────────────────────────────────────────────────────

function MilestoneItem({ milestone }: { milestone: Milestone }) {
  const qc = useQueryClient()
  const [hovered, setHovered] = useState(false)

  const isPastDone =
    milestone.date < today && milestone.status === 'done'

  const updateStatus = useMutation({
    mutationFn: (status: MilestoneStatus) =>
      updateMilestone(milestone.id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['milestones'] }),
  })

  const remove = useMutation({
    mutationFn: () => deleteMilestone(milestone.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['milestones'] }),
  })

  return (
    <div
      className={`flex gap-4 py-4 border-b border-slate-50 last:border-0 group transition-opacity ${
        isPastDone ? 'opacity-60' : ''
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Colored dot */}
      <div className="flex flex-col items-center pt-1.5 flex-shrink-0">
        <div
          className={`w-3 h-3 rounded-full ${categoryDotClass[milestone.category]}`}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-start gap-2">
          <span className="font-medium text-slate-800 text-sm leading-snug">
            {milestone.title}
          </span>
          {milestone.status === 'done' && (
            <Check size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
          )}
        </div>

        {milestone.description && (
          <p className="text-xs text-slate-500 mt-1">{milestone.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-xs text-slate-500">{formatDayMonth(milestone.date)}</span>

          {/* Status — click to cycle */}
          <button
            onClick={() => updateStatus.mutate(nextStatus(milestone.status))}
            disabled={updateStatus.isPending}
            className={`badge cursor-pointer hover:opacity-80 transition-opacity ${
              statusBadgeClass[milestone.status]
            }`}
          >
            {statusLabel[milestone.status]}
          </button>

          <span className={`badge ${categoryBadgeClass[milestone.category]}`}>
            {categoryLabel[milestone.category]}
          </span>
        </div>
      </div>

      {/* Delete */}
      <div className="flex-shrink-0 flex items-start pt-1">
        <button
          onClick={() => {
            if (confirm(`「${milestone.title}」を削除しますか?`)) {
              remove.mutate()
            }
          }}
          disabled={remove.isPending}
          className={`p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-all ${
            hovered ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label="削除"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}

// ── main page ──────────────────────────────────────────────────────────────

export default function Timeline() {
  const [showForm, setShowForm] = useState(false)

  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ['milestones'],
    queryFn: getMilestones,
  })

  // Group milestones by year-month, sorted chronologically
  const grouped = milestones
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .reduce<Record<string, Milestone[]>>((acc, m) => {
      const key = groupKey(m.date)
      if (!acc[key]) acc[key] = []
      acc[key].push(m)
      return acc
    }, {})

  const sortedKeys = Object.keys(grouped).sort()

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">タイムライン</h1>
          <p className="text-sm text-slate-500 mt-1">
            Minerva大学 出願スケジュール
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden md:flex items-center gap-3 mr-2">
            {categoryOptions.map((c) => (
              <div key={c} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${categoryDotClass[c]}`} />
                <span className="text-xs text-slate-500">{categoryLabel[c]}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="btn-primary flex items-center gap-1.5"
          >
            <Plus size={16} />
            追加
          </button>
        </div>
      </div>

      {/* Mobile legend */}
      <div className="flex md:hidden flex-wrap gap-x-3 gap-y-1 mb-6">
        {categoryOptions.map((c) => (
          <div key={c} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${categoryDotClass[c]}`} />
            <span className="text-xs text-slate-500">{categoryLabel[c]}</span>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && <AddMilestoneForm onClose={() => setShowForm(false)} />}

      {/* Timeline list */}
      {isLoading ? (
        <div className="card text-center text-slate-400 py-16 text-sm">
          読み込み中…
        </div>
      ) : sortedKeys.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-slate-400 text-sm mb-2">マイルストーンがありません</p>
          <p className="text-slate-300 text-xs">「追加」ボタンで作成できます</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedKeys.map((key) => (
            <section key={key}>
              {/* Month header */}
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-semibold text-slate-600">
                  {groupLabel(key)}
                </h2>
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs text-slate-400">
                  {grouped[key].length}件
                </span>
              </div>

              {/* Milestones in this month */}
              <div className="card py-0 px-6">
                {grouped[key].map((m) => (
                  <MilestoneItem key={m.id} milestone={m} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
