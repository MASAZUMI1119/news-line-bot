"""Notion API integration for task management."""
import os
from datetime import datetime, date
from typing import Optional
from notion_client import Client

_client: Optional[Client] = None


def get_client() -> Client:
    global _client
    if _client is None:
        _client = Client(auth=os.environ["NOTION_API_KEY"])
    return _client


def get_database_id() -> str:
    db_id = os.environ.get("NOTION_DATABASE_ID", "")
    if not db_id:
        raise ValueError("NOTION_DATABASE_ID is not set")
    return db_id


def add_task(title: str, due_date: Optional[str] = None, priority: str = "中") -> dict:
    """Add a task to Notion database."""
    client = get_client()
    db_id = get_database_id()

    properties: dict = {
        "名前": {"title": [{"text": {"content": title}}]},
        "ステータス": {"select": {"name": "未着手"}},
        "優先度": {"select": {"name": priority}},
    }

    if due_date:
        properties["期限"] = {"date": {"start": due_date}}

    page = client.pages.create(
        parent={"database_id": db_id},
        properties=properties,
    )
    return page


def list_tasks(status_filter: Optional[str] = None) -> list[dict]:
    """List tasks from Notion database."""
    client = get_client()
    db_id = get_database_id()

    filters = []
    if status_filter:
        filters.append({
            "property": "ステータス",
            "select": {"equals": status_filter},
        })
    else:
        # exclude done tasks by default
        filters.append({
            "property": "ステータス",
            "select": {"does_not_equal": "完了"},
        })

    query_params: dict = {
        "database_id": db_id,
        "sorts": [{"property": "期限", "direction": "ascending"}],
    }
    if filters:
        query_params["filter"] = {"and": filters} if len(filters) > 1 else filters[0]

    result = client.databases.query(**query_params)
    return result.get("results", [])


def update_task_status(page_id: str, status: str) -> dict:
    """Update task status in Notion."""
    client = get_client()
    page = client.pages.update(
        page_id=page_id,
        properties={"ステータス": {"select": {"name": status}}},
    )
    return page


def find_task_by_name(name: str) -> Optional[dict]:
    """Find a task by partial name match."""
    client = get_client()
    db_id = get_database_id()

    result = client.databases.query(
        database_id=db_id,
        filter={
            "property": "名前",
            "title": {"contains": name},
        },
    )
    results = result.get("results", [])
    return results[0] if results else None


def get_today_tasks() -> dict:
    """Get today's completed and incomplete tasks."""
    client = get_client()
    db_id = get_database_id()
    today = date.today().isoformat()

    completed = client.databases.query(
        database_id=db_id,
        filter={
            "and": [
                {"property": "ステータス", "select": {"equals": "完了"}},
                {"property": "期限", "date": {"equals": today}},
            ]
        },
    ).get("results", [])

    incomplete = client.databases.query(
        database_id=db_id,
        filter={
            "and": [
                {"property": "ステータス", "select": {"does_not_equal": "完了"}},
                {"property": "期限", "date": {"on_or_before": today}},
            ]
        },
    ).get("results", [])

    return {"completed": completed, "incomplete": incomplete}


def extract_task_info(page: dict) -> dict:
    """Extract readable info from a Notion page."""
    props = page.get("properties", {})

    title = ""
    title_prop = props.get("名前", {}).get("title", [])
    if title_prop:
        title = title_prop[0].get("text", {}).get("content", "")

    status = props.get("ステータス", {}).get("select", {})
    status_name = status.get("name", "不明") if status else "不明"

    priority = props.get("優先度", {}).get("select", {})
    priority_name = priority.get("name", "") if priority else ""

    due_date = props.get("期限", {}).get("date", {})
    due_str = due_date.get("start", "") if due_date else ""

    return {
        "id": page["id"],
        "title": title,
        "status": status_name,
        "priority": priority_name,
        "due_date": due_str,
    }
