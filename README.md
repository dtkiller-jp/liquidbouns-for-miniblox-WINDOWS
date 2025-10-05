# Miniblox Desktop App

Desktop application for miniblox.io built with Electron.

## Setup

```bash
npm install
```

## Run in Development Mode

```bash
npm start
```

## Build Portable Executable

```bash
npm run build:win
```

After building, a single portable `.exe` file will be generated in the `dist` folder.

## Configure Userscript URL

Edit `config.json` in the project root:

```json
{
  "userscriptUrl": "https://example.com/your-script.js"
}
```

The userscript will be automatically loaded when the app starts.

## Features

- Press **F11** to toggle fullscreen mode
- Userscript injection from URL
- Windows installer with desktop shortcut

## Icons

Place your icon files in the `assets` folder:
- `icon.png`: 512x512px or larger recommended
- `icon.ico`: For Windows installer

If no icons are provided, the default Electron icon will be used.

## McAfee/Antivirus Issues

McAfeeやウイルス対策ソフトにブロックされる場合の対処法：

### 方法1: 除外設定（推奨）

1. `add-mcafee-exclusion.bat` を実行して手順を確認
2. McAfeeを開く → 設定 → リアルタイムスキャン → 除外されたファイル
3. 以下のフォルダを追加：
   - プロジェクトの `dist` フォルダ
   - プロジェクトの `node_modules` フォルダ
   - インストール先（例: `C:\Program Files\Miniblox`）

### 方法2: NSISインストーラーを使用

Portable版の代わりにNSISインストーラー版を使用：
```bash
npm run build:win
```

生成される `Miniblox-Setup-1.0.0.exe` を使用してインストールすると、
McAfeeに認識されやすくなります。

### 方法3: Windows Defenderを使用

McAfeeを一時的に無効化し、Windows Defenderを使用することも検討してください。

### アプリケーションの安全性

このアプリケーションは以下のセキュリティ設定を使用しています：
- Context isolation有効
- Web security有効
- Node integration無効
- 最小限のGPU設定のみ

誤検知される理由：
- Electronアプリは一般的に誤検知されやすい
- 新しい実行ファイルは評判スコアが低い
- 外部URLからスクリプトを読み込む機能がある
