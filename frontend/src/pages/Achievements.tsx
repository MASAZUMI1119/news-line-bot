import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Edit2, Star, X, Link, UserCheck, AlertCircle, Trophy } from 'lucide-react'
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
  academic: 'bg-blue-50 text-blue-700 border-blue-100',
  extracurricular: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  leadership: 'bg-purple-50 text-purple-700 border-purple-100',
  community: 'bg-orange-50 text-orange-700 border-orange-100',
  work: 'bg-slate-100 text-slate-600 border-slate-200',
  other: 'bg-stone-100 text-stone-500 border-stone-200',
}

const CATEGORY_STAT_COLORS: Record<AchievementCategory, { number: string; dot: string }> = {
  academic: { number: 'text-blue-600', dot: 'bg-blue-400' },
  extracurricular: { number: 'text-emerald-600', dot: 'bg-emerald-400' },
  leadership: { number: 'text-purple-600', dot: 'bg-purple-400' },
  community: { number: 'text-orange-500', dot: 'bg-orange-400' },
  work: { number: 'text-slate-600', dot: 'bg-slate-400' },
  other: { number: 'text-stone-500', dot: 'bg-stone-400' },
}

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as AchievementCategory[]

// ── types ──────────────────────────────────────────────────────────────────

interface AchievementFormData {
  title: string
  category: AchievementCategory
  date: string
  description: string
  impact: string
  evidence_url: string
  validation_contact: string
}

