from database import SessionLocal
from models import Milestone, Goal


# 2027年度入学（Class of 2031）正確なタイムライン
MILESTONES = [
    # ── 2026年 準備フェーズ ──────────────────────────────────────
    {
        "title": "Accomplishments データ数値化・整備開始",
        "date": "2026-05-01",
        "category": "other",
        "status": "in_progress",
        "description": "課外活動・プロジェクトの定量的データ（参加人数・予算・達成率等）をスプレッドシートに抽出。客観的証跡（修了証書・URLなど）を整備開始。",
    },
    {
        "title": "証跡ファイル収集完了",
        "date": "2026-06-30",
        "category": "document",
        "status": "upcoming",
        "description": "氏名記載の修了証書、稼働中WebサイトURL、メディア報道記事、活動責任者からの推薦状（英文）をPDF化・リンク整備。",
    },
    {
        "title": "検証用連絡先（Validation Contact）確保",
        "date": "2026-07-15",
        "category": "document",
        "status": "upcoming",
        "description": "各Accomplishmentを証明できる第三者（教員・外部責任者）に英文問い合わせへの対応協力を依頼。家族・友人は不可。",
    },
    {
        "title": "英語力チェック（TOEFL/IELTS 模擬受験）",
        "date": "2026-07-01",
        "category": "test",
        "status": "upcoming",
        "description": "目標：TOEFL iBT 90〜100点超 / IELTS 7.0〜7.5以上。Minerva Challenges の Reading・Writing・Expression に対応できる英語基礎体力の確認。",
    },
    {
        "title": "Minerva 出願ポータル / Common App 登録",
        "date": "2026-08-01",
        "category": "application",
        "status": "upcoming",
        "description": "出願ポータル（直接またはCommon App経由）に登録。無料。Part 1（基本情報）を入力し、Minerva Challengesを受験可能な状態にする。",
    },
    {
        "title": "Minerva Challenges 形式練習開始（毎日）",
        "date": "2026-08-15",
        "category": "test",
        "status": "upcoming",
        "description": "6セクション対策：Understanding（消去法）/ Mathematics・Reasoning（CATに慣れる）/ Writing（15分タイムマネジメント）/ Expression（2分スピーチ訓練）/ Creativity（即興アイデア訓練）",
    },
    {
        "title": "Accomplishments 記述（最大6項目）完成",
        "date": "2026-10-01",
        "category": "essay",
        "status": "upcoming",
        "description": "推奨3〜4項目。「定常的な学業実績（テスト高得点・首席等）」は除外し、学校外での自主的プロジェクト・実績を数値で記述。",
    },
    {
        "title": "CSS Profile 提出準備（フィナンシャル・エイド希望者）",
        "date": "2026-10-15",
        "category": "document",
        "status": "upcoming",
        "description": "CSS Profile（ミネルバ大学コード：6033）の入力開始。両親の過去2年分所得証明書・直近12ヶ月分の全銀行口座残高証明書を準備。",
    },
    {
        "title": "Minerva Challenges 受験",
        "date": "2026-10-20",
        "category": "test",
        "status": "upcoming",
        "description": "WebカメラとマイクをONにしてPCから受験。Creativityを除く各セクション前のPractice Sessionを必ず実施してからスタート。",
    },
    # ── Early Action ─────────────────────────────────────────────
    {
        "title": "【EA】Early Action 出願締切",
        "date": "2026-11-01",
        "category": "application",
        "status": "upcoming",
        "description": "最優先サイクル。Non-binding（入学義務なし）だが、早期拘束（Binding Enrollment）を選択した場合は合格後10日以内にデポジット支払い・他大学出願取下げが必要。",
    },
    {
        "title": "【EA】フィナンシャル・エイド申請締切",
        "date": "2026-11-08",
        "category": "document",
        "status": "upcoming",
        "description": "EAサイクルでの締切（目安：出願締切の1週間後）。CSS Profile送信＋財務ポータルの追加質問票記入＋所得証明書・残高証明書提出。",
    },
    {
        "title": "【EA】合否結果発表",
        "date": "2026-12-15",
        "category": "application",
        "status": "upcoming",
        "description": "Early Action 合否通知。合格の場合は2027年5月1日までに入学意思決定（$500デポジット）。",
    },
    # ── Regular Decision I ────────────────────────────────────────
    {
        "title": "【RD I】Regular Decision 第1回 出願締切",
        "date": "2027-01-13",
        "category": "application",
        "status": "upcoming",
        "description": "日本の大学受験（一般選抜）との併願に最も親和性が高いサイクル。拘束力なし（Non-binding）。",
    },
    {
        "title": "【RD I】フィナンシャル・エイド申請締切",
        "date": "2027-01-20",
        "category": "document",
        "status": "upcoming",
        "description": "RD Iサイクルでのフィナンシャル・エイド申請期限（目安：出願締切の1週間後）。",
    },
    {
        "title": "【RD I】合否結果発表",
        "date": "2027-03-05",
        "category": "application",
        "status": "upcoming",
        "description": "Regular Decision 第1回 合否通知（目安：3月上旬）。",
    },
    # ── Regular Decision II ───────────────────────────────────────
    {
        "title": "【RD II】Regular Decision 第2回 出願締切",
        "date": "2027-02-24",
        "category": "application",
        "status": "upcoming",
        "description": "全世界からの出願者が最も集中するメインの窓口。拘束力なし（Non-binding）。",
    },
    {
        "title": "【RD II】フィナンシャル・エイド申請締切",
        "date": "2027-03-03",
        "category": "document",
        "status": "upcoming",
        "description": "RD IIサイクルでのフィナンシャル・エイド申請期限（目安：出願締切の1週間後）。",
    },
    {
        "title": "【RD II】合否結果発表",
        "date": "2027-04-15",
        "category": "application",
        "status": "upcoming",
        "description": "Regular Decision 第2回 合否通知（目安：4月中旬）。",
    },
    # ── Extended Decision ─────────────────────────────────────────
    {
        "title": "【ED】Extended Decision 出願締切",
        "date": "2027-04-07",
        "category": "application",
        "status": "upcoming",
        "description": "最終サイクル。席の空き状況次第。注意：このサイクルではフィナンシャル・エイド（奨学金）の申請が一切できない。",
    },
    {
        "title": "【ED】合否結果発表",
        "date": "2027-04-25",
        "category": "application",
        "status": "upcoming",
        "description": "Extended Decision 合否通知（目安：4月下旬）。",
    },
    # ── 最終手続き ────────────────────────────────────────────────
    {
        "title": "入学意思決定期限（全サイクル共通）",
        "date": "2027-05-01",
        "category": "application",
        "status": "upcoming",
        "description": "すべての選考サイクルを通じた共通の入学確定期限。$500の入学デポジットを支払い、進学を正式確定する。",
    },
    {
        "title": "ギャップイヤー申請期限",
        "date": "2027-06-15",
        "category": "document",
        "status": "upcoming",
        "description": "入学延期を希望する場合は一度入学手続きを完了後、enroll@minerva.edu に請願書を提出。他大学に籍を置かない証明が必要。",
    },
]


