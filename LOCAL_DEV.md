# ローカル開発環境のセットアップ

## 前提条件

- Node.js がインストールされていること
- Supabase プロジェクトが作成済みであること
- 環境変数（`.env`ファイル）が設定されていること

## ステップ1: データベーススキーマの適用

### 新規プロジェクト（テーブルがまだない場合）

1. Supabaseダッシュボードにログイン
2. 左サイドバーの「SQL Editor」をクリック
3. `supabase/schema.sql` を実行する（テーブル・`parent_id` / `order` カラム・RLS を含む）
4. 続けて `supabase/migrations/20260828150000_harden_grants_and_member_insert.sql` を実行する

手順の詳細は [SETUP.md](SETUP.md) のステップ3を参照してください。

### 既存プロジェクト（テーブルはあるが権限締めが未適用の場合）

1. SQL Editor で `supabase/migrations/20260828150000_harden_grants_and_member_insert.sql` だけを実行する

詳細は [SECURITY.md](SECURITY.md) を参照。

## ステップ2: 環境変数の確認

プロジェクトルート（`kakeibo-app`ディレクトリ）に`.env`ファイルがあることを確認：

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

`.env`ファイルがない場合は作成してください。

## ステップ3: 依存関係のインストール

```bash
cd kakeibo-app
npm install
```

## ステップ4: ローカル開発サーバーの起動

### Web版で起動（ブラウザで確認）

```bash
npm run web
```

または

```bash
npm start
# その後、ターミナルで `w` キーを押す
```

ブラウザが自動的に開き、`http://localhost:8081` でアプリが表示されます。

### モバイル版で起動（Expo Goアプリを使用）

```bash
npm start
```

ターミナルにQRコードが表示されるので：

- **iOS**: カメラアプリでQRコードをスキャン
- **Android**: Expo GoアプリでQRコードをスキャン

### その他のオプション

```bash
# iOSシミュレーターで起動（Macのみ）
npm run ios

# Androidエミュレーターで起動
npm run android
```

## ステップ5: 動作確認

1. アプリが起動したら、ログイン画面が表示されます
2. 既存のアカウントでログイン
3. **カテゴリ画面**に移動
4. 支出カテゴリを追加する際、親カテゴリ（固定費・変動費・投資）が自動的に作成されていることを確認
5. 親カテゴリを選択してから子カテゴリ（例：食費、外食費、家賃など）を追加
6. **収支画面**に移動
7. 支出を記録する際、親カテゴリ→子カテゴリの順で選択できることを確認

## トラブルシューティング

### エラー: "parent_id" column does not exist

データベースマイグレーションが実行されていません。ステップ1を実行してください。

### エラー: Cannot find module

依存関係がインストールされていません。以下を実行：

```bash
npm install
```

### 環境変数が読み込まれない

`.env`ファイルが正しい場所（`kakeibo-app`ディレクトリ）にあることを確認してください。

### カテゴリが表示されない

1. Supabaseダッシュボードで`categories`テーブルを確認
2. `parent_id`カラムが存在することを確認
3. カテゴリ画面を開いて、親カテゴリが自動的に作成されることを確認

## 開発時の便利なコマンド

```bash
# 開発サーバーを起動
npm start

# Web版で起動
npm run web

# ビルド（Web版）
npm run build:web

# ビルド結果をプレビュー
npm run preview:web
```

## 参考

- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Documentation](https://supabase.com/docs)


