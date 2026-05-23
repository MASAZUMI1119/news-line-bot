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

const STATUS_COLORS: Record<Essay['status'], string> = {
  brainstorming: 'bg-purple-100 text-purple-700',
  drafting: 'bg-blue-100 text-blue-700',
  revising: 'bg-orange-100 text-orange-700',
  final: 'bg-green-100 text-green-700',
}

const STATUS_BAR_COLORS: Record<Essay['status'], string> = {
  brainstorming: 'bg-purple-400',
  drafting: 'bg-blue-400',
  revising: 'bg-orange-400',
  final: 'bg-green-500',
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
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <FileText size={20} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">エッセイ管理</h1>
            <p className="text-slate-500 text-sm">ミネルバ大学出願エッセイ</p>
          </div>
        </div>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => setShowForm(v => !v)}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'キャンセル' : '新規追加'}
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center py-4">
          <p className="text-3xl font-bold text-slate-800">{totalEssays}</p>
          <p className="text-sm text-slate-500 mt-1">総エッセイ数</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-3xl font-bold text-green-600">{finalCount}</p>
          <p className="text-sm text-slate-500 mt-1">完成済み</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-3xl font-bold text-blue-600">{avgProgress}%</p>
          <p className="text-sm text-slate-500 mt-1">平均進捗</p>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card mb-6 border-2 border-blue-100">
          <h2 className="font-semibold text-slate-700 mb-4">新しいエッセイを追加</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                タイトル <span className="text-red-500">*</span>
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
        <div className="flex items-center justify-center py-20 text-slate-400">
          読み込み中...
        </div>
      ) : essays.length === 0 ? (
        <div className="card text-center py-16">
          <FileText size={40} className="mx-auto text-slate-300 mb-4" />
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
              <div key={essay.id} className="card flex flex-col gap-3 hover:shadow-md transition-shadow">
                {/* Title row */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-800 leading-snug">{essay.title}</h3>
                  <span className={`badge whitespace-nowrap ${STATUS_COLORS[essay.status]}`}>
                    {STATUS_LABELS[essay.status]}
                  </span>
                </div>

                {/* Prompt excerpt */}
                {essay.prompt && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {essay.prompt.slice(0, 80)}
                    {essay.prompt.length > 80 ? '...' : ''}
                  </p>
                )}

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-500">進捗</span>
                    <span className="text-xs font-medium text-slate-600">
                      {essay.word_count} / {essay.target_word_count}語
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${STATUS_BAR_COLORS[essay.status]}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-right text-xs text-slate-400 mt-0.5">{progress}%</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1 border-t border-slate-50">
                  <button
                    className="btn-primary flex items-center gap-1.5 text-sm flex-1 justify-center"
                    onClick={() => navigate(`/essays/${essay.id}`)}
                  >
                    <Edit2 size={14} />
                    編集
                    <ChevronRight size={14} />
                  </button>
                  <button
                    className="btn-secondary flex items-center gap-1 text-sm px-3 text-red-500 hover:bg-red-50"
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
  )
}
