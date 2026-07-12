# package.jsonが見つからないエラーの解決方法

## エラー内容

```
npm error path /vercel/path0/package.json
npm error enoent Could not read package.json
Error: Command "npm run build" exited with 254
```

## 原因

Vercelが間違ったディレクトリでビルドを実行しようとしています。これは以下の理由が考えられます：

1. **GitHubリポジトリの構造が期待と異なる**
   - リポジトリのルートに`package.json`がない
   - `package.json`がサブディレクトリにある

2. **Root Directoryの設定が間違っている**
   - Root Directoryが空欄だが、実際にはサブディレクトリを指定する必要がある
   - または、Root Directoryが設定されているが、間違ったパスになっている

## 解決方法

### ステップ1: GitHubリポジトリの構造を確認

1. GitHubでリポジトリを開く: https://github.com/remedhio/kakeibo-app
2. リポジトリのルート（最初のページ）を確認
3. `package.json`が表示されているか確認

**確認ポイント:**
- ✅ リポジトリのルートに`package.json`がある → Root Directoryは空欄でOK
- ❌ リポジトリのルートに`package.json`がない → Root Directoryを設定する必要がある

### ステップ2: リポジトリ構造に応じた設定

#### ケース1: リポジトリのルートにpackage.jsonがある場合

**Vercelダッシュボードの設定:**
- Root Directory: **空欄**（何も設定しない）
- Framework Preset: **Other**
- Build Command: `npm run build`（Override ON）
- Output Directory: `dist`（Override ON）

#### ケース2: リポジトリのルートにpackage.jsonがない場合

もしリポジトリの構造が以下のようになっている場合：
```
repository-root/
  kakeibo-app/
    package.json
    vercel.json
    ...
```

**Vercelダッシュボードの設定:**
- Root Directory: **`kakeibo-app`** を設定
- Framework Preset: **Other**
- Build Command: `npm run build`（Override ON）
- Output Directory: `dist`（Override ON）

### ステップ3: 設定を適用

1. Vercelダッシュボード → Settings → General
2. **Root Directory** セクションを確認・設定
   - リポジトリのルートに`package.json`がある場合: **空欄**
   - リポジトリのルートに`package.json`がない場合: **`kakeibo-app`** を設定
3. **Framework Preset**: **Other**
4. **Build Command**: `npm run build`（**Override ON**）
5. **Output Directory**: `dist`（**Override ON**）
6. **Save**をクリック
7. 再デプロイ（「Use existing Build Cache」のチェックを外す）

### ステップ4: ビルドログを確認

正常なビルドログ:
```
Installing dependencies...
Running "npm run build"
Exporting for web...
✓ Export complete
```

## トラブルシューティング

### それでも解決しない場合

#### 方法1: プロジェクトを再作成

1. Vercelダッシュボードでプロジェクトを削除
2. 「New Project」をクリック
3. GitHubリポジトリ `kakeibo-app` を選択
4. **Root Directory**を正しく設定（上記参照）
5. Framework Preset: `Other`
6. Build Command: `npm run build`（Override ON）
7. Output Directory: `dist`（Override ON）
8. 環境変数を設定
9. Deploy

#### 方法2: GitHubリポジトリの構造を確認

もしGitHubリポジトリのルートに`package.json`がない場合、以下のいずれかを実行：

**オプションA: リポジトリを再構成**
- リポジトリのルートに`package.json`を移動
- または、新しいリポジトリを作成して`kakeibo-app`ディレクトリの内容をプッシュ

**オプションB: VercelでRoot Directoryを設定**
- Root Directoryに`kakeibo-app`を設定

## 確認チェックリスト

- [ ] GitHubリポジトリのルートに`package.json`があるか確認
- [ ] Root Directoryが正しく設定されている（空欄または`kakeibo-app`）
- [ ] Framework Presetが「Other」になっている
- [ ] Build Commandが`npm run build`（Override ON）になっている
- [ ] Output Directoryが`dist`（Override ON）になっている
- [ ] 環境変数が設定されている
- [ ] 再デプロイ時に「Use existing Build Cache」のチェックを外した


