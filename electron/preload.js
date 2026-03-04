const { contextBridge, ipcRenderer } = require("electron");

// ============================================================
// SmartFile - Preload Script
// 安全地将 Electron API 暴露给渲染进程
// ============================================================

contextBridge.exposeInMainWorld("smartfile", {
  // 系统信息
  system: {
    getInfo: () => ipcRenderer.invoke("system:getInfo"),
  },

  // 文件系统操作
  fs: {
    selectFolder: () => ipcRenderer.invoke("fs:selectFolder"),
    selectFiles: () => ipcRenderer.invoke("fs:selectFiles"),
    scanFolder: (folderPath) => ipcRenderer.invoke("fs:scanFolder", folderPath),
    readFileBase64: (filePath) => ipcRenderer.invoke("fs:readFileBase64", filePath),
    readFileText: (filePath, maxBytes) => ipcRenderer.invoke("fs:readFileText", filePath, maxBytes),
    renameFile: (oldPath, newName) => ipcRenderer.invoke("fs:renameFile", oldPath, newName),
    moveFile: (sourcePath, targetDir, newName) => ipcRenderer.invoke("fs:moveFile", sourcePath, targetDir, newName),
    batchRename: (operations) => ipcRenderer.invoke("fs:batchRename", operations),
    openInFinder: (filePath) => ipcRenderer.invoke("fs:openInFinder", filePath),
  },

  // Ollama 模型管理
  ollama: {
    checkStatus: () => ipcRenderer.invoke("ollama:checkStatus"),
    listModels: () => ipcRenderer.invoke("ollama:listModels"),
    pullModel: (modelName) => ipcRenderer.invoke("ollama:pullModel", modelName),
    deleteModel: (modelName) => ipcRenderer.invoke("ollama:deleteModel", modelName),
    getRecommendedModels: () => ipcRenderer.invoke("ollama:getRecommendedModels"),
  },

  // AI 分析
  ai: {
    analyzeFile: (fileInfo, modelConfig) => ipcRenderer.invoke("ai:analyzeFile", fileInfo, modelConfig),
    analyzeWithCustomRule: (fileInfo, rule, modelConfig) => ipcRenderer.invoke("ai:analyzeWithCustomRule", fileInfo, rule, modelConfig),
  },

  // 菜单事件监听（从主进程接收菜单操作）
  onMenuAction: (channel, callback) => {
    const validChannels = ["navigate", "open-folder", "start-analysis", "confirm-all"];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },

  // 移除菜单事件监听
  removeMenuAction: (channel) => {
    const validChannels = ["navigate", "open-folder", "start-analysis", "confirm-all"];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    }
  },

  // 平台检测
  platform: process.platform,
  isElectron: true,
});
