"""REST API for Notion-backed task management."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import notion_service as notion

router = APIRouter(prefix="/api/notion", tags=["notion"])


class TaskCreate(BaseModel):
    title: str
    due_date: Optional[str] = None
    priority: str = "中"


class StatusUpdate(BaseModel):
    status: str


@router.get("/tasks")
def list_tasks(status: Optional[str] = None):
    try:
        pages = notion.list_tasks(status_filter=status)
        return [notion.extract_task_info(p) for p in pages]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tasks", status_code=201)
def create_task(body: TaskCreate):
    try:
        page = notion.add_task(body.title, body.due_date, body.priority)
        return notion.extract_task_info(page)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/tasks/{page_id}")
def update_status(page_id: str, body: StatusUpdate):
    try:
        page = notion.update_task_status(page_id, body.status)
        return notion.extract_task_info(page)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tasks/today")
def today_tasks():
    try:
        data = notion.get_today_tasks()
        return {
            "completed": [notion.extract_task_info(p) for p in data["completed"]],
            "incomplete": [notion.extract_task_info(p) for p in data["incomplete"]],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
