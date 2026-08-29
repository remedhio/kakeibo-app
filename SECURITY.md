# 認証・セキュリティ設定（個人利用）

このアプリは自分（と家族）専用です。新規登録は無効にし、既存アカウントのログインだけを許可します。

## 今すぐ手動で行うこと

以下はダッシュボード操作が必要なため、リポジトリだけでは完了しません。

### 1. データベースパスワードのローテーション（必須）

`SETUP.md` にデータベースパスワードがコミットされていたため、**パスワードを再発行**してください。Git の履歴にも残っています。

1. [Database Settings](https://supabase.com/dashboard/project/rnycpllyfzndomosxhrb/settings/database) を開く
2. 「Reset database password」で新しいパスワードを発行する
3. 新しいパスワードはパスワードマネージャにだけ保存する（リポジトリには書かない）

### 2. 新規登録を閉じる（必須）

1. [Authentication → Providers → Email](https://supabase.com/dashboard/project/rnycpllyfzndomosxhrb/auth/providers) を開く
2. **Allow new users to sign up** をオフにする
3. パスワードの最低文字数を 8 以上にする
4. Pro プラン以上なら **Leaked password protection** をオンにする  
   参考: [Password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

ユーザーを追加したくなったら、一時的にサインアップをオンにするか、Authentication → Users から招待します。

### 3. Site URL と Redirect URLs（必須）

パスワード再設定メールのリンク先は、アプリが `redirectTo` に渡す URL です。いまの実装では **今開いているサイトの origin + `/reset-password`** になります。

例（本番で「パスワードを忘れた」を押した場合）:

```
https://kakeibo-npgsq2e5v-remedhos-projects.vercel.app/reset-password
```

Supabase は、この URL が **Redirect URLs の許可リストに一致しないとメールリンクを拒否**します。Site URL は、許可リストに載っていないときやメールテンプレートのデフォルト戻り先です。

#### 3-1. 画面を開く

1. [URL Configuration](https://supabase.com/dashboard/project/rnycpllyfzndomosxhrb/auth/url-configuration) を開く  
   （左メニュー Authentication → URL Configuration）
2. 上の **Site URL** と、下の **Redirect URLs** を別々に設定する

#### 3-2. Site URL（1つだけ）

**Site URL** に次をそのまま貼る（末尾スラッシュなし）:

```
https://kakeibo-npgsq2e5v-remedhos-projects.vercel.app
```

Save する。

注意: `kakeibo-npgsq2e5v-...` の `npgsq2e5v` は **そのデプロイ専用の ID** です。Vercel で再デプロイすると URL が変わります。安定した本番ドメイン（Vercel → プロジェクト → Settings → Domains。例: `https://kakeibo-app.vercel.app` やカスタムドメイン）がある場合は、**そちらを Site URL にする**方がよいです。そのときは下の Redirect URLs も、そのドメインに合わせて追加してください。

#### 3-3. Redirect URLs（複数）

**Redirect URLs** に、次を **1行ずつ Add** する。`*` や `**` はそのまま入力する（ワイルドカード）。

| 用途 | 貼る値 |
|------|--------|
| 本番（今回のデプロイ）の再設定画面 | `https://kakeibo-npgsq2e5v-remedhos-projects.vercel.app/reset-password` |
| 今後の Vercel デプロイ・プレビュー（ID が変わっても通す） | `https://kakeibo-*-remedhos-projects.vercel.app/**` |
| ローカル（`npm run web` / `npm start` の既定ポート） | `http://localhost:8081/**` |

任意で足してよいもの:

| 用途 | 貼る値 |
|------|--------|
| ポートが 8081 以外になったとき | `http://localhost:8082/**` |
| 安定本番ドメインがあるとき | `https://（Domainsに出ている本番ホスト）/reset-password` |

Save する。

`**` はパス全体（`/reset-password` 含む）にマッチします。本番だけ exact パス、プレビューはワイルドカード、という分け方です。

#### 3-4. 動きの確認

1. 本番サイトを開く
2. サインイン画面で自分のメールを入れ、「パスワードを忘れた」を押す
3. メールのリンク先が  
   `https://kakeibo-npgsq2e5v-remedhos-projects.vercel.app/reset-password`  
   になっていること
4. リンクを開くと「新しいパスワードを設定」画面になること

リンクを開いてエラーになる場合は、Redirect URLs の行が上表と一字一句同じか（`https`、末尾 `/**`、ホスト名）を確認してください。

### 4. データベース権限の適用

`supabase/migrations/20260828150000_harden_grants_and_member_insert.sql` を SQL Editor で実行するか、Supabase CLI でマイグレーションを適用します。

これで未ログイン（`anon`）はテーブルに触れず、世帯メンバーの自己加入もできなくなります。

### 5. 任意: ログインの Bot 対策

Authentication → Bot and Abuse Protection で CAPTCHA を有効にできます。

## アプリ側で入っている対策

- 公開サインアップ API をクライアントから削除
- ログイン失敗メッセージを一般化（メール有無を漏らさない）
- PKCE + 起動時の `getUser()` によるセッション検証
- ルートの AuthGate（未ログインは `/sign-in`、復旧中は `/reset-password`）
- パスワード再設定フロー
- クエリの `user_id` 絞り込み（RLS に加えて）
- Vercel のセキュリティヘッダ（CSP など）
