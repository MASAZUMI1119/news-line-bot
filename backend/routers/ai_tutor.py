import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import ChatMessage, Task, Goal, Milestone, Essay, Achievement
from schemas import ChatMessageCreate, ChatMessageOut, ChatResponse
from datetime import date

router = APIRouter(prefix="/api/ai", tags=["ai"])

SYSTEM_PROMPT = """あなたは「ミネルバAIチューター」です。ユーザーはミネルバ大学（Minerva University）への入学を目指している受験生です。

あなたの役割：
- ミネルバ大学の受験プロセスに精通したパーソナルアドバイザー
- 毎日のタスク管理と進捗の軌道修正
- エッセイへのフィードバックと改善提案
- モチベーション維持とメンタルサポート
- ミネルバ固有の入学基準（学力だけでなく知的好奇心・批判的思考・コラボレーション）に基づいたアドバイス

ミネルバ大学について：
- 7都市を巡回する独自のグローバル教育
- 従来の大学とは異なる完全アクティブラーニング
- 合格率は非常に低く、知的能力・多様な経験・強い目的意識が重視される
- エッセイでは「なぜミネルバか」「あなたは何を変えたいか」という本質を問われる

日本語で親しみやすく、かつ専門的に回答してください。具体的で実践的なアドバイスを心がけてください。"""


def get_context_summary(db: Session) -> str:
    today = str(date.today())
    tasks_today = db.query(Task).filter(Task.date == today).all()
    pending_tasks = [t for t in tasks_today if t.status != "done"]
    upcoming = db.query(Milestone).filter(
        Milestone.date >= today, Milestone.status != "done"
    ).order_by(Milestone.date).limit(3).all()
    essays = db.query(Essay).all()
    achievements = db.query(Achievement).count()

    lines = [f"今日の日付: {today}"]
    if pending_tasks:
        lines.append(f"今日の未完了タスク: {', '.join([t.title for t in pending_tasks])}")
    if upcoming:
        lines.append(f"直近のマイルストーン: {', '.join([f'{m.title}({m.date})' for m in upcoming])}")
    if essays:
        essay_status = ', '.join([f'{e.title}({e.status})' for e in essays])
        lines.append(f"エッセイ状況: {essay_status}")
    lines.append(f"登録済み実績数: {achievements}")
    return "\n".join(lines)


@router.get("/messages", response_model=List[ChatMessageOut])
def get_messages(db: Session = Depends(get_db)):
    return db.query(ChatMessage).order_by(ChatMessage.created_at).all()


@router.post("/chat", response_model=ChatResponse)
def chat(message: ChatMessageCreate, db: Session = Depends(get_db)):
    api_key = os.getenv("ANTHROPIC_API_KEY")

    user_msg = ChatMessage(role="user", content=message.content)
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    if not api_key:
        stub = (
            "**APIキーが設定されていません。**\n\n"
            "`.env` ファイルに `ANTHROPIC_API_KEY=sk-ant-...` を設定してください。\n\n"
            "設定後、AIチューター機能が有効になり、以下のサポートが受けられます：\n"
            "- 毎日のタスク自動生成\n"
            "- エッセイへのフィードバック\n"
            "- 進捗に基づいた軌道修正\n"
            "- モチベーション管理"
        )
        reply = ChatMessage(role="assistant", content=stub)
        db.add(reply)
        db.commit()
        db.refresh(reply)
        return ChatResponse(message=user_msg, reply=reply)

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        context = get_context_summary(db)
        history = db.query(ChatMessage).order_by(ChatMessage.created_at).limit(20).all()
        messages = []
        for h in history:
            if h.id != user_msg.id:
                messages.append({"role": h.role, "content": h.content})
        messages.append({"role": "user", "content": f"[現在の状況]\n{context}\n\n{message.content}"})

        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=messages,
        )
        reply_text = response.content[0].text
    except Exception as e:
        reply_text = f"AIとの通信中にエラーが発生しました: {str(e)}"

    reply = ChatMessage(role="assistant", content=reply_text)
    db.add(reply)
    db.commit()
    db.refresh(reply)
    return ChatResponse(message=user_msg, reply=reply)


@router.post("/generate-tasks")
def generate_tasks(db: Session = Depends(get_db)):
    api_key = os.getenv("ANTHROPIC_API_KEY")
    today = str(date.today())

    if not api_key:
        return {"tasks": [], "message": "ANTHROPIC_API_KEY が設定されていません"}

    upcoming = db.query(Milestone).filter(
        Milestone.date >= today, Milestone.status != "done"
    ).order_by(Milestone.date).limit(5).all()
    goals = db.query(Goal).filter(Goal.status != "done").all()
    existing = db.query(Task).filter(Task.date == today).count()

    if existing > 0:
        return {"tasks": [], "message": "今日のタスクはすでに存在します"}

    context = f"今日: {today}\n"
    if upcoming:
        context += "直近のマイルストーン:\n" + "\n".join([f"- {m.title} ({m.date})" for m in upcoming]) + "\n"
    if goals:
        context += "現在の目標:\n" + "\n".join([f"- {g.title}" for g in goals]) + "\n"

    prompt = f"""{context}
上記の状況を踏まえて、今日やるべきタスクを3〜5個提案してください。
JSON形式で返してください：
{{"tasks": [{{"title": "タスク名", "description": "詳細", "priority": "high/medium/low", "category": "study/essay/document/other"}}]}}
"""

    try:
        import anthropic
        import json
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.content[0].text
        start = text.find("{")
        end = text.rfind("}") + 1
        data = json.loads(text[start:end])
        created = []
        for t in data.get("tasks", []):
            task = Task(
                title=t["title"],
                description=t.get("description", ""),
                date=today,
                priority=t.get("priority", "medium"),
                category=t.get("category", "other"),
                ai_generated=True,
            )
            db.add(task)
            created.append(t)
        db.commit()
        return {"tasks": created, "message": f"{len(created)}件のタスクを生成しました"}
    except Exception as e:
        return {"tasks": [], "message": f"エラー: {str(e)}"}


@router.delete("/messages")
def clear_messages(db: Session = Depends(get_db)):
    db.query(ChatMessage).delete()
    db.commit()
    return {"ok": True}
