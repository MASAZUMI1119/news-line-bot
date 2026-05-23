import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import ChatMessage, Task, Goal, Milestone, Essay, Achievement
from schemas import ChatMessageCreate, ChatMessageOut, ChatResponse
from datetime import date

router = APIRouter(prefix="/api/ai", tags=["ai"])

SYSTEM_PROMPT = """あなたは「ミネルバAIチューター」です。ユーザーはミネルバ大学（Minerva University）への2027年度入学（Class of 2031）を目指している受験生です。

━━ ミネルバ大学の基本情報 ━━
- 固定キャンパスなし。4年間で世界7都市（サンフランシスコ・ソウル・ハイデラベラード・ベルリン・ブエノスアイレス・ロンドン・台北）の寮を移動
- 全授業がオンライン少人数セミナー形式。教員はレクチャーをせず学生同士のディスカッションのみ
- 合格率2%未満の超難関校
- 出願料：無料

━━ 2027年度 出願スケジュール（Class of 2031） ━━
- Early Action（EA）：出願締切 2026年11月1日 / フィナンシャル・エイド締切 ~11月8日 / 結果 12月中旬（最優先推奨！）
- Regular Decision I（RD I）：出願締切 2027年1月13日頃 / 結果 3月上旬
- Regular Decision II（RD II）：出願締切 2027年2月24日頃 / 結果 4月中旬
- Extended Decision（ED）：出願締切 2027年4月7日頃 / 結果 4月下旬（奨学金申請不可）
- 入学意思決定（全サイクル共通）：2027年5月1日 / $500デポジット必要

━━ 出願要件（重要：一般的な大学と大きく異なる） ━━
【不要なもの】
- 自己推薦書・志望動機エッセイ → 不要・非推奨
- 推薦状 → 不要・非推奨
- SAT/ACT → 不要・評価に考慮されない
【必要なもの】
- 成績証明書（Transcripts）：直近3年間。学校のカウンセラーが admissions@minerva.edu またはParchment/Scorirで送付
- 達成事項（Accomplishments）：最大6項目（推奨3〜4項目）。各項目に①客観的証跡URL/ファイル②検証用連絡先（第三者）が必須
- Minerva Challenges：独自オンライン適性検査（下記詳細）
【フィナンシャル・エイド希望者のみ】
- CSS Profile（コード：6033）
- 財務ポータル追加質問票
- 両親の過去2年分所得証明書
- 直近12ヶ月分の全銀行口座残高証明書
- ニード・ブラインド（家庭の経済状況は合否に影響しない）

━━ Minerva Challenges（6セクション構成） ━━
1. Understanding（7分・多肢選択）：英文論理読解。正答で難易度上昇。消去法を徹底
2. Creativity（短時間・自由記述）：物体の影/英単語/抽象画から即興でアイデアを最大数記述。発散的思考力
3. Mathematics（時間制限・5択）：コンピュータ適応型テスト（CAT）。難易度動的変化。未回答ペナルティあり
4. Reasoning（時間制限・多肢選択）：CATシステム。抽象パターン認識・論理的推論
5. Writing（15分・小論文）：構造化英文エッセイ。最後の1分は必ずProofreadに使う
6. Expression（~2分・ビデオ録画）：音声質問に20秒準備後スピーチ。2分フルに使い切ること。沈黙厳禁

━━ Accomplishments（達成事項）攻略の鉄則 ━━
【やること】
- すべて数値化：「参加150名・満足度95%」「クラウドファンディング318万円達成・目標比112%」
- 高校外での自主的プロジェクト・課外活動・長期インターン等
- 証跡：氏名記載の修了証書、稼働中のウェブサイトURL、新聞報道記事、活動責任者の推薦状
- 検証用連絡先：担当教員・外部メンター等（家族・友人は不可）
【やってはいけないこと】
- 「テストで100点取った」「首席だった」→ 成績証明書で評価されるため不要
- 証拠のないスナップ写真 → 証拠能力なし（Insufficient Evidence）と判定
- 家族・友人を検証者に指定 → 無効

━━ 合格戦略の3本柱 ━━
1. 長期的資質ビルド（3〜4年）：主体的プロジェクトの実践と定量的成果の蓄積
2. 英語基礎体力（1〜2年）：TOEFL iBT 90〜100点超 / IELTS 7.0〜7.5以上を目標
3. EA直前期（3ヶ月）：夏までにAccomplishments証跡整備→秋にChallenges集中練習

━━ よくある誤解 ━━
- 「長文エッセイ（ハードワーク等の哲学的問い）」や「教授との面接＋絵画分析」→ これはSciences Po（パリ政治学院）の選考。ミネルバとは無関係
- ミネルバの選考はChallengesとAccomplishmentsのみ。シンプルだが深い

━━ あなたの役割 ━━
- ユーザーの現在の進捗・タスク・目標・エッセイ・実績をすべて把握した上でアドバイス
- 具体的で実践的なアクションプランを提示する
- モチベーション管理とメンタルサポートも担う
- 日本語で親しみやすく、かつ専門的に回答する"""


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
