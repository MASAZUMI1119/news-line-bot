"""REST API for Claude-powered task coaching."""
from fastapi import APIRouter, HTTPException
import notion_service as notion
import claude_service as claude

router = APIRouter(prefix="/api/coach", tags=["ai-coach"])


@router.get("/analyze")
def analyze():
    try:
        pages = notion.list_tasks()
        tasks = [notion.extract_task_info(p) for p in pages]
        result = claude.analyze_tasks(tasks)
        return {"result": result, "task_count": len(tasks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/optimize")
def optimize():
    try:
        pages = notion.list_tasks()
        tasks = [notion.extract_task_info(p) for p in pages]
        result = claude.optimize_plan(tasks)
        return {"result": result, "task_count": len(tasks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/review")
def review():
    try:
        data = notion.get_today_tasks()
        completed = [notion.extract_task_info(p) for p in data["completed"]]
        incomplete = [notion.extract_task_info(p) for p in data["incomplete"]]
        result = claude.review_day(completed, incomplete)
        return {
            "result": result,
            "completed_count": len(completed),
            "incomplete_count": len(incomplete),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
