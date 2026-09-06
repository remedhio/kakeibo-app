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

Vercel はリポジトリ直下の `vercel.json` を読み込みます。ダッシュボード側は次と揃えてください。

| 項目 | 推奨値 |
|------|--------|
| Framework Preset | `Other`（Auto / Next.js などは使わない） |
| Root Directory | 空欄（`package.json` はリポジトリ直下） |
| Build Command | `npm run build`（`npm install` は含めない。Vercel が先に実行する） |
| Output Directory | `dist` |
| Install Command | デフォルトのまま（Override OFF） |

Override を使うなら Build / Output を上表どおりにする。使わないならトグルを OFF にして `vercel.json` に任せる。どちらでも、ダッシュボードと `vercel.json` が食い違うと短いビルド（数十 ms）で終わり 404 になる。

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

以前は Vercel 向けの障害メモが複数ファイルに分かれていた。内容はここに集約した。

### ビルドエラー（ローカル）

- Node.js のバージョンを確認（推奨: 18以上）
- `npm install` を実行して依存関係を再インストール
- `node_modules` と `dist` を削除して再ビルド

### 環境変数が反映されない

- 環境変数名が `EXPO_PUBLIC_` で始まっているか確認
- Production / Preview / Development すべてに入っているか確認
- 変更後は再デプロイが必要。ブラウザキャッシュもクリアする

### ルーティングエラー（404）

- `vercel.json` または `netlify.toml` の SPA rewrite を確認
- ビルドが実際に完了し、`dist` が成果物になっているか確認（次項）

### Vercel のビルドが数十 ms で終わる / `vercel.json` が無視される

ログが次のようなときは、Expo の export が走っていない。

```
Running "vercel build"
Build Completed in /vercel/output [50ms]
```

正常時は数分かかり、`Running "npm run build"` と `Exporting for web...` が出る。

1. Settings → General → Framework Preset を **Other** にする
2. Build Command / Output Directory を上表どおりにするか、Override を OFF にして `vercel.json` を使う
3. Root Directory は空欄（リポジトリ直下に `package.json` がある）
4. Redeploy 時に **Use existing Build Cache を外す**
5. `buildCommand` に `npm install` や `npm ci` を書かない（二重インストールになる）

ダッシュボードの Override は `vercel.json` より優先される。食い違いがあるときは、ダッシュボード側を `npm run build` / `dist` に合わせて Override ON にする方が確実なことがある。

### `package.json` が見つからない

```
npm error path /vercel/path0/package.json
npm error enoent Could not read package.json
```

GitHub リポジトリ直下に `package.json`・`vercel.json`・`app/` があるかを確認する。あるなら Vercel の Root Directory は空欄にする。過去にネストしたディレクトリごと push していた時期があるが、現在のリポジトリはルートがプロジェクト本体である。

### Vercel プロジェクトの再作成（最終手段）

設定を直しても `package.json` が見つからない、またはビルドが走らないときは、プロジェクトを消して GitHub から再インポートする。

1. Settings → General 最下部で Delete Project
2. New Project → `kakeibo-app` を Import
3. Framework Preset: Other、Root Directory: 空欄、Build: `npm run build`、Output: `dist`
4. `EXPO_PUBLIC_SUPABASE_URL` と `EXPO_PUBLIC_SUPABASE_ANON_KEY` を全環境に入れ直す
5. Deploy

## Supabase認証設定（重要）

パスワード再設定メールは `/reset-password` に戻ります。手順と貼る値の詳細は [SECURITY.md](SECURITY.md) の「3. Site URL と Redirect URLs」を見てください。

いまの本番ホストを使う場合の最短設定:

- **Site URL:** `https://kakeibo-npgsq2e5v-remedhos-projects.vercel.app`
- **Redirect URLs:**
  - `https://kakeibo-npgsq2e5v-remedhos-projects.vercel.app/reset-password`
  - `https://kakeibo-*-remedhos-projects.vercel.app/**`（プレビュー・再デプロイ用）
  - `http://localhost:8081/**`

## セキュリティに関する注意

詳細な手順は [SECURITY.md](SECURITY.md) を参照してください。

- 新規登録（Allow new users to sign up）をオフにする
- データベースパスワードをリポジトリに書かない。過去に漏れた場合はローテーションする
- Row Level Security (RLS) と `supabase/migrations/` の権限締め付けを適用する
- 環境変数は公開リポジトリにコミットしない（`.env` は `.gitignore` に含まれている）
- Redirect URLs に本番・プレビュー・ローカルを登録する（パスワード再設定用。パスは `/reset-password`）

## 参考リンク

- [Expo Web Documentation](https://docs.expo.dev/workflow/web/)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
