const BASE = '/api'

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// Tasks
export const getTasks = (date?: string) =>
  req<Task[]>(`/tasks${date ? `?date=${date}` : ''}`)
export const createTask = (data: Partial<Task>) =>
  req<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) })
export const updateTask = (id: number, data: Partial<Task>) =>
  req<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
export const deleteTask = (id: number) =>
  req(`/tasks/${id}`, { method: 'DELETE' })

// Goals
export const getGoals = (month?: number, year?: number) => {
  const params = new URLSearchParams()
  if (month) params.set('month', String(month))
  if (year) params.set('year', String(year))
  return req<Goal[]>(`/goals?${params}`)
}
export const createGoal = (data: Partial<Goal>) =>
  req<Goal>('/goals', { method: 'POST', body: JSON.stringify(data) })
export const updateGoal = (id: number, data: Partial<Goal>) =>
  req<Goal>(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
export const deleteGoal = (id: number) =>
  req(`/goals/${id}`, { method: 'DELETE' })

// Milestones
export const getMilestones = () => req<Milestone[]>('/milestones')
export const createMilestone = (data: Partial<Milestone>) =>
  req<Milestone>('/milestones', { method: 'POST', body: JSON.stringify(data) })
export const updateMilestone = (id: number, data: Partial<Milestone>) =>
  req<Milestone>(`/milestones/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
export const deleteMilestone = (id: number) =>
  req(`/milestones/${id}`, { method: 'DELETE' })

// Essays
export const getEssays = () => req<Essay[]>('/essays')
export const getEssay = (id: number) => req<Essay>(`/essays/${id}`)
export const createEssay = (data: Partial<Essay>) =>
  req<Essay>('/essays', { method: 'POST', body: JSON.stringify(data) })
export const updateEssay = (id: number, data: Partial<Essay>) =>
  req<Essay>(`/essays/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
export const deleteEssay = (id: number) =>
  req(`/essays/${id}`, { method: 'DELETE' })

// Achievements
export const getAchievements = () => req<Achievement[]>('/achievements')
export const createAchievement = (data: Partial<Achievement>) =>
  req<Achievement>('/achievements', { method: 'POST', body: JSON.stringify(data) })
export const updateAchievement = (id: number, data: Partial<Achievement>) =>
  req<Achievement>(`/achievements/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
export const deleteAchievement = (id: number) =>
  req(`/achievements/${id}`, { method: 'DELETE' })

// Notion Tasks
export const getNotionTasks = (status?: string) =>
  req<NotionTask[]>(`/notion/tasks${status ? `?status=${status}` : ''}`)
export const createNotionTask = (data: { title: string; due_date?: string; priority?: string }) =>
  req<NotionTask>('/notion/tasks', { method: 'POST', body: JSON.stringify(data) })
export const updateNotionTaskStatus = (id: string, status: string) =>
  req<NotionTask>(`/notion/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
export const getTodayNotionTasks = () =>
  req<{ completed: NotionTask[]; incomplete: NotionTask[] }>('/notion/tasks/today')

// AI Coach
export const getCoachAnalysis = () => req<{ result: string; task_count: number }>('/coach/analyze')
export const getCoachOptimize = () => req<{ result: string; task_count: number }>('/coach/optimize')
export const getCoachReview = () =>
  req<{ result: string; completed_count: number; incomplete_count: number }>('/coach/review')

// AI Tutor
export const getChatMessages = () => req<ChatMessage[]>('/ai/messages')
export const sendChat = (content: string) =>
  req<{ message: ChatMessage; reply: ChatMessage }>('/ai/chat', {
    method: 'POST', body: JSON.stringify({ content })
  })
export const generateTasks = () => req('/ai/generate-tasks', { method: 'POST' })
export const clearChat = () => req('/ai/messages', { method: 'DELETE' })

// Types
export interface Task {
  id: number
  title: string
  description?: string
  date: string
  status: 'pending' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  category?: string
  ai_generated: boolean
  created_at: string
}

export interface Goal {
  id: number
  title: string
  description?: string
  month: number
  year: number
  status: 'not_started' | 'in_progress' | 'done'
  progress: number
  created_at: string
}

export interface Milestone {
  id: number
  title: string
  description?: string
  date: string
  category: 'application' | 'document' | 'essay' | 'test' | 'interview' | 'other'
  status: 'upcoming' | 'in_progress' | 'done' | 'missed'
  created_at: string
}

export interface Essay {
  id: number
  title: string
  prompt?: string
  draft: string
  word_count: number
  target_word_count: number
  status: 'brainstorming' | 'drafting' | 'revising' | 'final'
  notes?: string
  created_at: string
  updated_at?: string
}

export interface Achievement {
  id: number
  title: string
  description?: string
  category: 'academic' | 'extracurricular' | 'leadership' | 'community' | 'work' | 'other'
  date?: string
  impact?: string
  evidence_url?: string
  validation_contact?: string
  created_at: string
}

export interface NotionTask {
  id: string
  title: string
  status: string
  priority: string
  due_date: string
}

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  created_at: string
}