GOALS = [
    # 2026年
    {
        "title": "全Accomplishments の数値化完了",
        "description": "課外活動・プロジェクト実績の定量データ（参加人数・予算・倍率等）をスプレッドシートに整理し、証跡（PDF/URL）を揃える。",
        "month": 6, "year": 2026, "status": "not_started", "progress": 0,
    },
    {
        "title": "英語基礎力強化（TOEFL iBT 100点目標）",
        "description": "多読多聴・英語ディスカッション練習を日課に。目標：TOEFL iBT 90〜100点超 / IELTS 7.0〜7.5以上。",
        "month": 7, "year": 2026, "status": "not_started", "progress": 0,
    },
    {
        "title": "Minerva Challenges 形式慣れ（毎日練習）",
        "description": "6セクション全ての形式を把握し、特にExpression（2分スピーチ）とWriting（15分構成）の練習を毎日実施。",
        "month": 8, "year": 2026, "status": "not_started", "progress": 0,
    },
    {
        "title": "Accomplishments 記述ドラフト完成（3〜4項目）",
        "description": "学校外での自主プロジェクト・課外活動を中心に。定量データ＋証跡URL＋検証者連絡先をすべて揃えた状態にする。",
        "month": 9, "year": 2026, "status": "not_started", "progress": 0,
    },
    {
        "title": "Early Action 出願完了（11月1日締切）",
        "description": "ポータル入力・Challenges受験・Accomplishments記述・成績証明書提出をすべて完了。フィナンシャル・エイド希望者はCSS Profile提出も。",
        "month": 10, "year": 2026, "status": "not_started", "progress": 0,
    },
    {
        "title": "EA 合否発表への準備（RD I 出願も視野に）",
        "description": "12月のEA結果を待ちながら、万一に備えてRD I（1月13日締切）の出願書類も準備済み状態にしておく。",
        "month": 12, "year": 2026, "status": "not_started", "progress": 0,
    },
]


def seed_initial_data():
    db = SessionLocal()
    try:
        if db.query(Milestone).count() == 0:
            for m in MILESTONES:
                db.add(Milestone(**m))
        if db.query(Goal).count() == 0:
            for g in GOALS:
                db.add(Goal(**g))
        db.commit()
        print("Seed data inserted.")
    except Exception as e:
        db.rollback()
        print(f"Seed error: {e}")
    finally:
        db.close()
