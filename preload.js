const { contextBridge, ipcRenderer } = require('electron');

// unsafeWindowをwindowにマッピング（Greasemonkey互換）
window.unsafeWindow = window;

// console.logをオーバーライドしてログを保持
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

// userscriptを注入
ipcRenderer.invoke('get-userscript-url').then(userscriptUrl => {
  if (userscriptUrl && userscriptUrl !== 'https://example.com/your-script.js') {
    console.log('Loading userscript from:', userscriptUrl);
    
    fetch(userscriptUrl)
      .then(response => response.text())
      .then(scriptContent => {
        // unsafeWindowとGM_*関数を定義
        const wrappedScript = `
          (function() {
            window.unsafeWindow = window;
            
            // LocalStorageベースのストレージ
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
                  if (key.startsWith('gm_')) {
                    keys.push(key.substring(3));
                  }
                }
                return keys;
              }
            };
            
            // Greasemonkey互換API
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
            window.GM_xmlhttpRequest = function(details) {
              return fetch(details.url, {
                method: details.method || 'GET',
                headers: details.headers,
                body: details.data
              }).then(response => response.text()).then(text => {
                if (details.onload) details.onload({ responseText: text });
              }).catch(err => {
                if (details.onerror) details.onerror(err);
              });
            };
            
            ${scriptContent}
          })();
        `;
        
        const script = document.createElement('script');
        script.textContent = wrappedScript;
        
        const inject = () => {
          (document.head || document.documentElement).appendChild(script);
          console.log('Userscript injected successfully');
        };
        
        if (document.documentElement) {
          inject();
        } else {
          const observer = new MutationObserver(() => {
            if (document.documentElement) {
              inject();
              observer.disconnect();
            }
          });
          observer.observe(document, { childList: true, subtree: true });
        }
      })
      .catch(err => console.error('Failed to load userscript:', err));
  }
});

// 設定用のAPIを公開
contextBridge.exposeInMainWorld('minibloxApp', {
  setUserscriptUrl: (url) => ipcRenderer.invoke('set-userscript-url', url),
  getUserscriptUrl: () => ipcRenderer.invoke('get-userscript-url')
});
