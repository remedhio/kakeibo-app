# vercel.jsonが無視される理由

## 問題の概要

ビルドログに「Running "vercel build"」と表示され、`vercel.json`の`buildCommand`が実行されていない場合、以下の理由が考えられます。

## 主な理由

### 1. **Vercelダッシュボードの設定が優先される（最も一般的）**

Vercelでは、**ダッシュボードの設定が`vercel.json`より優先されます**。

- Settings → General → Build and Output Settings で「Override」トグルが**ON**になっている場合
- ダッシュボードの設定が`vercel.json`の設定を**上書き**します
- これが最も一般的な原因です

**解決方法:**
- ダッシュボードで「Override」トグルを**OFF**にする
- または、`vercel.json`の設定と一致するようにダッシュボードの設定を変更する

### 2. **Framework Presetの自動検出**

Vercelがプロジェクトのフレームワークを自動検出し、デフォルト設定を適用する場合：

- Framework Presetが「Auto」や特定のフレームワーク（React、Next.jsなど）に設定されている
- 自動検出された設定が`vercel.json`の設定を上書きする

**解決方法:**
- Settings → General → Framework Preset を「**Other**」に設定する
- これにより、Vercelの自動検出を無効化し、カスタム設定を使用できます

### 3. **Root Directoryの設定**

プロジェクトがモノレポやサブディレクトリにある場合：

- Root Directoryが間違って設定されている
- `vercel.json`が正しい場所に配置されていない

**解決方法:**
- Settings → General → Root Directory を確認
- 通常は**空欄**にする（プロジェクトルートが正しい場合）
- `vercel.json`がプロジェクトルートに存在することを確認

### 4. **Vercel CLIのバージョン**

古いバージョンのVercel CLIでは、`vercel.json`が正しく認識されない場合があります。

**解決方法:**
- Vercel CLIを最新版に更新
- または、GitHub連携を使用（Vercelの最新機能が使用される）

### 5. **設定の優先順位**

理論的には、`vercel.json`がダッシュボードの設定を上書きできるはずですが、実際の動作は以下の通りです：

```
優先順位（高い順）:
1. デプロイ時の環境変数やオーバーライド
2. Vercelダッシュボードの設定（Override ONの場合）
3. vercel.jsonの設定
4. デフォルト設定
```

## 現在のvercel.jsonの内容

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**重要**: `buildCommand`に`npm install`を含めないでください。Vercelは自動的に`npm install`を実行するため、二重実行になるとエラーが発生します。

## 解決方法

### 方法1: ダッシュボードの設定を確認・修正（推奨）

1. Vercelダッシュボード → Settings → General
2. **Framework Preset**: 「**Other**」を選択
3. **Build Command**:
   - 「Override」トグルを**OFF**にする（`vercel.json`を使用）
   - または、`npm run build`を設定して「Override」を**ON**にする
   - **注意**: `npm install`は含めないでください（Vercelが自動実行します）
4. **Output Directory**:
   - 「Override」トグルを**OFF**にする（`vercel.json`を使用）
   - または、`dist`を設定して「Override」を**ON**にする
5. **Root Directory**: 空欄（または正しいパス）
6. **Save**をクリック
7. 再デプロイ

### 方法2: vercel.jsonのみを使用

ダッシュボードの設定をすべて削除し、`vercel.json`のみに依存する：

1. Settings → General → Build and Output Settings
2. すべての「Override」トグルを**OFF**にする
3. Build Command、Output Directory、Install Commandを**空欄**にする
4. **Save**をクリック
5. 再デプロイ

### 方法3: ダッシュボードとvercel.jsonを一致させる

`vercel.json`の設定とダッシュボードの設定を**完全に一致**させる：

- ダッシュボード: Build Command = `npm run build`（`npm install`は含めない）
- ダッシュボード: Output Directory = `dist`
- 両方の「Override」トグルを**ON**にする

**重要**: `buildCommand`に`npm install`を含めると、Vercelが既に実行している`npm install`と重複してエラーになります。

## 確認方法

正常に動作している場合、ビルドログには以下が表示されます：

```
Installing dependencies...
Running "npm run build"
Exporting for web...
✓ Export complete
Build time: 2-5 minutes
```

**注意**: Vercelは自動的に`npm install`を実行するため、`buildCommand`には`npm run build`のみを指定します。

問題がある場合（現在の状態）:
```
Running "vercel build"
Build Completed in /vercel/output [54ms]
```

## 重要な注意事項

### buildCommandにnpm installを含めない

**❌ 間違い:**
```json
{
  "buildCommand": "npm install && npm run build"
}
```

**✅ 正しい:**
```json
{
  "buildCommand": "npm run build"
}
```

**理由:**
- Vercelは自動的に`npm install`を実行します
- `buildCommand`に`npm install`を含めると、二重実行になってエラーが発生します
- `buildCommand`にはビルドコマンドのみを指定してください

## まとめ

**`vercel.json`が無視される主な理由:**

1. ✅ **Vercelダッシュボードの設定が優先されている**（最も一般的）
2. ✅ Framework Presetが自動検出されている
3. ✅ Root Directoryが間違っている
4. ✅ Vercel CLIのバージョンが古い

**推奨される解決方法:**

1. Framework Presetを「**Other**」に設定
2. `buildCommand`は`npm run build`のみ（`npm install`は含めない）
3. ダッシュボードの「Override」トグルを**OFF**にして`vercel.json`を使用
4. または、ダッシュボードと`vercel.json`の設定を**完全に一致**させる

## 参考リンク

- [Vercel Project Configuration](https://vercel.com/docs/project-configuration)
- [Vercel Build Settings](https://vercel.com/docs/build-step)
