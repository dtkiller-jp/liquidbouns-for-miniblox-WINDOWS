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
