const { contextBridge, ipcRenderer } = require('electron');

// ページ読み込み時にuserscriptを注入
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const userscriptUrl = await ipcRenderer.invoke('get-userscript-url');
    
    if (userscriptUrl) {
      console.log('Loading userscript from:', userscriptUrl);
      
      // userscriptをfetchして実行
      fetch(userscriptUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.text();
        })
        .then(scriptContent => {
          const script = document.createElement('script');
          script.textContent = scriptContent;
          (document.head || document.documentElement).appendChild(script);
          console.log('Userscript loaded successfully');
        })
        .catch(err => {
          console.error('Failed to load userscript:', err);
        });
    }
  } catch (err) {
    console.error('Error in preload:', err);
  }
});

// 設定用のAPIを公開
contextBridge.exposeInMainWorld('minibloxApp', {
  setUserscriptUrl: (url) => ipcRenderer.invoke('set-userscript-url', url),
  getUserscriptUrl: () => ipcRenderer.invoke('get-userscript-url')
});
