# 家計簿（kakeibo-app）

個人・家族向けの収支記録アプリです。Web（Expo）を主ターゲットに、収入・支出の記録、月次ダッシュボード、カテゴリ管理を行います。

**スコープ**: ログイン済みユーザーの個人データのみ（`household_id IS NULL`）。`households` / `household_members` テーブルは将来用で、世帯共有・招待は未実装です。

## 5分スタート

### 1. 依存関係

```bash
npm install
```

### 2. 環境変数

プロジェクトルートに `.env` を作成:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Supabase（初回のみ）

1. [Supabase](https://supabase.com) でプロジェクトを作成
2. SQL Editor で `supabase/schema.sql` を実行
3. 続けて `supabase/migrations/20260828150000_harden_grants_and_member_insert.sql` を実行
4. **既存 DB をアップグレードする場合**は `supabase/migrations/20260907140000_merge_duplicate_categories_and_unique.sql` を 1 回実行

詳細は [SETUP.md](SETUP.md)。

### 4. 起動

```bash
npm run web
```

ブラウザで `http://localhost:8081` が開きます。ユーザーは Supabase ダッシュボードから追加し、サインイン画面でログインします（公開新規登録は無効）。

## よく使うコマンド

| コマンド | 説明 |
|---------|------|
| `npm run web` | 開発サーバー（Web） |
| `npm run build` | 本番ビルド（`dist/`） |
| `npm run typecheck` | TypeScript 型チェック |
| `npm test` | ユニットテスト |
| `npm run validate:schema` | `schema.sql` の妥当性チェック |
| `npm run check:env` | ビルド前の環境変数チェック |

## ドキュメント

| ファイル | 内容 |
|---------|------|
| [SETUP.md](SETUP.md) | Supabase 詳細セットアップ |
| [LOCAL_DEV.md](LOCAL_DEV.md) | ローカル開発 |
| [SECURITY.md](SECURITY.md) | 認証・RLS・Redirect URL |
| [WEB_DEPLOY.md](WEB_DEPLOY.md) | Vercel / Netlify デプロイ |
| [MOBILE_SETUP.md](MOBILE_SETUP.md) | Expo Go での確認 |

## 技術スタック

- Expo 54 + React Native Web + Expo Router
- Supabase（Auth + Postgres）
- TanStack React Query
