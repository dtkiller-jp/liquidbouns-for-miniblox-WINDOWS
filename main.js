const { app, BrowserWindow, ipcMain, dialog } = require('electron');
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
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  mainWindow.loadURL('https://miniblox.io');

  // F11でフルスクリーン切り替え
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11' && input.type === 'keyDown') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });

  // 開発者ツール（必要に応じてコメントアウト）
  // mainWindow.webContents.openDevTools();

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
