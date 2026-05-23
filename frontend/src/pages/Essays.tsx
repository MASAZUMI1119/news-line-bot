import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, FileText, Trash2, Edit2, ChevronRight, X } from 'lucide-react'
import {
  getEssays,
  createEssay,
  deleteEssay,
  type Essay,
} from '../api/client'

const STATUS_LABELS: Record<Essay['status'], string> = {
  brainstorming: '構想中',
  drafting: '執筆中',
  revising: '改訂中',
  final: '完成',
}

const STATUS_BADGE: Record<Essay['status'], string> = {
  brainstorming: 'bg-violet-100 text-violet-700',
  drafting: 'bg-blue-100 text-blue-700',
  revising: 'bg-amber-100 text-amber-700',
  final: 'bg-emerald-100 text-emerald-700',
}

const STATUS_BAR: Record<Essay['status'], string> = {
  brainstorming: 'bg-violet-400',
  drafting: 'bg-blue-400',
  revising: 'bg-amber-400',
  final: 'bg-emerald-500',
}

interface AddForm {
  title: string
  prompt: string
  target_word_count: number
  status: Essay['status']
}

const DEFAULT_FORM: AddForm = {
  title: '',
  prompt: '',
  target_word_count: 650,
  status: 'brainstorming',
}

export default function Essays() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<AddForm>(DEFAULT_FORM)

  const { data: essays = [], isLoading } = useQuery({
    queryKey: ['essays'],
    queryFn: getEssays,
  })

  const createMutation = useMutation({
    mutationFn: createEssay,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['essays'] })
      setForm(DEFAULT_FORM)
      setShowForm(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteEssay,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['essays'] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    createMutation.mutate({
      title: form.title.trim(),
      prompt: form.prompt.trim() || undefined,
      target_word_count: form.target_word_count,
      status: form.status,
      draft: '',
      word_count: 0,
    })
  }

  const totalEssays = essays.length
  const finalCount = essays.filter(e => e.status === 'final').length
  const avgProgress =
    totalEssays > 0
      ? Math.round(
          essays.reduce(
            (sum, e) =>
              sum + Math.min(100, Math.round((e.word_count / e.target_word_count) * 100)),
            0,
          ) / totalEssays,
        )
      : 0

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="p-8 max-w-5xl mx-auto animate-fade-in">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center shadow-sm">
              <FileText size={22} className="text-violet-600" />
            </div>
            <div>
              <p className="section-label mb-0.5">ESSAY MANAGEMENT</p>
              <h1 className="text-2xl font-bold text-slate-800 leading-tight">Essays</h1>
              <p className="text-slate-400 text-sm mt-0.5">ミネルバ大学出願エッセイの管理</p>
            </div>
          </div>
          <button
            className="btn-primary flex items-center gap-2 shadow-sm"
            onClick={() => setShowForm(v => !v)}
          >
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? 'キャンセル' : '新規追加'}
          </button>
        </div>

        {/* Summary stat cards */}
        <div className="grid grid-cols-3 gap-4 mb-7">
          <div className="card text-center py-5">
            <p className="text-3xl font-bold text-slate-800 leading-none">{totalEssays}</p>
            <p className="section-label mt-2">総エッセイ数</p>
          </div>
          <div className="card text-center py-5">
            <p className="text-3xl font-bold text-emerald-600 leading-none">{finalCount}</p>
            <p className="section-label mt-2">完成済み</p>
          </div>
          <div className="card text-center py-5">
            <p className="text-3xl font-bold text-rose-800 leading-none">{avgProgress}%</p>
            <p className="section-label mt-2">平均進捗</p>
          </div>
        </div>

        {/* Add form — collapsible */}
        {showForm && (
          <div className="card mb-7 border border-violet-100 bg-white animate-fade-in">
            <p className="section-label mb-4">新しいエッセイを追加</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  タイトル <span className="text-rose-500">*</span>
                </label>
                <input
                  className="input"
                  placeholder="エッセイのタイトルを入力"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  プロンプト（設問）
                </label>
                <textarea
                  className="textarea"
                  rows={3}
                  placeholder="エッセイの設問や指示を入力（任意）"
                  value={form.prompt}
                  onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    目標語数
                  </label>
                  <input
                    type="number"
                    className="input"
                    min={50}
                    max={5000}
                    value={form.target_word_count}
                    onChange={e =>
                      setForm(f => ({ ...f, target_word_count: Number(e.target.value) }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    ステータス
                  </label>
                  <select
                    className="select"
                    value={form.status}
                    onChange={e =>
                      setForm(f => ({ ...f, status: e.target.value as Essay['status'] }))
                    }
                  >
                    {(Object.keys(STATUS_LABELS) as Essay['status'][]).map(s => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? '追加中...' : '追加する'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowForm(false)
                    setForm(DEFAULT_FORM)
                  }}
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Essay cards grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 text-sm">
            読み込み中...
          </div>
        ) : essays.length === 0 ? (
          <div className="card text-center py-20">
            <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText size={24} className="text-stone-300" />
            </div>
            <p className="text-slate-500 font-medium">エッセイがまだありません</p>
            <p className="text-slate-400 text-sm mt-1">
              「新規追加」ボタンから最初のエッセイを作成しましょう
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5">
            {essays.map(essay => {
              const progress = Math.min(
                100,
                Math.round((essay.word_count / essay.target_word_count) * 100),
              )
              return (
                <div
                  key={essay.id}
                  className="card flex flex-col gap-3 hover:shadow-md transition-shadow duration-200"
                >
                  {/* Title row with status badge */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-800 leading-snug text-base flex-1 min-w-0">
                      {essay.title}
                    </h3>
                    <span className={`badge whitespace-nowrap flex-shrink-0 ${STATUS_BADGE[essay.status]}`}>
                      {STATUS_LABELS[essay.status]}
                    </span>
                  </div>

                  {/* Prompt excerpt */}
                  {essay.prompt ? (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {essay.prompt}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-300 italic">設問なし</p>
                  )}

                  {/* Word count progress */}
                  <div className="space-y-1.5">
                    <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${STATUS_BAR[essay.status]}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400">
                      {essay.word_count} / {essay.target_word_count}語&ensp;
                      <span className="text-slate-300">({progress}%)</span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-stone-50 mt-auto">
                    <button
                      className="btn-primary flex items-center gap-1.5 text-sm flex-1 justify-center"
                      onClick={() => navigate(`/essays/${essay.id}`)}
                    >
                      <Edit2 size={13} />
                      編集
                      <ChevronRight size={13} />
                    </button>
                    <button
                      className="btn-secondary flex items-center gap-1 text-sm px-3 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      onClick={() => {
                        if (confirm(`「${essay.title}」を削除しますか？`)) {
                          deleteMutation.mutate(essay.id)
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
