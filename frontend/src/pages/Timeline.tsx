import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from '../api/client'
import type { Milestone } from '../api/client'
import { Plus, Trash2, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'

const today = new Date().toISOString().split('T')[0]

// ── category config ────────────────────────────────────────────────────────

type MilestoneCategory = Milestone['category']
type MilestoneStatus   = Milestone['status']

const categoryDotClass: Record<MilestoneCategory, string> = {
  application: 'bg-rose-600',
  document:    'bg-amber-500',
  essay:       'bg-violet-500',
  test:        'bg-emerald-500',
  interview:   'bg-sky-500',
  other:       'bg-stone-400',
}

const categoryBadgeClass: Record<MilestoneCategory, string> = {
  application: 'bg-rose-100 text-rose-700',
  document:    'bg-amber-100 text-amber-700',
  essay:       'bg-violet-100 text-violet-700',
  test:        'bg-emerald-100 text-emerald-700',
  interview:   'bg-sky-100 text-sky-700',
  other:       'bg-stone-100 text-stone-600',
}

const categoryLabel: Record<MilestoneCategory, string> = {
  application: '出願',
  document:    '書類',
  essay:       'エッセイ',
  test:        'テスト',
  interview:   '面接',
  other:       'その他',
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
  upcoming:    'bg-stone-100 text-stone-600',
  in_progress: 'bg-blue-100 text-blue-700',
  done:        'bg-emerald-100 text-emerald-700',
  missed:      'bg-red-100 text-red-600',
}

const statusLabel: Record<MilestoneStatus, string> = {
  upcoming:    '予定',
  in_progress: '進行中',
  done:        '完了',
  missed:      '未達成',
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

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function formatDayLong(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const weekdays = ['日', '月', '火', '水', '木', '金', '土']
  return `${d.getMonth() + 1}月${d.getDate()}日（${weekdays[d.getDay()]}）`
}

function groupKey(dateStr: string): string {
  const { year, month } = parseYearMonth(dateStr)
  return `${year}-${String(month).padStart(2, '0')}`
}

function groupLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return `${y}年${m}月`
}

function isCurrentMonth(key: string): boolean {
  const now = new Date()
  const [y, m] = key.split('-').map(Number)
  return now.getFullYear() === y && now.getMonth() + 1 === m
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
    <div className="mb-8 animate-fade-in">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1.5 h-5 rounded-full bg-brand-800" />
          <h3 className="text-sm font-semibold text-slate-700">マイルストーンを追加</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">タイトル *</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="マイルストーンのタイトル"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">日付 *</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">カテゴリ</label>
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
            <label className="block text-xs text-slate-500 mb-1.5">説明</label>
            <textarea
              className="textarea"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="詳細（任意）"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-sm py-2"
            disabled={mutation.isPending}
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="btn-primary text-sm py-2"
            disabled={mutation.isPending || !title.trim()}
          >
            <Plus size={15} />
            {mutation.isPending ? '追加中…' : '追加'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── milestone row ──────────────────────────────────────────────────────────

function MilestoneRow({ milestone, isLast }: { milestone: Milestone; isLast: boolean }) {
  const qc = useQueryClient()
  const [hovered, setHovered] = useState(false)

  const isPastDone = milestone.date < today && milestone.status === 'done'

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
      className={`relative flex gap-0 transition-opacity duration-200 ${
        isPastDone ? 'opacity-50' : ''
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Timeline spine + dot column */}
      <div className="relative flex flex-col items-center w-10 flex-shrink-0">
        {/* Vertical line segment — hidden on last item */}
        {!isLast && (
          <div className="absolute top-5 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-stone-200" />
        )}
        {/* Category dot */}
        <div
          className={`relative z-10 mt-3.5 w-3 h-3 rounded-full ring-2 ring-white flex-shrink-0 ${
            categoryDotClass[milestone.category]
          } transition-transform duration-150 ${hovered ? 'scale-125' : ''}`}
        />
      </div>

      {/* Content card */}
      <div
        className={`flex-1 mb-3 ml-3 rounded-2xl border px-5 py-4 transition-all duration-150 ${
          hovered
            ? 'border-stone-200 bg-white shadow-[0_4px_16px_-4px_rgb(0,0,0,0.08)]'
            : 'border-stone-100 bg-white shadow-sm'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Left: date + title + description */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-medium text-slate-400 tabular-nums">
                {formatDayLong(milestone.date)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`font-semibold text-sm leading-snug ${
                  isPastDone ? 'line-through text-slate-400' : 'text-slate-800'
                }`}
              >
                {milestone.title}
              </span>
              {milestone.status === 'done' && (
                <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
              )}
            </div>
            {milestone.description && (
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {milestone.description}
              </p>
            )}
          </div>

          {/* Right: badges + delete */}
          <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
            {/* Status badge — click to cycle */}
            <button
              onClick={() => updateStatus.mutate(nextStatus(milestone.status))}
              disabled={updateStatus.isPending}
              title="クリックでステータスを変更"
              className={`badge cursor-pointer select-none transition-all duration-150 hover:opacity-75 hover:scale-105 active:scale-95 ${
                statusBadgeClass[milestone.status]
              }`}
            >
              {statusLabel[milestone.status]}
            </button>

            {/* Category badge */}
            <span className={`badge hidden sm:inline-flex ${categoryBadgeClass[milestone.category]}`}>
              {categoryLabel[milestone.category]}
            </span>

            {/* Delete — hover reveal */}
            <button
              onClick={() => {
                if (confirm(`「${milestone.title}」を削除しますか?`)) {
                  remove.mutate()
                }
              }}
              disabled={remove.isPending}
              title="削除"
              className={`p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-all duration-150 ${
                hovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-1'
              }`}
              aria-label="削除"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Category badge for mobile */}
        <div className="sm:hidden mt-2">
          <span className={`badge ${categoryBadgeClass[milestone.category]}`}>
            {categoryLabel[milestone.category]}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── month section ──────────────────────────────────────────────────────────

function MonthSection({ monthKey, milestones }: { monthKey: string; milestones: Milestone[] }) {
  const isCurrent = isCurrentMonth(monthKey)
  const doneCount = milestones.filter((m) => m.status === 'done').length

  return (
    <section className="animate-fade-in">
      {/* Month header */}
      <div className="flex items-center gap-4 mb-4 pl-1">
        <div className="flex items-center gap-3">
          <h2
            className={`text-base font-bold tracking-tight ${
              isCurrent ? 'text-brand-800' : 'text-slate-700'
            }`}
          >
            {groupLabel(monthKey)}
          </h2>
          {isCurrent && (
            <span className="text-xs font-semibold bg-brand-800 text-white px-2 py-0.5 rounded-full">
              今月
            </span>
          )}
        </div>
        <div className="flex-1 h-px bg-stone-200" />
        <span className="text-xs text-slate-400 tabular-nums flex-shrink-0">
          {doneCount}/{milestones.length}件完了
        </span>
      </div>

      {/* Milestone rows with shared spine */}
      <div className="pl-2">
        {milestones.map((m, idx) => (
          <MilestoneRow
            key={m.id}
            milestone={m}
            isLast={idx === milestones.length - 1}
          />
        ))}
      </div>
    </section>
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

  const totalDone   = milestones.filter((m) => m.status === 'done').length
  const totalCount  = milestones.length

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-label mb-2">2027 Admissions</p>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Timeline</h1>
            <p className="text-sm text-slate-400 mt-1.5">
              Minerva大学 出願スケジュール管理
            </p>
          </div>

          <button
            onClick={() => setShowForm((v) => !v)}
            className="btn-primary mt-1 flex-shrink-0"
          >
            {showForm ? <ChevronUp size={16} /> : <Plus size={16} />}
            追加
          </button>
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400">全体の進捗</span>
              <span className="text-xs font-semibold text-slate-600">
                {totalDone} / {totalCount} 完了
              </span>
            </div>
            <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-800 to-rose-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.round((totalDone / totalCount) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Category legend ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 mb-8">
        {categoryOptions.map((c) => (
          <div key={c} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${categoryDotClass[c]}`} />
            <span className="text-xs text-slate-500">{categoryLabel[c]}</span>
          </div>
        ))}
      </div>

      {/* ── Add form (collapsible) ──────────────────────────────────────── */}
      {showForm && <AddMilestoneForm onClose={() => setShowForm(false)} />}

      {/* ── Timeline ────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="card text-center py-20">
          <div className="flex justify-center gap-1.5 mb-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-stone-300 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <p className="text-sm text-slate-400">読み込み中…</p>
        </div>
      ) : sortedKeys.length === 0 ? (
        <div className="card text-center py-20 border-dashed border-2 border-stone-200 bg-transparent shadow-none">
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
            <Plus size={20} className="text-stone-400" />
          </div>
          <p className="text-slate-500 text-sm font-medium mb-1">
            マイルストーンがありません
          </p>
          <p className="text-slate-300 text-xs">
            「追加」ボタンで最初のマイルストーンを作成しましょう
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {sortedKeys.map((key) => (
            <MonthSection key={key} monthKey={key} milestones={grouped[key]} />
          ))}
        </div>
      )}
    </div>
  )
}
