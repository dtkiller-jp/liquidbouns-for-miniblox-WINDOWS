const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const os = require('os');

let mainWindow;
let userscriptUrl = '';

// 設定ファイルのパス（Bootstrapperと共有）
const APP_NAME = 'miniblox-app';
const CONFIG_DIR = path.join(os.homedir(), 'AppData', 'Roaming', APP_NAME);
const configPath = path.join(CONFIG_DIR, 'config.json');

// 設定を読み込む
function loadConfig() {
  try {
    // 設定ディレクトリが存在しない場合は作成
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }

    // 設定ファイルが存在しない場合はデフォルト作成
    if (!fs.existsSync(configPath)) {
      const defaultConfig = {
        userscriptUrl: 'https://raw.githubusercontent.com/progmem-cc/miniblox.impact.client.updatedv2/refs/heads/main/vav4inject.js',
        selectedVersion: 'latest'
      };
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
      userscriptUrl = defaultConfig.userscriptUrl;
    } else {
      const data = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(data);
      userscriptUrl = config.userscriptUrl || '';
    }

    console.log('Config loaded. Userscript URL:', userscriptUrl);
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

// HTTPSリクエストを行う（mainプロセスで実行）
function fetchScript(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    const options = {
      headers: {
        'User-Agent': 'MinibloxClient/1.0'
      }
    };

    client.get(url, options, (res) => {
      // リダイレクト対応
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchScript(res.headers.location).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }

      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    title: 'Miniblox',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      backgroundThrottling: false,
      devTools: true
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

// userscriptをURLから読み込む
ipcMain.handle('load-userscript', async () => {
  try {
    if (userscriptUrl && userscriptUrl !== '' && userscriptUrl !== 'https://example.com/your-script.js') {
      console.log('Loading userscript from URL:', userscriptUrl);
      const content = await fetchScript(userscriptUrl);
      return content;
    }
    return null;
  } catch (err) {
    console.error('Failed to load userscript:', err);
    return null;
  }
});

// userscriptのURLを取得
ipcMain.handle('get-userscript-url', () => {
  return userscriptUrl;
});

// userscriptのURLを設定
ipcMain.handle('set-userscript-url', async (event, url) => {
  userscriptUrl = url;
  saveConfig();
  return { success: true };
});

// GPU設定
if (process.platform === 'win32') {
  app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
}

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
