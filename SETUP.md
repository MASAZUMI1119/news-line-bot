# LINE × Claude × Notion タスク管理ボット セットアップガイド

## 1. Notion の準備

### 1-1. Notion インテグレーションを作成
1. https://www.notion.so/my-integrations にアクセス
2. 「新しいインテグレーション」→ 名前を入力（例: TaskBot）
3. **Internal Integration Token** をコピー → `NOTION_API_KEY` に設定

### 1-2. Notion データベースを作成
以下のプロパティを持つデータベースをページに追加：

| プロパティ名 | タイプ | 選択肢 |
|---|---|---|
| 名前 | タイトル | - |
| ステータス | セレクト | 未着手 / 進行中 / 完了 |
| 優先度 | セレクト | 高 / 中 / 低 |
| 期限 | 日付 | - |

### 1-3. データベースをインテグレーションに接続
1. データベースページ右上「...」→「コネクト先」→ 作成したインテグレーションを選択
2. データベースの URL から ID をコピー
   - URL例: `https://www.notion.so/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx?v=...`
   - `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` 部分が `NOTION_DATABASE_ID`

---

## 2. LINE Messaging API の準備

1. https://developers.line.biz/ でチャンネルを作成（Messaging API）
2. **Channel Secret** → `LINE_CHANNEL_SECRET`
3. **Channel Access Token**（長期）→ `LINE_CHANNEL_ACCESS_TOKEN`
4. Webhook URL を設定: `https://<your-domain>/webhook/line`
5. 「Webhookの利用」を ON にする
6. 「応答メッセージ」を OFF、「あいさつメッセージ」は任意

---

## 3. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、各値を設定：

```bash
cp .env.example .env
```

```env
ANTHROPIC_API_KEY=sk-ant-...
LINE_CHANNEL_SECRET=...
LINE_CHANNEL_ACCESS_TOKEN=...
NOTION_API_KEY=secret_...
NOTION_DATABASE_ID=...
DATABASE_URL=sqlite:///./minerva.db
```

---

## 4. 起動

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

外部公開には ngrok などを使用：
```bash
ngrok http 8000
# 表示された https://xxxx.ngrok.io/webhook/line を LINE の Webhook URL に設定
```

---

## 5. 使い方

LINE でボットに以下のメッセージを送信：

| コマンド | 動作 |
|---|---|
| `タスク追加: 企画書作成 期限:2024-12-20 優先度:高` | タスクをNotionに追加 |
| `タスク一覧` | 未完了タスクを一覧表示 |
| `完了: 企画書作成` | タスクを完了に更新 |
| `進行中: 企画書作成` | タスクを進行中に更新 |
| `分析` | Claudeが現状を分析・フィードバック |
| `プラン最適化` | Claudeが最適なスケジュールを提案 |
| `振り返り` | 今日の完了/未完了をAIがレビュー |
| `ヘルプ` | 使い方を表示 |
