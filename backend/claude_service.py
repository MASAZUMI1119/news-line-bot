"""Claude API integration for task analysis and plan optimization."""
import os
import anthropic

_client = None


def get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    return _client


def _chat(system: str, user: str) -> str:
    client = get_client()
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return message.content[0].text


SYSTEM_PROMPT = """あなたはタスク管理の専門コーチです。
ユーザーの日々のタスクを分析し、具体的で実践的なフィードバックと改善提案を行います。
返答は必ず日本語で、LINE メッセージとして読みやすい形式（箇条書き・絵文字活用）にしてください。
長すぎず、要点を絞って 300 文字以内を目安にしてください。"""


def analyze_tasks(tasks: list[dict]) -> str:
    """Analyze current tasks and provide feedback."""
    if not tasks:
        return "📋 現在タスクがありません。\n「タスク追加: [内容]」で登録してみましょう！"

    task_list = "\n".join(
        f"- {t['title']} [状態:{t['status']} 優先度:{t['priority']} 期限:{t['due_date'] or '未設定'}]"
        for t in tasks
    )

    return _chat(
        SYSTEM_PROMPT,
        f"以下のタスク一覧を分析し、進捗状況・問題点・改善アドバイスを教えてください。\n\n{task_list}",
    )


def optimize_plan(tasks: list[dict]) -> str:
    """Suggest an optimized task plan."""
    if not tasks:
        return "📋 最適化するタスクがありません。まずタスクを追加してください。"

    task_list = "\n".join(
        f"- {t['title']} [状態:{t['status']} 優先度:{t['priority']} 期限:{t['due_date'] or '未設定'}]"
        for t in tasks
    )

    return _chat(
        SYSTEM_PROMPT,
        f"以下のタスク一覧を見て、優先順位・順序・スケジュールの最適なプランを提案してください。\n\n{task_list}",
    )


def review_day(completed: list[dict], incomplete: list[dict]) -> str:
    """Review the day's accomplishments and suggest next steps."""
    completed_list = "\n".join(f"✅ {t['title']}" for t in completed) or "なし"
    incomplete_list = "\n".join(
        f"❌ {t['title']} (期限:{t['due_date'] or '未設定'})" for t in incomplete
    ) or "なし"

    return _chat(
        SYSTEM_PROMPT,
        f"今日の振り返りをしてください。\n\n【完了】\n{completed_list}\n\n【未完了】\n{incomplete_list}\n\n良かった点・改善点・明日へのアドバイスをお願いします。",
    )
