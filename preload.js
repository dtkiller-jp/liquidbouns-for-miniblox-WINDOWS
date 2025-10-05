const { contextBridge, ipcRenderer } = require('electron');

// 設定用のAPIを公開
contextBridge.exposeInMainWorld('minibloxApp', {
  loadUserscript: () => ipcRenderer.invoke('load-userscript'),
  setUserscriptUrl: (url) => ipcRenderer.invoke('set-userscript-url', url),
  getUserscriptUrl: () => ipcRenderer.invoke('get-userscript-url')
});

// DOMContentLoadedでuserscriptを読み込む
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const scriptContent = await window.minibloxApp.loadUserscript();
    
    if (scriptContent) {
      console.log('Loading userscript from local file');
      
      // Greasemonkey互換APIとスクリプトを注入
      const wrappedScript = `
        (function() {
          window.unsafeWindow = window;
          
          const storage = {
            get: (key, defaultValue) => {
              try {
                const value = localStorage.getItem('gm_' + key);
                return value !== null ? JSON.parse(value) : defaultValue;
              } catch (e) {
                return defaultValue;
              }
            },
            set: (key, value) => {
              try {
                localStorage.setItem('gm_' + key, JSON.stringify(value));
              } catch (e) {
                console.error('GM_setValue error:', e);
              }
            },
            delete: (key) => {
              localStorage.removeItem('gm_' + key);
            },
            list: () => {
              const keys = [];
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('gm_')) {
                  keys.push(key.substring(3));
                }
              }
              return keys;
            }
          };
          
          window.GM_info = {
            script: { name: 'Miniblox Userscript', version: '1.0' },
            scriptMetaStr: '',
            scriptWillUpdate: false,
            version: '4.0'
          };
          
          window.GM_getValue = storage.get;
          window.GM_setValue = storage.set;
          window.GM_deleteValue = storage.delete;
          window.GM_listValues = storage.list;
          window.GM_log = function(...args) {
            console.log('[Userscript]', ...args);
          };
          
          ${scriptContent}
        })();
      `;
      
      const script = document.createElement('script');
      script.textContent = wrappedScript;
      (document.head || document.documentElement).appendChild(script);
      console.log('Userscript injected successfully');
    }
  } catch (err) {
    console.error('Failed to load userscript:', err);
  }
});
