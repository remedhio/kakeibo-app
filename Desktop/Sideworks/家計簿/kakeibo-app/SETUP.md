# Supabaseセットアップ手順（詳細版）

## ステップ1: Supabaseプロジェクトの作成

### 1-1. Supabaseアカウントにログイン

1. ブラウザで [https://supabase.com](https://supabase.com) を開く
2. 「Start your project」または「Sign in」をクリック
3. GitHubアカウントまたはメールアドレスでログイン（新規登録の場合はアカウント作成）

### 1-2. 新しいプロジェクトを作成

1. ダッシュボードで「New Project」をクリック
2. 以下の情報を入力：
   - **Organization**: 既存の組織を選択、または新規作成
   - **Name**: プロジェクト名（例: `kakeibo-app`）
   - **Database Password**: データベースのパスワードを設定（**必ずメモしておく**）
   nLLEV0Q7XrkSg0Tu
   - **Region**: 最寄りのリージョンを選択（例: `Northeast Asia (Tokyo)`）
3. 「Create new project」をクリック
4. プロジェクトの作成が完了するまで待つ（1-2分程度）

## ステップ2: APIキーとURLの取得

### 2-1. プロジェクト設定を開く

1. 作成したプロジェクトのダッシュボードに移動
2. 左サイドバーの「Settings」（歯車アイコン）をクリック
3. 「API」をクリック

### 2-2. 必要な情報をコピー

以下の2つの値をコピーします（後で使います）：

1. **Project URL**
   - 「Project URL」セクションに表示されているURL
   - 例: `https://xxxxxxxxxxxxx.supabase.co`

2. **anon public key**
   - 「Project API keys」セクションの「anon」の「public」キー
   - 「Reveal」をクリックして表示
   - 例: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`（長い文字列）

⚠️ **重要**: これらの値は後で環境変数として使用します。

## ステップ3: データベーススキーマの実行

### 3-1. SQL Editorを開く

1. 左サイドバーの「SQL Editor」をクリック
2. 「New query」をクリック（または既存のクエリエディタを使用）

### 3-2. スキーマSQLを実行

1. このプロジェクトの `supabase/schema.sql` ファイルを開く
2. ファイルの内容をすべてコピー
3. SupabaseのSQL Editorに貼り付け
4. 右下の「Run」ボタンをクリック（または `Cmd+Enter` / `Ctrl+Enter`）

### 3-3. 実行結果の確認

- 成功すると「Success. No rows returned」と表示されます
- エラーが表示された場合は、エラーメッセージを確認してください
  - よくあるエラー: 既にテーブルが存在する場合は `already exists` と表示されますが、`if not exists` を使っているので問題ありません

### 3-4. テーブルの確認（オプション）

1. 左サイドバーの「Table Editor」をクリック
2. 以下のテーブルが作成されていることを確認：
   - `households`
   - `household_members`
   - `categories`
   - `entries`

## ステップ4: 環境変数の設定

### 4-1. .envファイルを作成

1. `kakeibo-app` ディレクトリに移動
2. `.env` という名前のファイルを作成（先頭のドットを忘れずに）

```bash
cd kakeibo-app
touch .env
```

### 4-2. 環境変数を記述

`.env` ファイルを開き、以下の内容を記述します：

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**実際の値に置き換えてください**:
- `EXPO_PUBLIC_SUPABASE_URL`: ステップ2-2でコピーしたProject URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: ステップ2-2でコピーしたanon public key

### 4-3. ファイルの保存

`.env` ファイルを保存します。

⚠️ **重要**:
- `.env` ファイルはGitにコミットしないでください（既に `.gitignore` に含まれているはずです）
- このファイルには機密情報が含まれています

## ステップ5: 動作確認

### 5-1. アプリを起動

```bash
cd kakeibo-app
npm start
```

### 5-2. サインアップ/ログイン

1. アプリが起動したら、サインイン画面が表示されます
2. 「新規登録」をクリック
3. メールアドレスとパスワードを入力して登録
4. Supabaseの設定でメール確認が必要な場合は、メールを確認してください

### 5-3. 動作確認

- カテゴリを追加できるか確認
- 収支を記録できるか確認
- ダッシュボードで集計が表示されるか確認

## トラブルシューティング

### エラー: "Supabase URL/Anon Key が設定されていません"

- `.env` ファイルが正しい場所（`kakeibo-app` ディレクトリ）にあるか確認
- 環境変数の名前が正しいか確認（`EXPO_PUBLIC_SUPABASE_URL` と `EXPO_PUBLIC_SUPABASE_ANON_KEY`）
- アプリを再起動してみてください

### エラー: "relation does not exist"

- SQL Editorでスキーマが正しく実行されたか確認
- テーブルが作成されているか「Table Editor」で確認

### エラー: "permission denied"

- RLS（Row Level Security）ポリシーが正しく設定されているか確認
- ログインしているか確認

### メール確認が必要な場合

Supabaseのデフォルト設定では、新規登録時にメール確認が必要です。

1. Supabaseダッシュボードの「Authentication」→「Settings」を開く
2. 「Enable email confirmations」の設定を確認
3. 開発中は無効にしても良い（本番環境では有効にすることを推奨）

## 次のステップ

セットアップが完了したら、アプリを使用できます：

- カテゴリを追加して収支を記録
- ダッシュボードで集計を確認
- カレンダー表示で日別の収支を確認
