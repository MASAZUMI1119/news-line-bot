from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# Task schemas
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    date: str
    status: str = "pending"
    priority: str = "medium"
    category: Optional[str] = None
    ai_generated: bool = False


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None


class TaskOut(TaskBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Goal schemas
class GoalBase(BaseModel):
    title: str
    description: Optional[str] = None
    month: int
    year: int
    status: str = "not_started"
    progress: int = 0


class GoalCreate(GoalBase):
    pass


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    progress: Optional[int] = None


class GoalOut(GoalBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Milestone schemas
class MilestoneBase(BaseModel):
    title: str
    description: Optional[str] = None
    date: str
    category: str = "other"
    status: str = "upcoming"


class MilestoneCreate(MilestoneBase):
    pass


class MilestoneUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None


class MilestoneOut(MilestoneBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Essay schemas
class EssayBase(BaseModel):
    title: str
    prompt: Optional[str] = None
    draft: str = ""
    word_count: int = 0
    target_word_count: int = 650
    status: str = "brainstorming"
    notes: Optional[str] = None


class EssayCreate(EssayBase):
    pass


class EssayUpdate(BaseModel):
    title: Optional[str] = None
    prompt: Optional[str] = None
    draft: Optional[str] = None
    word_count: Optional[int] = None
    target_word_count: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class EssayOut(EssayBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Achievement schemas
class AchievementBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "other"
    date: Optional[str] = None
    impact: Optional[str] = None


class AchievementCreate(AchievementBase):
    pass


class AchievementUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    date: Optional[str] = None
    impact: Optional[str] = None


class AchievementOut(AchievementBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Chat schemas
class ChatMessageCreate(BaseModel):
    content: str


class ChatMessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatResponse(BaseModel):
    message: ChatMessageOut
    reply: ChatMessageOut
