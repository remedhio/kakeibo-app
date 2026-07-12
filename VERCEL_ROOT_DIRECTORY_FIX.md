# Vercel Root Directory設定の修正手順

## 問題の原因

GitHubリポジトリの構造が以下のようになっています：

```
repository-root/
  Desktop/
    Sideworks/
      家計簿/
        kakeibo-app/
          package.json  ← ここにある
          vercel.json
          ...
```

Vercelはリポジトリのルートで`package.json`を探しますが、実際には`Desktop/Sideworks/家計簿/kakeibo-app/`の中にあります。

## 解決方法

### ステップ1: VercelダッシュボードでRoot Directoryを設定

1. Vercelダッシュボードにアクセス: https://vercel.com/dashboard
2. `kakeibo-app` プロジェクトを選択
3. **Settings** タブをクリック
4. **General** セクションに移動
5. **Root Directory** セクションを探す

### ステップ2: Root Directoryを設定

**Root Directory** フィールドに以下を入力：
```
Desktop/Sideworks/家計簿/kakeibo-app
```

**重要**:
- パスはリポジトリのルートからの相対パスです
- 末尾のスラッシュ（`/`）は不要です

### ステップ3: その他の設定を確認

1. **Framework Preset**: **Other** を選択
2. **Build Command**: `npm run build`（**Override を ON** にする）
3. **Output Directory**: `dist`（**Override を ON** にする）
4. **Install Command**: **Override を OFF** のまま（デフォルト）

### ステップ4: 保存と再デプロイ

1. ページ下部の **Save** をクリック
2. **Deployments** タブに移動
3. 最新のデプロイの右側の「...」メニューをクリック
4. **Redeploy** を選択
5. **Use existing Build Cache** のチェックを**外す**（重要！）
6. **Redeploy** をクリック

### ステップ5: ビルドログを確認

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
npm error path /vercel/path0/package.json
npm error enoent Could not read package.json
```

## 確認チェックリスト

- [ ] Root Directoryに `Desktop/Sideworks/家計簿/kakeibo-app` が設定されている
- [ ] Framework Presetが「Other」になっている
- [ ] Build Commandが`npm run build`（Override ON）になっている
- [ ] Output Directoryが`dist`（Override ON）になっている
- [ ] 環境変数（EXPO_PUBLIC_SUPABASE_URL、EXPO_PUBLIC_SUPABASE_ANON_KEY）が設定されている
- [ ] 再デプロイ時に「Use existing Build Cache」のチェックを外した

## 補足: 理想的なリポジトリ構造

将来的には、GitHubリポジトリのルートを`kakeibo-app`ディレクトリにすることをお勧めします。これにより、Root Directoryの設定が不要になります。

現在の構造:
```
repository-root/
  Desktop/Sideworks/家計簿/kakeibo-app/  ← プロジェクトファイル
```

理想的な構造:
```
repository-root/  (= kakeibo-app/)
  package.json
  vercel.json
  app/
  ...
```

ただし、現在の構造でも上記のRoot Directory設定で動作します。


