from database import SessionLocal
from models import Milestone, Goal


MILESTONES = [
    # 2025
    {"title": "ミネルバ大学 研究・情報収集開始", "date": "2025-05-01", "category": "other", "status": "done",
     "description": "ミネルバ大学のカリキュラム、入学要件、在校生ブログなどを徹底リサーチ"},
    {"title": "TOEFL/SAT 準備開始", "date": "2025-06-01", "category": "test", "status": "done",
     "description": "英語力・標準化テストの準備開始（ミネルバはオプショナルだが有利になる）"},
    {"title": "活動リスト・実績の整理", "date": "2025-07-01", "category": "other", "status": "done",
     "description": "課外活動、リーダーシップ経験、プロジェクトをリスト化"},
    {"title": "志望動機エッセイ ブレインストーミング", "date": "2025-07-15", "category": "essay", "status": "done",
     "description": "なぜミネルバか、自分の強みと目標を深掘り"},
    {"title": "ミネルバ大学 出願システム オープン", "date": "2025-08-01", "category": "application", "status": "done",
     "description": "出願ポータルへの登録と必要書類の確認"},
    {"title": "推薦状 依頼", "date": "2025-09-01", "category": "document", "status": "done",
     "description": "先生・メンター2名に推薦状を正式依頼"},
    {"title": "共通願書 (Common App) 作成", "date": "2025-09-15", "category": "application", "status": "done",
     "description": "基本情報・成績・活動リスト入力"},
    {"title": "メインエッセイ 初稿完成", "date": "2025-10-01", "category": "essay", "status": "done",
     "description": "Common App メインエッセイ（650語）初稿"},
    {"title": "補足エッセイ 全稿完成", "date": "2025-10-15", "category": "essay", "status": "done",
     "description": "ミネルバ独自の補足エッセイ完成"},
    {"title": "Early Action I 出願締切", "date": "2025-11-01", "category": "application", "status": "done",
     "description": "第1回アーリーアクション出願締切"},
    {"title": "全出願書類 最終確認・提出", "date": "2025-11-01", "category": "document", "status": "done",
     "description": "成績証明書、推薦状、テストスコア全て揃っているか確認"},
    {"title": "Early Action I 結果発表", "date": "2025-12-15", "category": "application", "status": "done",
     "description": "第1回アーリーアクション 合否結果"},
    # 2026
    {"title": "Early Action II 出願締切", "date": "2026-01-15", "category": "application", "status": "done",
     "description": "第2回アーリーアクション出願締切（EA Iで合格していれば不要）"},
    {"title": "Early Action II 結果発表", "date": "2026-02-15", "category": "application", "status": "done",
     "description": "第2回アーリーアクション 合否結果"},
    {"title": "Regular Decision 出願締切", "date": "2026-03-01", "category": "application", "status": "done",
     "description": "レギュラーデシジョン締切"},
    {"title": "Regular Decision 結果発表", "date": "2026-04-01", "category": "application", "status": "done",
     "description": "レギュラーデシジョン 合否結果"},
    {"title": "入学確認・入学金支払い", "date": "2026-05-01", "category": "application", "status": "done",
     "description": "進学先確定と入学金の支払い"},
    {"title": "ビザ申請準備開始", "date": "2026-05-15", "category": "document", "status": "in_progress",
     "description": "学生ビザ（F-1）の申請書類準備"},
    {"title": "住居・寮の申込", "date": "2026-05-20", "category": "other", "status": "in_progress",
     "description": "San Francisco キャンパスの寮申込"},
    {"title": "健康診断・予防接種記録", "date": "2026-06-01", "category": "document", "status": "upcoming",
     "description": "大学指定の健康診断と予防接種記録の提出"},
    {"title": "ミネルバ オリエンテーション事前課題", "date": "2026-07-01", "category": "other", "status": "upcoming",
     "description": "入学前のオンライン事前学習・課題"},
    {"title": "出発・渡航準備完了", "date": "2026-08-01", "category": "other", "status": "upcoming",
     "description": "パスポート・ビザ・荷物・海外保険全て確認"},
    {"title": "ミネルバ大学 入学・オリエンテーション", "date": "2026-08-20", "category": "other", "status": "upcoming",
     "description": "待望の入学！San Francisco でオリエンテーション開始"},
]

GOALS_2026 = [
    {"title": "ビザ申請完了", "description": "F-1学生ビザの申請を完了し、ビザを受領する", "month": 6, "year": 2026, "status": "not_started", "progress": 20},
    {"title": "英語力最終仕上げ", "description": "TOEFL/IELTSスコアの最終確認と学術英語のブラッシュアップ", "month": 6, "year": 2026, "status": "not_started", "progress": 0},
    {"title": "ミネルバカリキュラム事前研究", "description": "FYS(Foundation Year Seminars)の内容を先読みし予習する", "month": 7, "year": 2026, "status": "not_started", "progress": 0},
    {"title": "渡航準備完了", "description": "パスポート・ビザ・保険・荷物・銀行口座全て準備完了", "month": 7, "year": 2026, "status": "not_started", "progress": 0},
    {"title": "オリエンテーション前課題完了", "description": "ミネルバから送付される入学前課題を全て完了", "month": 8, "year": 2026, "status": "not_started", "progress": 0},
]


def seed_initial_data():
    db = SessionLocal()
    try:
        if db.query(Milestone).count() == 0:
            for m in MILESTONES:
                db.add(Milestone(**m))
        if db.query(Goal).count() == 0:
            for g in GOALS_2026:
                db.add(Goal(**g))
        db.commit()
        print("Seed data inserted.")
    except Exception as e:
        db.rollback()
        print(f"Seed error: {e}")
    finally:
        db.close()
