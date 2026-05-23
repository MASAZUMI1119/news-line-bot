import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Edit2, Star, X } from 'lucide-react'
import {
  getAchievements,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  type Achievement,
} from '../api/client'

// ── constants ──────────────────────────────────────────────────────────────

type AchievementCategory = Achievement['category']

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  academic: '学術',
  extracurricular: '課外活動',
  leadership: 'リーダーシップ',
  community: '地域貢献',
  work: '仕事/インターン',
  other: 'その他',
}

const CATEGORY_COLORS: Record<AchievementCategory, string> = {
  academic: 'bg-blue-100 text-blue-700',
  extracurricular: 'bg-green-100 text-green-700',
  leadership: 'bg-purple-100 text-purple-700',
  community: 'bg-orange-100 text-orange-700',
  work: 'bg-slate-100 text-slate-700',
  other: 'bg-gray-100 text-gray-600',
}

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as AchievementCategory[]

// ── types ──────────────────────────────────────────────────────────────────

interface AchievementFormData {
  title: string
  category: AchievementCategory
  date: string
  description: string
  impact: string
}

const DEFAULT_FORM: AchievementFormData = {
  title: '',
  category: 'academic',
  date: '',
  description: '',
  impact: '',
}

// ── sub-components ─────────────────────────────────────────────────────────

function AchievementForm({
  initial,
  onSubmit,
  onCancel,
  isPending,
}: {
  initial: AchievementFormData
  onSubmit: (data: AchievementFormData) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [form, setForm] = useState<AchievementFormData>(initial)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">
          タイトル <span className="text-red-500">*</span>
        </label>
        <input
          className="input"
          placeholder="実績・活動のタイトル"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">カテゴリ</label>
          <select
            className="select"
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value as AchievementCategory }))}
          >
            {ALL_CATEGORIES.map(c => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">日付（任意）</label>
          <input
            type="date"
            className="input"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">説明</label>
        <textarea
          className="textarea"
          rows={3}
          placeholder="活動・実績の詳細を入力"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">
          アピールポイント
        </label>
        <p className="text-xs text-slate-400 mb-1">ミネルバの審査員へのアピールポイント</p>
        <textarea
          className="textarea"
          rows={3}
          placeholder="この実績がミネルバ大学の選考でどう活きるかを記述"
          value={form.impact}
          onChange={e => setForm(f => ({ ...f, impact: e.target.value }))}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? '保存中...' : '保存する'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          キャンセル
        </button>
      </div>
    </form>
  )
}

function AchievementCard({
  achievement,
  onDeleted,
}: {
  achievement: Achievement
  onDeleted: () => void
}) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Achievement>) => updateAchievement(achievement.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] })
      setEditing(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteAchievement(achievement.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] })
      onDeleted()
    },
  })

  const handleEdit = (data: AchievementFormData) => {
    updateMutation.mutate({
      title: data.title.trim(),
      category: data.category,
      date: data.date || undefined,
      description: data.description.trim() || undefined,
      impact: data.impact.trim() || undefined,
    })
  }

  const formInitial: AchievementFormData = {
    title: achievement.title,
    category: achievement.category,
    date: achievement.date ?? '',
    description: achievement.description ?? '',
    impact: achievement.impact ?? '',
  }

  const formatDate = (d: string) => {
    const dt = new Date(d)
    return `${dt.getFullYear()}年${dt.getMonth() + 1}月${dt.getDate()}日`
  }

  if (editing) {
    return (
      <div className="card border-2 border-blue-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-700">実績を編集</h3>
          <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <AchievementForm
          initial={formInitial}
          onSubmit={handleEdit}
          onCancel={() => setEditing(false)}
          isPending={updateMutation.isPending}
        />
      </div>
    )
  }

  return (
    <div className="card flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`badge ${CATEGORY_COLORS[achievement.category]}`}>
              {CATEGORY_LABELS[achievement.category]}
            </span>
            {achievement.date && (
              <span className="text-xs text-slate-400">{formatDate(achievement.date)}</span>
            )}
          </div>
          <h3 className="font-semibold text-slate-800 leading-snug">{achievement.title}</h3>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            onClick={() => setEditing(true)}
            title="編集"
          >
            <Edit2 size={15} />
          </button>
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            onClick={() => {
              if (confirm(`「${achievement.title}」を削除しますか？`)) {
                deleteMutation.mutate()
              }
            }}
            disabled={deleteMutation.isPending}
            title="削除"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Description */}
      {achievement.description && (
        <p className="text-sm text-slate-600 leading-relaxed">{achievement.description}</p>
      )}

      {/* Impact */}
      {achievement.impact && (
        <div className="rounded-xl bg-yellow-50 border border-yellow-100 px-3 py-2.5 flex gap-2">
          <Star size={15} className="text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800 leading-relaxed">{achievement.impact}</p>
        </div>
      )}
    </div>
  )
}

// ── main page ──────────────────────────────────────────────────────────────

type TabValue = 'all' | AchievementCategory

export default function Achievements() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState<TabValue>('all')

  const { data: achievements = [], isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: getAchievements,
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<Achievement>) => createAchievement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] })
      setShowForm(false)
    },
  })

  const handleCreate = (data: AchievementFormData) => {
    createMutation.mutate({
      title: data.title.trim(),
      category: data.category,
      date: data.date || undefined,
      description: data.description.trim() || undefined,
      impact: data.impact.trim() || undefined,
    })
  }

  const filtered =
    activeTab === 'all'
      ? achievements
      : achievements.filter(a => a.category === activeTab)

  const countByCategory = ALL_CATEGORIES.reduce<Record<AchievementCategory, number>>(
    (acc, cat) => {
      acc[cat] = achievements.filter(a => a.category === cat).length
      return acc
    },
    {} as Record<AchievementCategory, number>,
  )

  const tabs: { value: TabValue; label: string; count: number }[] = [
    { value: 'all', label: '全て', count: achievements.length },
    ...ALL_CATEGORIES.map(c => ({
      value: c as TabValue,
      label: CATEGORY_LABELS[c],
      count: countByCategory[c],
    })),
  ]

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
            <Star size={20} className="text-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">実績・活動</h1>
            <p className="text-slate-500 text-sm">ミネルバ大学出願のための実績管理</p>
          </div>
        </div>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => setShowForm(v => !v)}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'キャンセル' : '追加'}
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {ALL_CATEGORIES.map(cat => (
          <div key={cat} className="card text-center py-3 px-2">
            <p className="text-2xl font-bold text-slate-800">{countByCategory[cat]}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-tight">{CATEGORY_LABELS[cat]}</p>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card mb-6 border-2 border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700">新しい実績を追加</h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={18} />
            </button>
          </div>
          <AchievementForm
            initial={DEFAULT_FORM}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            isPending={createMutation.isPending}
          />
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          読み込み中...
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Star size={40} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">
            {activeTab === 'all' ? '実績がまだありません' : 'このカテゴリの実績はありません'}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            「追加」ボタンから実績を登録しましょう
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map(achievement => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              onDeleted={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  )
}
