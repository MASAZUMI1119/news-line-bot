import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, FileText, Pencil } from 'lucide-react'
import { getEssay, updateEssay, type Essay } from '../api/client'

const STATUS_LABELS: Record<Essay['status'], string> = {
  brainstorming: '構想中',
  drafting: '執筆中',
  revising: '改訂中',
  final: '完成',
}

const STATUS_SELECT_COLORS: Record<Essay['status'], string> = {
  brainstorming: 'bg-violet-100 text-violet-700 border-violet-200',
  drafting: 'bg-blue-100 text-blue-700 border-blue-200',
  revising: 'bg-amber-100 text-amber-700 border-amber-200',
  final: 'bg-emerald-100 text-emerald-700 border-emerald-200',
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
      <div className="flex items-center justify-center min-h-screen bg-stone-50 text-slate-400 text-sm">
        読み込み中...
      </div>
    )
  }

  if (!essay) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-stone-50 gap-4">
        <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center">
          <FileText size={24} className="text-stone-300" />
        </div>
        <p className="text-slate-500 font-medium">エッセイが見つかりません</p>
        <button className="btn-secondary" onClick={() => navigate('/essays')}>
          一覧へ戻る
        </button>
      </div>
    )
  }

  const target = essay.target_word_count
  const progressPct = Math.min(100, Math.round((wordCount / target) * 100))
  const isOver = wordCount > target
  const isNearDone = !isOver && wordCount >= target * 0.9

  const progressBarColor = isOver
    ? 'bg-red-400'
    : isNearDone
      ? 'bg-emerald-500'
      : 'bg-blue-400'

  const wordCountColor = isOver
    ? 'text-red-600 font-semibold'
    : isNearDone
      ? 'text-emerald-600 font-semibold'
      : 'text-slate-600'

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-stone-50">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-stone-100 flex-shrink-0">
        {/* Left: back + title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="btn-secondary flex items-center gap-1.5 text-sm flex-shrink-0"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={15} />
            戻る
          </button>

          {editingTitle ? (
            <input
              ref={titleInputRef}
              className="input w-72 font-semibold text-slate-800 text-base"
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
              className="flex items-center gap-1.5 group text-base font-semibold text-slate-800 hover:text-rose-800 transition-colors min-w-0"
              onClick={() => setEditingTitle(true)}
              title="クリックしてタイトルを編集"
            >
              <span className="truncate">{title}</span>
              <Pencil
                size={13}
                className="text-slate-300 group-hover:text-rose-400 flex-shrink-0 transition-colors"
              />
            </button>
          )}
        </div>

        {/* Right: status + word count + save */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <select
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border cursor-pointer focus:outline-none transition-colors ${STATUS_SELECT_COLORS[status]}`}
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

          <span className={`text-sm tabular-nums ${wordCountColor}`}>
            {wordCount} / {target}語
          </span>

          <button
            className="btn-primary flex items-center gap-1.5 text-sm"
            onClick={handleSaveNow}
            disabled={saveMutation.isPending || isSaving}
          >
            <Save size={14} />
            {isSaving || saveMutation.isPending ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* Second bar: last saved + full-width progress bar */}
      <div className="flex-shrink-0 bg-white border-b border-stone-100">
        {lastSaved && (
          <div className="px-6 py-1 text-xs text-slate-400">
            最終更新: {formatJapaneseDate(lastSaved)}
          </div>
        )}
        {/* Full-width 2px progress bar */}
        <div className="w-full bg-stone-100 h-0.5">
          <div
            className={`h-0.5 transition-all duration-300 ${progressBarColor}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: prompt + essay editor */}
        <div className="flex-1 flex flex-col overflow-hidden p-6 gap-4">
          {/* Prompt section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="section-label">プロンプト / 設問</span>
              <button
                className="text-xs text-rose-800 hover:text-rose-900 font-medium transition-colors"
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
                autoFocus
              />
            ) : (
              <div
                className="rounded-xl bg-stone-50 border border-stone-100 px-4 py-3 text-sm text-slate-600 min-h-[52px] cursor-pointer hover:bg-stone-100 transition-colors"
                onClick={() => setEditingPrompt(true)}
              >
                {prompt ? (
                  prompt
                ) : (
                  <span className="text-slate-300 italic">設問をクリックして入力...</span>
                )}
              </div>
            )}
          </div>

          {/* Essay label + inline progress */}
          <div className="flex items-center justify-between">
            <span className="section-label">ESSAY</span>
            <div className="flex items-center gap-2">
              <div className="w-28 bg-stone-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${progressBarColor}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 tabular-nums w-8 text-right">{progressPct}%</span>
            </div>
          </div>

          {/* Large draft textarea */}
          <textarea
            className="flex-1 w-full rounded-xl border border-stone-200 px-5 py-4 text-base leading-relaxed text-slate-800 placeholder-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition-shadow bg-white"
            style={{ minHeight: '0' }}
            value={draft}
            onChange={e => handleDraftChange(e.target.value)}
            onBlur={handleBlurField}
            placeholder="エッセイを書き始めましょう..."
          />
        </div>

        {/* Right sidebar */}
        <div className="w-64 border-l border-stone-100 bg-stone-50 flex flex-col overflow-y-auto">
          {/* Notes section */}
          <div className="p-5 flex flex-col gap-2 flex-shrink-0">
            <span className="section-label">NOTES</span>
            <textarea
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition-shadow leading-relaxed"
              rows={10}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={handleBlurField}
              placeholder="アイデアや参考資料など自由にメモ..."
            />
          </div>

          {/* Stats card */}
          <div className="px-5 pb-5">
            <div className="bg-white rounded-2xl border border-stone-100 p-4">
              <span className="section-label block mb-3">STATS</span>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">語数</span>
                  <span className={`tabular-nums ${wordCountColor}`}>{wordCount}語</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">目標</span>
                  <span className="text-slate-600 tabular-nums">{target}語</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">残り</span>
                  <span
                    className={`tabular-nums ${wordCount >= target ? 'text-emerald-600 font-semibold' : 'text-slate-600'}`}
                  >
                    {wordCount >= target ? '達成！' : `${target - wordCount}語`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">進捗</span>
                  <span className="text-slate-600 tabular-nums">{progressPct}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
