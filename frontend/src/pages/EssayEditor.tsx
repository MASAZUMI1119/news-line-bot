import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, FileText } from 'lucide-react'
import { getEssay, updateEssay, type Essay } from '../api/client'

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

function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length
}

function formatJapaneseDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function EssayEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const essayId = Number(id)

  const { data: essay, isLoading } = useQuery({
    queryKey: ['essay', essayId],
    queryFn: () => getEssay(essayId),
    enabled: !isNaN(essayId),
  })

  const [title, setTitle] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [status, setStatus] = useState<Essay['status']>('brainstorming')
  const [draft, setDraft] = useState('')
  const [prompt, setPrompt] = useState('')
  const [editingPrompt, setEditingPrompt] = useState(false)
  const [notes, setNotes] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | undefined>(undefined)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Essay>) => updateEssay(essayId, data),
    onSuccess: updated => {
      queryClient.setQueryData(['essay', essayId], updated)
      queryClient.invalidateQueries({ queryKey: ['essays'] })
      setLastSaved(updated.updated_at ?? new Date().toISOString())
      setIsSaving(false)
    },
    onError: () => {
      setIsSaving(false)
    },
  })

  // Hydrate local state from fetched essay
  useEffect(() => {
    if (essay) {
      setTitle(essay.title)
      setStatus(essay.status)
      setDraft(essay.draft)
      setPrompt(essay.prompt ?? '')
      setNotes(essay.notes ?? '')
      setWordCount(countWords(essay.draft))
      setLastSaved(essay.updated_at)
    }
  }, [essay])

  // Focus title input when editing
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [editingTitle])

  const scheduleSave = useCallback(
    (patch: Partial<Essay>) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      setIsSaving(false)
      debounceRef.current = setTimeout(() => {
        setIsSaving(true)
        saveMutation.mutate(patch)
      }, 2000)
    },
    [saveMutation],
  )

  const handleDraftChange = (value: string) => {
    setDraft(value)
    const wc = countWords(value)
    setWordCount(wc)
    scheduleSave({ draft: value, word_count: wc, title, status, prompt, notes })
  }

  const handleSaveNow = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setIsSaving(true)
    saveMutation.mutate({ title, status, draft, prompt, notes, word_count: wordCount })
  }

  const handleBlurField = () => {
    scheduleSave({ title, status, draft, prompt, notes, word_count: wordCount })
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-400">
        読み込み中...
      </div>
    )
  }

  if (!essay) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <FileText size={40} className="text-slate-300" />
        <p className="text-slate-500">エッセイが見つかりません</p>
        <button className="btn-secondary" onClick={() => navigate('/essays')}>
          一覧へ戻る
        </button>
      </div>
    )
  }

  const target = essay.target_word_count
  const progressPct = Math.min(100, Math.round((wordCount / target) * 100))
  const wordCountColor =
    wordCount > target ? 'text-red-600 font-semibold' : wordCount >= target * 0.9 ? 'text-green-600 font-semibold' : 'text-slate-600'

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            className="btn-secondary flex items-center gap-2 text-sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} />
            戻る
          </button>

          {/* Inline title editor */}
          {editingTitle ? (
            <input
              ref={titleInputRef}
              className="input w-72 font-semibold text-slate-800"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={() => {
                setEditingTitle(false)
                handleBlurField()
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  setEditingTitle(false)
                  handleBlurField()
                }
              }}
            />
          ) : (
            <button
              className="text-lg font-semibold text-slate-800 hover:text-blue-600 transition-colors"
              onClick={() => setEditingTitle(true)}
              title="クリックしてタイトルを編集"
            >
              {title}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Status selector */}
          <select
            className={`select w-auto text-sm px-3 py-1.5 border rounded-lg ${STATUS_COLORS[status]}`}
            value={status}
            onChange={e => {
              const v = e.target.value as Essay['status']
              setStatus(v)
              scheduleSave({ title, status: v, draft, prompt, notes, word_count: wordCount })
            }}
          >
            {(Object.keys(STATUS_LABELS) as Essay['status'][]).map(s => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>

          {/* Word count */}
          <span className={`text-sm ${wordCountColor}`}>
            {wordCount} / {target}語
          </span>

          {/* Save button */}
          <button
            className="btn-primary flex items-center gap-2"
            onClick={handleSaveNow}
            disabled={saveMutation.isPending || isSaving}
          >
            <Save size={16} />
            {isSaving || saveMutation.isPending ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* Last saved */}
      {lastSaved && (
        <div className="px-6 py-1.5 bg-slate-50 border-b border-slate-100 text-xs text-slate-400 flex-shrink-0">
          最終更新: {formatJapaneseDate(lastSaved)}
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: main editor */}
        <div className="flex-1 flex flex-col overflow-hidden p-6 gap-4">
          {/* Prompt display */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                プロンプト（設問）
              </label>
              <button
                className="text-xs text-blue-500 hover:underline"
                onClick={() => setEditingPrompt(v => !v)}
              >
                {editingPrompt ? '完了' : '編集'}
              </button>
            </div>
            {editingPrompt ? (
              <textarea
                className="textarea"
                rows={3}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onBlur={() => {
                  setEditingPrompt(false)
                  handleBlurField()
                }}
                placeholder="設問を入力..."
              />
            ) : (
              <div
                className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm text-slate-600 min-h-[56px] cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => setEditingPrompt(true)}
              >
                {prompt || (
                  <span className="text-slate-400 italic">設問をクリックして入力...</span>
                )}
              </div>
            )}
          </div>

          {/* Draft textarea */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                エッセイ本文
              </label>
              {/* Progress bar inline */}
              <div className="flex items-center gap-2">
                <div className="w-32 bg-slate-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      wordCount > target ? 'bg-red-400' : wordCount >= target * 0.9 ? 'bg-green-500' : 'bg-blue-400'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400">{progressPct}%</span>
              </div>
            </div>
            <textarea
              className="textarea flex-1 leading-relaxed text-sm"
              style={{ minHeight: '400px', resize: 'vertical' }}
              value={draft}
              onChange={e => handleDraftChange(e.target.value)}
              onBlur={handleBlurField}
              placeholder="エッセイを書き始めましょう..."
            />
          </div>
        </div>

        {/* Right sidebar: notes */}
        <div className="w-72 border-l border-slate-100 p-5 flex flex-col gap-4 overflow-y-auto bg-slate-50/50">
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              メモ・ノート
            </label>
            <textarea
              className="textarea bg-white"
              rows={12}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={handleBlurField}
              placeholder="アイデアや参考資料など自由にメモ..."
            />
          </div>

          {/* Stats card */}
          <div className="card p-4">
            <p className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wide">統計</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">語数</span>
                <span className={wordCountColor}>{wordCount}語</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">目標</span>
                <span className="text-slate-700">{target}語</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">残り</span>
                <span className={wordCount >= target ? 'text-green-600' : 'text-slate-700'}>
                  {wordCount >= target ? '達成！' : `${target - wordCount}語`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">進捗</span>
                <span className="text-slate-700">{progressPct}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