const DEFAULT_FORM: AchievementFormData = {
  title: '',
  category: 'academic',
  date: '',
  description: '',
  impact: '',
  evidence_url: '',
  validation_contact: '',
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1.5">
          タイトル <span className="text-rose-500">*</span>
        </label>
        <input
          className="input"
          placeholder="実績・活動のタイトル"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          required
        />
      </div>

      {/* Category + Date — 2-col */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">カテゴリ</label>
          <select
            className="select"
            value={form.category}
            onChange={e =>
              setForm(f => ({ ...f, category: e.target.value as AchievementCategory }))
            }
          >
            {ALL_CATEGORIES.map(c => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">
            日付（任意）
          </label>
          <input
            type="date"
            className="input"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1.5">説明</label>
        <textarea
          className="textarea"
          rows={3}
          placeholder="活動・実績の詳細を入力"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        />
      </div>

      {/* Impact */}
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1.5">
          アピールポイント
          <span className="ml-1.5 text-xs font-normal text-slate-400">数値化してください</span>
        </label>
        <p className="text-xs text-slate-400 mb-1.5 leading-relaxed">
          例：「参加者150名・満足度95%」「資金調達318万円・目標比112%」
        </p>
        <textarea
          className="textarea"
          rows={3}
          placeholder="この実績の定量的インパクトをミネルバ審査員に伝える"
          value={form.impact}
          onChange={e => setForm(f => ({ ...f, impact: e.target.value }))}
        />
      </div>

      {/* Evidence URL */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-1.5">
          <Link size={13} className="text-brand-800" />
          証跡URL（Evidence）
        </label>
        <p className="text-xs text-slate-400 mb-1.5 leading-relaxed">
          修了証書PDF・稼働中ウェブサイト・新聞記事URL等。スナップ写真は不可。
        </p>
        <input
          className="input"
          placeholder="https://... または証跡ファイルへのリンク"
          value={form.evidence_url}
          onChange={e => setForm(f => ({ ...f, evidence_url: e.target.value }))}
        />
      </div>

      {/* Validation Contact */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-1.5">
          <UserCheck size={13} className="text-emerald-600" />
          検証用連絡先（Validation Contact）
        </label>
        <p className="text-xs text-slate-400 mb-1.5 leading-relaxed">
          この実績を証明できる第三者（担当教員・外部メンター等）。家族・友人は不可。
        </p>
        <input
          className="input"
          placeholder="例：山田先生 / yamada@school.jp"
          value={form.validation_contact}
          onChange={e => setForm(f => ({ ...f, validation_contact: e.target.value }))}
        />
      </div>

      <div className="flex gap-3 pt-1">
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
      evidence_url: data.evidence_url.trim() || undefined,
      validation_contact: data.validation_contact.trim() || undefined,
    })
  }

  const formInitial: AchievementFormData = {
    title: achievement.title,
    category: achievement.category,
    date: achievement.date ?? '',
    description: achievement.description ?? '',
    impact: achievement.impact ?? '',
    evidence_url: achievement.evidence_url ?? '',
    validation_contact: achievement.validation_contact ?? '',
  }

  const formatDate = (d: string) => {
    const dt = new Date(d)
    return `${dt.getFullYear()}年${dt.getMonth() + 1}月${dt.getDate()}日`
  }

  // ── Edit mode ──
  if (editing) {
    return (
      <div className="card border-2 border-brand-100 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-50 rounded-lg flex items-center justify-center">
              <Edit2 size={12} className="text-brand-800" />
            </div>
            実績を編集
          </h3>
          <button
            onClick={() => setEditing(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-stone-100 transition-colors"
          >
            <X size={16} />
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

  // ── View mode ──
  return (
    <div className="card flex flex-col gap-4 hover:shadow-card-hover transition-shadow duration-200 animate-fade-in">
      {/* Header row: badge + date + action buttons */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`badge border ${CATEGORY_COLORS[achievement.category]}`}>
              {CATEGORY_LABELS[achievement.category]}
            </span>
            {achievement.date && (
              <span className="text-xs text-slate-400">{formatDate(achievement.date)}</span>
            )}
          </div>
          <h3 className="font-semibold text-slate-800 leading-snug text-base">
            {achievement.title}
          </h3>
        </div>
        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            className="p-1.5 rounded-lg text-slate-300 hover:text-brand-800 hover:bg-brand-50 transition-colors"
            onClick={() => setEditing(true)}
            title="編集"
          >
            <Edit2 size={14} />
          </button>
          <button
            className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            onClick={() => {
              if (confirm(`「${achievement.title}」を削除しますか？`)) {
                deleteMutation.mutate()
              }
            }}
            disabled={deleteMutation.isPending}
            title="削除"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Description */}
      {achievement.description && (
        <p className="text-sm text-slate-600 leading-relaxed">{achievement.description}</p>
      )}

      {/* Impact box */}
      {achievement.impact && (
        <div className="rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-3 flex gap-2.5">
          <Star size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 leading-relaxed">{achievement.impact}</p>
        </div>
      )}

      {/* Evidence & Validation */}
      <div className="flex flex-col gap-2 pt-1 border-t border-stone-50">
        {/* Evidence URL */}
        {achievement.evidence_url ? (
          <div className="flex items-center gap-2 text-xs">
            <Link size={12} className="text-brand-800 flex-shrink-0" />
            <a
              href={achievement.evidence_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-800 hover:underline truncate font-medium"
            >
              {achievement.evidence_url}
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
            <AlertCircle size={12} className="flex-shrink-0 text-amber-500" />
            <span>証跡URLが未設定です（出願に必須）</span>
          </div>
        )}

        {/* Validation contact */}
        {achievement.validation_contact ? (
          <div className="flex items-center gap-2 text-xs">
            <UserCheck size={12} className="text-emerald-500 flex-shrink-0" />
            <span className="text-slate-600">{achievement.validation_contact}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
            <AlertCircle size={12} className="flex-shrink-0 text-amber-500" />
            <span>検証用連絡先が未設定です（出願に必須）</span>
          </div>
        )}
      </div>
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
      evidence_url: data.evidence_url.trim() || undefined,
      validation_contact: data.validation_contact.trim() || undefined,
    })
  }

  const filtered =
    activeTab === 'all' ? achievements : achievements.filter(a => a.category === activeTab)

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

  const atMax = achievements.length >= 6
  const counterColor = atMax
    ? 'bg-red-50 text-red-700 border-red-200'
    : achievements.length >= 4
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-stone-100 text-slate-600 border-stone-200'

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          {/* Trophy icon */}
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <Trophy size={22} className="text-amber-600" />
          </div>
          <div>
            <p className="section-label mb-0.5">ACCOMPLISHMENTS</p>
            <h1 className="text-2xl font-bold text-slate-800 leading-tight">Achievements</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              最大6項目 · 証跡URL · 検証用連絡先が必須
            </p>
          </div>
        </div>

        {/* Right side: counter + add button */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`badge border font-semibold text-sm px-3 py-1 ${counterColor}`}>
            {achievements.length} / 6件
          </span>
          <button
            className="btn-primary"
            onClick={() => setShowForm(v => !v)}
            disabled={atMax}
          >
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? 'キャンセル' : '追加'}
          </button>
        </div>
      </div>

      {/* ── Max warning banner ── */}
      {atMax && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-5 text-sm text-red-700 animate-fade-in">
          <AlertCircle size={16} className="flex-shrink-0 text-red-500" />
          <span>
            最大6件に達しました。出願には最も重要な実績を厳選することが推奨されています。
          </span>
        </div>
      )}

      {/* ── Category stats row (6 mini cards) ── */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {ALL_CATEGORIES.map(cat => {
          const colors = CATEGORY_STAT_COLORS[cat]
          const count = countByCategory[cat]
          const isActive = activeTab === cat
          return (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`card text-center py-4 px-2 transition-all duration-150 cursor-pointer hover:shadow-card-hover ${
                isActive ? 'border-2 border-brand-200 bg-brand-50' : ''
              }`}
            >
              <p className={`text-2xl font-bold ${colors.number}`}>{count}</p>
              <p className="text-xs text-slate-400 mt-1 leading-tight">{CATEGORY_LABELS[cat]}</p>
              {count > 0 && (
                <div className={`w-1.5 h-1.5 ${colors.dot} rounded-full mx-auto mt-1.5 opacity-70`} />
              )}
            </button>
          )
        })}
      </div>

      {/* ── Add form (collapsible, premium card) ── */}
      {showForm && (
        <div className="card mb-6 border-2 border-brand-100 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-brand-50 rounded-lg flex items-center justify-center">
                <Plus size={14} className="text-brand-800" />
              </div>
              <h2 className="font-semibold text-slate-700">新しい実績を追加</h2>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-stone-100 transition-colors"
            >
              <X size={16} />
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

      {/* ── Category filter tabs ── */}
      <div className="flex gap-2 flex-wrap mb-6">
        {tabs.map(tab => {
          const isActive = activeTab === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-brand-800 text-white shadow-sm'
                  : 'bg-white border border-stone-200 text-slate-600 hover:border-stone-300 hover:bg-stone-50'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    isActive ? 'bg-brand-700 text-white' : 'bg-stone-100 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Content area ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-slate-400 text-sm gap-2">
          <div className="w-4 h-4 border-2 border-stone-200 border-t-brand-800 rounded-full animate-spin" />
          読み込み中...
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-20 animate-fade-in">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Trophy size={28} className="text-amber-300" />
          </div>
          <p className="text-slate-500 font-semibold text-base">
            {activeTab === 'all' ? '実績がまだありません' : 'このカテゴリの実績はありません'}
          </p>
          <p className="text-slate-400 text-sm mt-1.5">
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
