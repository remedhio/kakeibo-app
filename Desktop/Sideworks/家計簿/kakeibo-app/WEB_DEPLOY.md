# Web版デプロイガイド

このアプリをWeb版としてデプロイする手順です。VercelまたはNetlifyを使用して無料でホスティングできます。

## 前提条件

- Node.js がインストールされていること
- Supabase のプロジェクトが作成済みであること
- GitHub アカウント（Vercel/Netlify連携用）

## 環境変数の設定

Web版をデプロイする前に、以下の環境変数を設定する必要があります：

- `EXPO_PUBLIC_SUPABASE_URL`: SupabaseプロジェクトのURL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Supabaseの匿名キー

### ローカル開発環境

プロジェクトルートに `.env` ファイルを作成（既に存在する場合は確認）：

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Vercelでの環境変数設定

1. Vercelダッシュボードにログイン
2. プロジェクトを選択（または新規作成）
3. Settings → Environment Variables に移動
4. 以下の環境変数を追加：
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
5. 各環境（Production, Preview, Development）に適用

### Netlifyでの環境変数設定

1. Netlifyダッシュボードにログイン
2. サイトを選択（または新規作成）
3. Site settings → Environment variables に移動
4. 以下の環境変数を追加：
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## ビルドとデプロイ

### ローカルでビルドを確認

```bash
npm run build:web
```

または直接：

```bash
npx expo export --platform web
```

ビルドが成功すると、`dist` ディレクトリに静的ファイルが生成されます。

ローカルでプレビュー：

```bash
npm run preview:web
```

または：

```bash
npx expo export --platform web && npx serve dist
```

### Vercelにデプロイ

#### 方法1: GitHub連携（推奨）

1. プロジェクトをGitHubにプッシュ
2. [Vercel](https://vercel.com) にログイン
3. "New Project" をクリック
4. GitHubリポジトリを選択
5. 環境変数を設定（上記参照）
6. "Deploy" をクリック

Vercelは自動的に `vercel.json` の設定を読み込みます。

#### 方法2: Vercel CLI

```bash
npm install -g vercel
vercel
```

### Netlifyにデプロイ

#### 方法1: GitHub連携（推奨）

1. プロジェクトをGitHubにプッシュ
2. [Netlify](https://www.netlify.com) にログイン
3. "Add new site" → "Import an existing project"
4. GitHubリポジトリを選択
5. ビルド設定：
   - Build command: `npx expo export --platform web`
   - Publish directory: `dist`
6. 環境変数を設定（上記参照）
7. "Deploy site" をクリック

Netlifyは自動的に `netlify.toml` の設定を読み込みます。

#### 方法2: Netlify CLI

```bash
npm install -g netlify-cli
netlify deploy --prod
```

## カスタムドメインの設定（オプション）

### Vercel

1. プロジェクトの Settings → Domains
2. ドメインを追加
3. DNS設定を案内に従って更新

### Netlify

1. Site settings → Domain management
2. "Add custom domain" をクリック
3. ドメインを入力
4. DNS設定を案内に従って更新

## トラブルシューティング

### ビルドエラー

- Node.jsのバージョンを確認（推奨: 18以上）
- `npm install` を実行して依存関係を再インストール
- `node_modules` と `dist` を削除して再ビルド

### 環境変数が反映されない

- 環境変数名が `EXPO_PUBLIC_` で始まっているか確認
- デプロイ後に再ビルドが必要な場合があります
- ブラウザのキャッシュをクリア

### ルーティングエラー（404）

- `vercel.json` または `netlify.toml` のリダイレクト設定を確認
- SPA（Single Page Application）として正しく設定されているか確認

## Supabase認証設定（重要）

Web版をデプロイする際は、Supabaseの認証設定でリダイレクトURLを追加する必要があります：

1. Supabaseダッシュボードにログイン
2. Authentication → URL Configuration に移動
3. "Redirect URLs" に以下を追加：
   - 本番URL: `https://your-domain.com/**`
   - プレビューURL（Vercelの場合）: `https://your-project.vercel.app/**`
   - ローカル開発: `http://localhost:8081/**`（Expo Webのデフォルトポート）

これにより、Web版での認証フローが正しく動作します。

## セキュリティに関する注意

- SupabaseのRow Level Security (RLS) が正しく設定されているか確認
- 環境変数は公開リポジトリにコミットしない（`.env` は `.gitignore` に含まれている）
- 本番環境では、Supabaseの認証設定を適切に構成
- リダイレクトURLは本番環境のドメインのみを許可（セキュリティのため）

## 参考リンク

- [Expo Web Documentation](https://docs.expo.dev/workflow/web/)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
