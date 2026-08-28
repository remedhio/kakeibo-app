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

### 3. パスワード再設定用 URL（必須）

1. [URL Configuration](https://supabase.com/dashboard/project/rnycpllyfzndomosxhrb/auth/url-configuration) を開く
2. Site URL を本番ドメインにする（例: `https://your-domain.com`）
3. Redirect URLs に次を追加する
   - `https://your-domain.com/**`
   - `https://your-project.vercel.app/**`（プレビュー）
   - `http://localhost:8081/**`（ローカル）

再設定メールのリンクは `/reset-password` に戻ります。

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
