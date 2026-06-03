import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Brain, Sparkles, CalendarCheck, Loader2, RefreshCw } from 'lucide-react'
import { getCoachAnalysis, getCoachOptimize, getCoachReview } from '../api/client'

type Mode = 'analyze' | 'optimize' | 'review'

const MODES = [
  {
    key: 'analyze' as Mode,
    label: '現状分析',
    sub: '進捗・問題点・改善アドバイス',
    icon: Brain,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    active: 'bg-violet-600 text-white',
  },
  {
    key: 'optimize' as Mode,
    label: 'プラン最適化',
    sub: '優先順位・スケジュール提案',
    icon: Sparkles,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    active: 'bg-amber-500 text-white',
  },
  {
    key: 'review' as Mode,
    label: '今日の振り返り',
    sub: '完了/未完了のレビュー',
    icon: CalendarCheck,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    active: 'bg-emerald-600 text-white',
  },
]

function useCoachQuery(mode: Mode, enabled: boolean) {
  const fn =
    mode === 'analyze'
      ? getCoachAnalysis
      : mode === 'optimize'
      ? getCoachOptimize
      : getCoachReview

  return useQuery({
    queryKey: ['coach', mode],
    queryFn: fn,
    enabled,
    staleTime: 0,
  })
}

function renderText(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('- ') || line.startsWith('• ')) {
      return (
        <li key={i} className="ml-4 text-sm text-gray-700 leading-relaxed">
          {line.slice(2)}
        </li>
      )
    }
    if (line.trim() === '') return <br key={i} />
    return (
      <p key={i} className="text-sm text-gray-700 leading-relaxed">
        {line}
      </p>
    )
  })
}

export default function AiCoach() {
  const [mode, setMode] = useState<Mode>('analyze')
  const [triggered, setTriggered] = useState(false)
  const { data, isLoading, refetch } = useCoachQuery(mode, triggered)

  const handleRun = () => {
    if (triggered) {
      refetch()
    } else {
      setTriggered(true)
    }
  }

  const handleSwitch = (m: Mode) => {
    setMode(m)
    setTriggered(false)
  }

  const current = MODES.find((m) => m.key === mode)!

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI コーチ</h1>
        <p className="text-sm text-gray-500 mt-0.5">Claude がタスクを分析・アドバイスします</p>
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {MODES.map((m) => {
          const Icon = m.icon
          const isActive = mode === m.key
          return (
            <button
              key={m.key}
              onClick={() => handleSwitch(m.key)}
              className={`p-4 rounded-2xl text-left transition-all border-2 ${
                isActive
                  ? 'border-rose-900 bg-rose-950/5'
                  : 'border-transparent bg-white hover:border-gray-200'
              } shadow-sm`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${m.bg}`}>
                <Icon size={18} className={m.color} />
              </div>
              <p className="text-sm font-semibold text-gray-800">{m.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{m.sub}</p>
            </button>
          )
        })}
      </div>

      {/* Run button */}
      <button
        onClick={handleRun}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-medium transition-opacity disabled:opacity-60 mb-6"
        style={{ background: 'linear-gradient(135deg, #4c0519 0%, #7c1034 100%)' }}
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Claudeが分析中...
          </>
        ) : triggered ? (
          <>
            <RefreshCw size={18} />
            再分析する
          </>
        ) : (
          <>
            <current.icon size={18} />
            {current.label}を実行
          </>
        )}
      </button>

      {/* Result */}
      {data && (
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${current.bg}`}>
              <current.icon size={14} className={current.color} />
            </div>
            <p className="font-semibold text-gray-800 text-sm">{current.label}の結果</p>
            {'task_count' in data && (
              <span className="ml-auto text-xs text-gray-400">
                {(data as { task_count: number }).task_count} タスク対象
              </span>
            )}
            {'completed_count' in data && (
              <span className="ml-auto text-xs text-gray-400">
                完了 {(data as { completed_count: number }).completed_count} /
                未完了 {(data as { incomplete_count: number }).incomplete_count}
              </span>
            )}
          </div>
          <div className="space-y-1">
            {renderText(data.result)}
          </div>
        </div>
      )}

      {!triggered && !data && (
        <div className="text-center py-12 text-gray-400">
          <Brain size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">モードを選んで「実行」してください</p>
        </div>
      )}
    </div>
  )
}
