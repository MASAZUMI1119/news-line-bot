"""LINE Webhook router – handles incoming LINE messages."""
import os
import re
import logging
from fastapi import APIRouter, Request, HTTPException
from linebot.v3 import WebhookHandler
from linebot.v3.messaging import (
    ApiClient,
    Configuration,
    MessagingApi,
    ReplyMessageRequest,
    TextMessage,
)
from linebot.v3.webhooks import MessageEvent, TextMessageContent
from linebot.v3.exceptions import InvalidSignatureError

import notion_service as notion
import claude_service as claude

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhook", tags=["line"])

_handler: WebhookHandler | None = None
_line_api: MessagingApi | None = None


def get_handler() -> WebhookHandler:
    global _handler
    if _handler is None:
        secret = os.environ.get("LINE_CHANNEL_SECRET", "")
        _handler = WebhookHandler(secret)
    return _handler


def get_line_api() -> MessagingApi:
    global _line_api
    if _line_api is None:
        token = os.environ.get("LINE_CHANNEL_ACCESS_TOKEN", "")
        config = Configuration(access_token=token)
        _line_api = MessagingApi(ApiClient(config))
    return _line_api


def reply(reply_token: str, text: str) -> None:
    get_line_api().reply_message(
        ReplyMessageRequest(
            reply_token=reply_token,
            messages=[TextMessage(type="text", text=text)],
        )
    )


def format_task_list(tasks: list[dict]) -> str:
    if not tasks:
        return "📭 タスクはありません"
    lines = []
    for t in tasks:
        priority_icon = {"高": "🔴", "中": "🟡", "低": "🟢"}.get(t["priority"], "⚪")
        due = f" 📅{t['due_date']}" if t["due_date"] else ""
        lines.append(f"{priority_icon} {t['title']}{due} [{t['status']}]")
    return "\n".join(lines)


def handle_message(text: str, reply_token: str) -> None:
    text = text.strip()

    # タスク追加
    if text.startswith("タスク追加:") or text.startswith("タスク追加："):
        body = re.sub(r"^タスク追加[：:]", "", text).strip()
        due_match = re.search(r"期限[：:](\S+)", body)
        priority_match = re.search(r"優先[度]?[：:]([高中低])", body)

        due_date = due_match.group(1) if due_match else None
        priority = priority_match.group(1) if priority_match else "中"
        title = re.sub(r"\s*(期限|優先度?)[：:]\S+", "", body).strip()

        try:
            notion.add_task(title, due_date, priority)
            msg = f"✅ タスクを追加しました！\n📝 {title}"
            if due_date:
                msg += f"\n📅 期限: {due_date}"
            msg += f"\n🎯 優先度: {priority}"
        except Exception as e:
            logger.error(e)
            msg = f"❌ タスクの追加に失敗しました。\nNotionの設定を確認してください。"
        reply(reply_token, msg)
        return

    # タスク一覧
    if text in ("タスク一覧", "タスクリスト", "一覧"):
        try:
            pages = notion.list_tasks()
            tasks = [notion.extract_task_info(p) for p in pages]
            msg = f"📋 未完了タスク ({len(tasks)}件)\n\n" + format_task_list(tasks)
        except Exception as e:
            logger.error(e)
            msg = "❌ タスク一覧の取得に失敗しました。"
        reply(reply_token, msg)
        return

    # 完了
    if text.startswith("完了:") or text.startswith("完了："):
        name = re.sub(r"^完了[：:]", "", text).strip()
        try:
            page = notion.find_task_by_name(name)
            if page:
                notion.update_task_status(page["id"], "完了")
                info = notion.extract_task_info(page)
                msg = f"🎉 タスクを完了しました！\n✅ {info['title']}"
            else:
                msg = f"⚠️ 「{name}」に一致するタスクが見つかりません。"
        except Exception as e:
            logger.error(e)
            msg = "❌ ステータスの更新に失敗しました。"
        reply(reply_token, msg)
        return

    # 進行中
    if text.startswith("進行中:") or text.startswith("進行中："):
        name = re.sub(r"^進行中[：:]", "", text).strip()
        try:
            page = notion.find_task_by_name(name)
            if page:
                notion.update_task_status(page["id"], "進行中")
                info = notion.extract_task_info(page)
                msg = f"🔄 タスクを進行中にしました！\n📝 {info['title']}"
            else:
                msg = f"⚠️ 「{name}」に一致するタスクが見つかりません。"
        except Exception as e:
            logger.error(e)
            msg = "❌ ステータスの更新に失敗しました。"
        reply(reply_token, msg)
        return

    # 分析
    if text in ("分析", "タスク分析", "AI分析"):
        try:
            pages = notion.list_tasks()
            tasks = [notion.extract_task_info(p) for p in pages]
            msg = claude.analyze_tasks(tasks)
        except Exception as e:
            logger.error(e)
            msg = "❌ 分析に失敗しました。"
        reply(reply_token, msg)
        return

    # プラン最適化
    if text in ("プラン最適化", "最適化", "プラン"):
        try:
            pages = notion.list_tasks()
            tasks = [notion.extract_task_info(p) for p in pages]
            msg = claude.optimize_plan(tasks)
        except Exception as e:
            logger.error(e)
            msg = "❌ プラン最適化に失敗しました。"
        reply(reply_token, msg)
        return

    # 振り返り
    if text in ("振り返り", "今日の振り返り", "レビュー"):
        try:
            today = notion.get_today_tasks()
            completed = [notion.extract_task_info(p) for p in today["completed"]]
            incomplete = [notion.extract_task_info(p) for p in today["incomplete"]]
            msg = claude.review_day(completed, incomplete)
        except Exception as e:
            logger.error(e)
            msg = "❌ 振り返りに失敗しました。"
        reply(reply_token, msg)
        return

    # ヘルプ
    if text in ("ヘルプ", "help", "使い方", "?", "？"):
        msg = """📖 使い方ガイド

【タスク管理】
✏️ タスク追加: [内容] 期限:[YYYY-MM-DD] 優先度:[高/中/低]
📋 タスク一覧
✅ 完了: [タスク名]
🔄 進行中: [タスク名]

【AI 分析】
🔍 分析 → 現在のタスクをAIが分析
🗓️ プラン最適化 → 最適なスケジュールを提案
📊 振り返り → 今日の完了/未完了をレビュー

例:
タスク追加: 企画書作成 期限:2024-12-20 優先度:高"""
        reply(reply_token, msg)
        return

    # デフォルト
    reply(
        reply_token,
        "❓ コマンドが認識できませんでした。\n「ヘルプ」と送ると使い方を確認できます。",
    )


@router.post("/line")
async def line_webhook(request: Request):
    signature = request.headers.get("X-Line-Signature", "")
    body = await request.body()
    body_str = body.decode("utf-8")

    handler = get_handler()

    @handler.add(MessageEvent, message=TextMessageContent)
    def on_message(event: MessageEvent):
        handle_message(event.message.text, event.reply_token)

    try:
        handler.handle(body_str, signature)
    except InvalidSignatureError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    return {"status": "ok"}
