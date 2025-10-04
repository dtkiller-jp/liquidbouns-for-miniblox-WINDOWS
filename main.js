const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let userscriptUrl = '';

// 設定ファイルのパス（プロジェクトルートのconfig.json）
const configPath = path.join(__dirname, 'config.json');

// 設定を読み込む
function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(data);
      userscriptUrl = config.userscriptUrl || '';
    }
  } catch (err) {
    console.error('Failed to load config:', err);
  }
}

// 設定を保存する
function saveConfig() {
  try {
    const config = { userscriptUrl };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (err) {
    console.error('Failed to save config:', err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    title: 'Liquidbounce-for-Miniblox',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: false,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  mainWindow.loadURL('https://miniblox.io');

  // タイトルを固定
  mainWindow.on('page-title-updated', (event) => {
    event.preventDefault();
  });

  // F11でフルスクリーン切り替え、F12でDevTools切り替え
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown') {
      if (input.key === 'F11') {
        event.preventDefault();
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
      } else if (input.key === 'F12') {
        event.preventDefault();
        if (mainWindow.webContents.isDevToolsOpened()) {
          mainWindow.webContents.closeDevTools();
        } else {
          mainWindow.webContents.openDevTools({ mode: 'detach' });
        }
      }
    }
  });

  // ナビゲーションエラーをキャッチ
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  // クラッシュ検出
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('========================================');
    console.error('CRASHED!');
    console.error('Reason:', details.reason);
    console.error('Exit code:', details.exitCode);
    console.error('========================================');
  });

  // 応答なし検出
  mainWindow.webContents.on('unresponsive', () => {
    console.error('Page became unresponsive');
  });

  mainWindow.webContents.on('responsive', () => {
    console.log('Page became responsive again');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// userscriptのURLを設定
ipcMain.handle('get-userscript-url', () => {
  return userscriptUrl;
});

ipcMain.handle('set-userscript-url', async (event, url) => {
  userscriptUrl = url;
  saveConfig();
  return { success: true };
});

// クラッシュを防ぐための設定（GPU有効）
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('in-process-gpu');

app.whenReady().then(() => {
  loadConfig();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
