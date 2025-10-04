# Miniblox Desktop App

miniblox.ioのデスクトップアプリケーション（Electron製）

## セットアップ

```bash
npm install
```

## 開発モードで起動

```bash
npm start
```

## インストーラーをビルド

```bash
npm run build:win
```

ビルド後、`dist`フォルダに`.exe`インストーラーが生成されます。

## UserscriptのURL設定

アプリ起動後、ブラウザのコンソールで以下を実行：

```javascript
// UserscriptのURLを設定
await window.minibloxApp.setUserscriptUrl('https://example.com/your-script.js');

// 設定を確認
await window.minibloxApp.getUserscriptUrl();
```

設定後、アプリを再起動するとuserscriptが自動的に読み込まれます。

## 設定ファイルの場所

- Windows: `%APPDATA%\miniblox-app\config.json`

このファイルを直接編集することもできます：

```json
{
  "userscriptUrl": "https://example.com/your-script.js"
}
```

## アイコンについて

`assets/icon.png`と`assets/icon.ico`を用意してください。
- icon.png: 512x512px以上推奨
- icon.ico: Windowsインストーラー用

アイコンがない場合はデフォルトのElectronアイコンが使用されます。
