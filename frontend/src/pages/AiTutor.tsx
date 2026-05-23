import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Bot, X, Trash2 } from 'lucide-react'
import {
  getChatMessages,
  sendChat,
  clearChat,
  type ChatMessage,
} from '../api/client'

// ── helpers ────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * Minimal markdown-like rendering:
 * - **text** → <strong>
 * - Lines starting with "- " → <ul><li>
 */
function renderContent(text: string): React.ReactNode {
  const lines = text.split('\n')
  const result: React.ReactNode[] = []

  let listItems: string[] = []

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      result.push(
        <ul key={`list-${key}`} className="list-disc pl-4 mb-2 space-y-0.5">
          {listItems.map((item, i) => (
            <li key={i} className="text-sm leading-relaxed">
              {renderInline(item)}
            </li>
          ))}
        </ul>,
      )
      listItems = []
    }
  }

  lines.forEach((line, idx) => {
    if (line.startsWith('- ')) {
      listItems.push(line.slice(2))
    } else {
      flushList(String(idx))
      if (line.trim() === '') {
        if (idx > 0) result.push(<br key={`br-${idx}`} />)
      } else {
        result.push(
          <p key={`p-${idx}`} className="text-sm leading-relaxed mb-1 last:mb-0">
            {renderInline(line)}
          </p>,
        )
      }
    }
  })
  flushList('end')

  return <>{result}</>
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

const API_KEY_STUB = 'APIキーが設定されていません'

const SUGGESTED_PROMPTS = [
  '今日のタスクを提案して',
  'エッセイのフィードバックをお願い',
  '来週の計画を立てて',
  'モチベーションが落ちています',
]

// ── message bubble ─────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[75%]">
          <div className="bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-3">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
          <p className="text-xs text-slate-400 mt-1 text-right">{formatTime(message.created_at)}</p>
        </div>
      </div>
    )
  }

  const hasApiKeyNotice = message.content.includes(API_KEY_STUB)

  return (
    <div className="flex items-start gap-3 mb-4">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-white text-xs font-bold">M</span>
      </div>
      <div className="max-w-[75%]">
        {hasApiKeyNotice ? (
          <div className="rounded-2xl rounded-tl-sm border border-orange-200 bg-orange-50 px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <Bot size={16} className="text-orange-500" />
              <span className="text-sm font-semibold text-orange-700">APIキー未設定</span>
            </div>
            <p className="text-sm text-orange-700 mb-3 leading-relaxed">
              AI機能を使用するにはAnthropicのAPIキーが必要です。
            </p>
            <ol className="text-sm text-orange-700 space-y-1 list-decimal pl-4">
              <li>
                <a
                  href="https://console.anthropic.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-orange-900"
                >
                  console.anthropic.com
                </a>{' '}
                でAPIキーを取得
              </li>
              <li>
                サーバーの <code className="bg-orange-100 px-1 rounded">.env</code> ファイルに{' '}
                <code className="bg-orange-100 px-1 rounded">ANTHROPIC_API_KEY=...</code> を設定
              </li>
              <li>サーバーを再起動</li>
            </ol>
          </div>
        ) : (
          <div className="card rounded-2xl rounded-tl-sm p-4 shadow-sm">
            <div className="text-slate-700">{renderContent(message.content)}</div>
          </div>
        )}
        <p className="text-xs text-slate-400 mt-1">{formatTime(message.created_at)}</p>
      </div>
    </div>
  )
}

// ── main page ──────────────────────────────────────────────────────────────

export default function AiTutor() {
  const queryClient = useQueryClient()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chatMessages'],
    queryFn: getChatMessages,
  })

  const sendMutation = useMutation({
    mutationFn: (content: string) => sendChat(content),
    onSuccess: data => {
      queryClient.setQueryData<ChatMessage[]>(['chatMessages'], prev => [
        ...(prev ?? []),
        data.message,
        data.reply,
      ])
    },
    onError: () => {
      // refetch as fallback
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] })
    },
  })

  const clearMutation = useMutation({
    mutationFn: clearChat,
    onSuccess: () => {
      queryClient.setQueryData<ChatMessage[]>(['chatMessages'], [])
    },
  })

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sendMutation.isPending])

  const handleSend = () => {
    const content = input.trim()
    if (!content || sendMutation.isPending) return
    setInput('')

    // Optimistically add the user message to the cache immediately
    const optimisticUserMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    queryClient.setQueryData<ChatMessage[]>(['chatMessages'], prev => [
      ...(prev ?? []),
      optimisticUserMsg,
    ])

    sendMutation.mutate(content, {
      onSuccess: data => {
        // Replace optimistic message + add reply
        queryClient.setQueryData<ChatMessage[]>(['chatMessages'], prev => {
          const withoutOptimistic = (prev ?? []).filter(m => m.id !== optimisticUserMsg.id)
          return [...withoutOptimistic, data.message, data.reply]
        })
      },
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggest = (prompt: string) => {
    setInput(prompt)
    textareaRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">AIチューター</h1>
            <p className="text-xs text-slate-500">ミネルバ受験専用パーソナルAIアドバイザー</p>
          </div>
        </div>
        <button
          className="btn-secondary flex items-center gap-2 text-sm text-red-500 hover:bg-red-50"
          onClick={() => {
            if (messages.length === 0) return
            if (confirm('チャット履歴をすべて削除しますか？')) {
              clearMutation.mutate()
            }
          }}
          disabled={clearMutation.isPending || messages.length === 0}
        >
          <Trash2 size={15} />
          履歴削除
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            読み込み中...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center">
              <Bot size={32} className="text-indigo-500" />
            </div>
            <div>
              <p className="text-slate-600 font-semibold text-lg">
                ミネルバ受験AIアドバイザー
              </p>
              <p className="text-slate-400 text-sm mt-1">
                エッセイ、計画、モチベーションなど何でも相談できます
              </p>
            </div>
            {/* Suggested prompts in empty state */}
            <div className="grid grid-cols-2 gap-2 max-w-md w-full mt-2">
              {SUGGESTED_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  className="text-sm bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left"
                  onClick={() => handleSuggest(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {/* Pending indicator */}
            {sendMutation.isPending && (
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">M</span>
                </div>
                <div className="card rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1 items-center h-5">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 bg-white border-t border-slate-100 px-6 py-4">
        {/* Suggested prompts chips */}
        {messages.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-3">
            {SUGGESTED_PROMPTS.map(prompt => (
              <button
                key={prompt}
                className="text-xs bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-600 px-3 py-1.5 rounded-full transition-colors"
                onClick={() => handleSuggest(prompt)}
                disabled={sendMutation.isPending}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Text input row */}
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              className="textarea pr-3 leading-relaxed"
              rows={2}
              placeholder="メッセージを入力… (Enterで送信、Shift+Enterで改行)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sendMutation.isPending}
              style={{ resize: 'none' }}
            />
            {input.length > 0 && (
              <button
                className="absolute right-2 top-2 p-1 rounded-lg text-slate-400 hover:text-slate-600"
                onClick={() => setInput('')}
                tabIndex={-1}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            className="btn-primary flex items-center gap-2 flex-shrink-0 h-[56px] px-5"
            onClick={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
          >
            <Send size={16} />
            {sendMutation.isPending ? '送信中...' : '送信'}
          </button>
        </div>
      </div>
    </div>
  )
}
