# Vercelダッシュボード設定の修正手順

## 現在の問題

ビルドログに「Running "vercel build"」と表示され、`vercel.json`の`buildCommand`が実行されていません。

## 原因

Vercelダッシュボードの設定が`vercel.json`を上書きしている可能性が高いです。

## 解決手順（重要）

### ステップ1: Vercelダッシュボードにアクセス

1. https://vercel.com/dashboard にログイン
2. `kakeibo-app` プロジェクトを選択

### ステップ2: プロジェクト設定を開く

1. **Settings** タブをクリック
2. **General** セクションに移動

### ステップ3: Framework Presetを確認・変更

**Framework Preset**:
- **「Other」を選択**（重要！）
- 「Auto」や他のフレームワークが選択されている場合、`vercel.json`が無視される可能性があります

### ステップ4: Build and Output Settingsを確認・変更

#### Build Command

**オプション1: vercel.jsonを使用する（推奨）**
- **Override** トグルを **OFF** にする
- Build Command フィールドを**空欄**にする
- これにより、`vercel.json`の`buildCommand`が使用されます

**オプション2: ダッシュボードで直接設定**
- **Override** トグルを **ON** にする
- Build Command に `npm run build` を入力
- **重要**: `npm install`は含めない（Vercelが自動実行します）

#### Output Directory

**オプション1: vercel.jsonを使用する（推奨）**
- **Override** トグルを **OFF** にする
- Output Directory フィールドを**空欄**にする
- これにより、`vercel.json`の`outputDirectory`が使用されます

**オプション2: ダッシュボードで直接設定**
- **Override** トグルを **ON** にする
- Output Directory に `dist` を入力

#### Install Command

- **Override** トグルを **OFF** のまま（デフォルトの`npm install`を使用）
- または、空欄のまま

### ステップ5: Root Directoryを確認

- **Root Directory** は**空欄**にする
- 何か設定されている場合は削除
- これにより、プロジェクトルートの`vercel.json`が正しく認識されます

### ステップ6: 保存と再デプロイ

1. ページ下部の **Save** をクリック
2. **Deployments** タブに移動
3. 最新のデプロイの右側の「...」メニューをクリック
4. **Redeploy** を選択
5. **Use existing Build Cache** のチェックを**外す**（重要！）
6. **Redeploy** をクリック

### ステップ7: ビルドログを確認

再デプロイ後、ビルドログで以下を確認：

✅ **正常なビルドログ**:
```
Installing dependencies...
Running "npm run build"
Exporting for web...
✓ Export complete
Build time: 2-5 minutes
```

❌ **問題がある場合（現在の状態）**:
```
Running "vercel build"
Build Completed in /vercel/output [53ms]
```
（この場合は、設定が反映されていません）

## 推奨設定（まとめ）

### ⚠️ 重要: vercel.jsonが無視される場合の対処法

OverrideがOFFでも`vercel.json`が無視される場合があります。その場合は、**ダッシュボードで直接設定する方法**を使用してください。

### 方法1: ダッシュボードで直接設定（推奨・確実）

現在の設定（Override OFF）でも`vercel.json`が無視されている場合は、以下を設定してください：

- Framework Preset: **Other** ✅（既に設定済み）
- Build Command: `npm run build`（**Override を ON にする**）
- Output Directory: `dist`（**Override を ON にする**）
- Install Command: **Override OFF**（空欄のまま）
- Root Directory: **空欄** ✅（既に設定済み）

**手順:**
1. Build Commandの「Override」トグルを**ON**にする
2. Build Commandフィールドに `npm run build` を入力
3. Output Directoryの「Override」トグルを**ON**にする
4. Output Directoryフィールドに `dist` を入力
5. **Save**をクリック
6. 再デプロイ（「Use existing Build Cache」のチェックを外す）

### 方法2: vercel.jsonを使用（試行済み・現在動作していない）

- Framework Preset: **Other** ✅
- Build Command: **Override OFF**（空欄）✅
- Output Directory: **Override OFF**（空欄）✅
- Install Command: **Override OFF**（空欄）
- Root Directory: **空欄** ✅

**注意**: 現在この設定では`vercel.json`が無視されています。方法1を推奨します。

## トラブルシューティング

### それでも解決しない場合

1. **プロジェクトを再作成**:
   - プロジェクトを削除して再インポート
   - 上記の設定を最初から適用

2. **vercel.jsonの構文を確認**:
   ```bash
   # ローカルで確認
   cat vercel.json | jq .
   ```

3. **環境変数を確認**:
   - Settings → Environment Variables
   - `EXPO_PUBLIC_SUPABASE_URL`と`EXPO_PUBLIC_SUPABASE_ANON_KEY`が設定されているか確認

## 確認チェックリスト

- [ ] Framework Presetが「**Other**」になっている
- [ ] Build Commandの「Override」が**OFF**（vercel.jsonを使用）または`npm run build`（Override ON）
- [ ] Output Directoryの「Override」が**OFF**（vercel.jsonを使用）または`dist`（Override ON）
- [ ] **Root Directoryが空欄**になっている
- [ ] 環境変数が設定されている
- [ ] 再デプロイ時に「Use existing Build Cache」のチェックを**外した**
