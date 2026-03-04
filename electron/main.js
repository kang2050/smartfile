const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { spawn, execSync } = require("child_process");

// 文档解析库
let pdfParse;
let mammoth;
let XLSX;

// 动态导入 ESM 模块
(async () => {
  try {
    pdfParse = require("pdf-parse");
    mammoth = require("mammoth");
    XLSX = require("xlsx");
  } catch (err) {
    console.warn("文档解析库加载失败，某些功能可能不可用", err.message);
  }
})();
// ============================================================
// SmartFile - Electron Main Process
// 基于语义理解的本地资产自动化归档助手
// ============================================================

let mainWindow;
const isDev = process.env.NODE_ENV === "development";

// Ollama 配置
const OLLAMA_BASE_URL = "http://localhost:11434";

// ============================================================
// macOS 原生菜单
// ============================================================

function createMenu() {
  const template = [
    {
      label: "SmartFile",
      submenu: [
        { label: "关于 SmartFile", role: "about" },
        { type: "separator" },
        {
          label: "设置...",
          accelerator: "CmdOrCtrl+,",
          click: () => mainWindow?.webContents.send("navigate", "/settings"),
        },
        { type: "separator" },
        { label: "隐藏 SmartFile", role: "hide" },
        { label: "隐藏其他", role: "hideOthers" },
        { label: "全部显示", role: "unhide" },
        { type: "separator" },
        { label: "退出 SmartFile", role: "quit" },
      ],
    },
    {
      label: "文件",
      submenu: [
        {
          label: "打开文件夹...",
          accelerator: "CmdOrCtrl+O",
          click: () => mainWindow?.webContents.send("open-folder"),
        },
        { type: "separator" },
        {
          label: "开始分析",
          accelerator: "CmdOrCtrl+Return",
          click: () => mainWindow?.webContents.send("start-analysis"),
        },
        {
          label: "全部确认",
          accelerator: "CmdOrCtrl+Shift+Return",
          click: () => mainWindow?.webContents.send("confirm-all"),
        },
        { type: "separator" },
        { label: "关闭窗口", role: "close" },
      ],
    },
    {
      label: "编辑",
      submenu: [
        { label: "撤销", role: "undo" },
        { label: "重做", role: "redo" },
        { type: "separator" },
        { label: "剪切", role: "cut" },
        { label: "复制", role: "copy" },
        { label: "粘贴", role: "paste" },
        { label: "全选", role: "selectAll" },
      ],
    },
    {
      label: "视图",
      submenu: [
        { label: "重新加载", role: "reload" },
        { label: "强制重新加载", role: "forceReload" },
        { type: "separator" },
        { label: "实际大小", role: "resetZoom" },
        { label: "放大", role: "zoomIn" },
        { label: "缩小", role: "zoomOut" },
        { type: "separator" },
        { label: "全屏", role: "togglefullscreen" },
        ...(isDev ? [{ type: "separator" }, { label: "开发者工具", role: "toggleDevTools" }] : []),
      ],
    },
    {
      label: "窗口",
      submenu: [
        { label: "最小化", role: "minimize" },
        { label: "缩放", role: "zoom" },
        { type: "separator" },
        { label: "全部置前", role: "front" },
      ],
    },
    {
      label: "帮助",
      submenu: [
        {
          label: "SmartFile 帮助",
          click: () => shell.openExternal("https://github.com/smartfile/smartfile"),
        },
        {
          label: "Ollama 官网",
          click: () => shell.openExternal("https://ollama.com"),
        },
        {
          label: "通义千问模型",
          click: () => shell.openExternal("https://ollama.com/library/qwen2.5"),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ============================================================
// 窗口创建
// ============================================================

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 18 },
    backgroundColor: "#ffffff",
    show: false, // 等加载完再显示，避免白屏闪烁
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // 加载完成后显示窗口
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:3100/app");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/public/index.html"), {
      hash: "/app",
    });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createMenu();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ============================================================
// IPC Handlers - 系统信息
// ============================================================

ipcMain.handle("system:getInfo", async () => {
  const totalMemGB = Math.round(os.totalmem() / (1024 * 1024 * 1024));
  const freeMemGB = Math.round(os.freemem() / (1024 * 1024 * 1024));
  const cpus = os.cpus();
  const isAppleSilicon =
    cpus[0]?.model?.includes("Apple") || process.arch === "arm64";

  // 尝试获取 macOS 版本
  let osVersion = "";
  try {
    const { execSync } = require("child_process");
    osVersion = execSync("sw_vers -productVersion", { encoding: "utf-8" }).trim();
  } catch {}

  return {
    platform: process.platform,
    arch: process.arch,
    totalMemGB,
    freeMemGB,
    cpuModel: cpus[0]?.model || "Unknown",
    isAppleSilicon,
    homeDir: os.homedir(),
    tempDir: os.tmpdir(),
    osVersion,
  };
});

// ============================================================
// IPC Handlers - 文件系统操作
// ============================================================

ipcMain.handle("fs:selectFolder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "选择要整理的文件夹",
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle("fs:selectFiles", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile", "multiSelections"],
    title: "选择要整理的文件",
  });
  if (result.canceled) return [];
  return result.filePaths;
});

ipcMain.handle("fs:scanFolder", async (event, folderPath) => {
  try {
    const files = [];
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && !entry.name.startsWith(".")) {
        const filePath = path.join(folderPath, entry.name);
        const stats = fs.statSync(filePath);
        const ext = path.extname(entry.name).toLowerCase();

        files.push({
          id: Buffer.from(filePath).toString("base64url"),
          originalName: entry.name,
          path: filePath,
          folder: folderPath,
          size: formatFileSize(stats.size),
          sizeBytes: stats.size,
          date: stats.birthtime.toISOString().split("T")[0],
          modifiedDate: stats.mtime.toISOString().split("T")[0],
          type: getFileType(ext),
          ext: ext,
          status: "pending",
          newName: "",
          confidence: 0,
          targetFolder: "",
        });
      }
    }

    // 按修改时间倒序排列
    files.sort((a, b) => new Date(b.modifiedDate) - new Date(a.modifiedDate));

    return files;
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle("fs:readFileBase64", async (event, filePath) => {
  try {
    const maxSize = 20 * 1024 * 1024; // 最大 20MB
    const stats = fs.statSync(filePath);
    if (stats.size > maxSize) {
      return { error: "文件过大，跳过图片分析" };
    }
    const buffer = fs.readFileSync(filePath);
    return buffer.toString("base64");
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle(
  "fs:readFileText",
  async (event, filePath, maxBytes = 10000) => {
    try {
      const fd = fs.openSync(filePath, "r");
      const buffer = Buffer.alloc(maxBytes);
      const bytesRead = fs.readSync(fd, buffer, 0, maxBytes, 0);
      fs.closeSync(fd);
      return buffer.slice(0, bytesRead).toString("utf-8");
    } catch (err) {
      return { error: err.message };
    }
  }
);

ipcMain.handle("fs:renameFile", async (event, oldPath, newName) => {
  try {
    const dir = path.dirname(oldPath);
    const newPath = path.join(dir, newName);

    // 检查目标文件是否已存在
    if (fs.existsSync(newPath)) {
      // 自动添加序号避免冲突
      const ext = path.extname(newName);
      const base = path.basename(newName, ext);
      let counter = 1;
      let resolvedPath = newPath;
      while (fs.existsSync(resolvedPath)) {
        resolvedPath = path.join(dir, `${base}_${counter}${ext}`);
        counter++;
      }
      fs.renameSync(oldPath, resolvedPath);
      return { success: true, newPath: resolvedPath };
    }

    fs.renameSync(oldPath, newPath);
    return { success: true, newPath };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle(
  "fs:moveFile",
  async (event, sourcePath, targetDir, newName) => {
    try {
      // 确保目标目录存在
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const targetPath = path.join(targetDir, newName);

      // 检查目标文件是否已存在
      if (fs.existsSync(targetPath)) {
        const ext = path.extname(newName);
        const base = path.basename(newName, ext);
        let counter = 1;
        let resolvedPath = targetPath;
        while (fs.existsSync(resolvedPath)) {
          resolvedPath = path.join(targetDir, `${base}_${counter}${ext}`);
          counter++;
        }
        fs.renameSync(sourcePath, resolvedPath);
        return { success: true, newPath: resolvedPath };
      }

      fs.renameSync(sourcePath, targetPath);
      return { success: true, newPath: targetPath };
    } catch (err) {
      return { error: err.message };
    }
  }
);

ipcMain.handle("fs:openInFinder", async (event, filePath) => {
  shell.showItemInFolder(filePath);
});

// ============================================================
// IPC Handlers - Ollama 模型管理
// ============================================================

ipcMain.handle("ollama:checkStatus", async () => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (response.ok) {
      const data = await response.json();
      return { running: true, models: data.models || [] };
    }
    return { running: false, models: [] };
  } catch {
    return { running: false, models: [] };
  }
});

ipcMain.handle("ollama:listModels", async () => {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (response.ok) {
      const data = await response.json();
      return data.models || [];
    }
    return [];
  } catch {
    return [];
  }
});

ipcMain.handle("ollama:pullModel", async (event, modelName) => {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: modelName, stream: false }),
    });

    if (response.ok) {
      return { success: true };
    }
    const errData = await response.json();
    return { error: errData.error || "拉取模型失败" };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle("ollama:deleteModel", async (event, modelName) => {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/delete`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: modelName }),
    });
    return { success: response.ok };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle("ollama:getRecommendedModels", async () => {
  const totalMemGB = Math.round(os.totalmem() / (1024 * 1024 * 1024));
  const isAppleSilicon = process.arch === "arm64";

  const recommendations = {
    textModel: null,
    visionModel: null,
    reason: "",
  };

  if (totalMemGB >= 32) {
    recommendations.textModel = {
      name: "qwen2.5:32b",
      size: "19.0 GB",
      quality: "极高",
      speed: "较快",
    };
    recommendations.visionModel = {
      name: "qwen2.5vl:7b",
      size: "5.0 GB",
      quality: "高",
      speed: "中等",
    };
    recommendations.reason = `您的设备有 ${totalMemGB}GB 内存${isAppleSilicon ? "（Apple Silicon，GPU 加速可用）" : ""}，推荐使用 32B 文本模型 + 7B 视觉模型，可获得极高质量的分析结果。`;
  } else if (totalMemGB >= 16) {
    recommendations.textModel = {
      name: "qwen2.5:7b",
      size: "4.5 GB",
      quality: "高",
      speed: "快",
    };
    recommendations.visionModel = {
      name: "qwen2.5vl:3b",
      size: "2.5 GB",
      quality: "中等",
      speed: "快",
    };
    recommendations.reason = `您的设备有 ${totalMemGB}GB 内存${isAppleSilicon ? "（Apple Silicon，GPU 加速可用）" : ""}，推荐使用 7B 文本模型 + 3B 视觉模型，兼顾质量与速度。`;
  } else if (totalMemGB >= 8) {
    recommendations.textModel = {
      name: "qwen2.5:1.5b",
      size: "1.0 GB",
      quality: "中等",
      speed: "极快",
    };
    recommendations.visionModel = {
      name: "qwen2.5vl:3b",
      size: "2.5 GB",
      quality: "中等",
      speed: "快",
    };
    recommendations.reason = `您的设备有 ${totalMemGB}GB 内存，推荐使用轻量级 1.5B 文本模型 + 3B 视觉模型，确保流畅运行。`;
  } else {
    recommendations.textModel = {
      name: "qwen2.5:0.5b",
      size: "0.4 GB",
      quality: "基础",
      speed: "极快",
    };
    recommendations.visionModel = null;
    recommendations.reason = `您的设备内存较小（${totalMemGB}GB），建议仅使用 0.5B 轻量文本模型。视觉模型可能会导致系统卡顿。`;
  }

  // 所有可选模型列表
  const allModels = [
    {
      category: "text",
      name: "qwen2.5:0.5b",
      size: "0.4 GB",
      minRAM: 4,
      quality: "基础",
      speed: "极快",
      desc: "最轻量，适合低配设备",
    },
    {
      category: "text",
      name: "qwen2.5:1.5b",
      size: "1.0 GB",
      minRAM: 6,
      quality: "中等",
      speed: "极快",
      desc: "轻量高效，日常文件够用",
    },
    {
      category: "text",
      name: "qwen2.5:3b",
      size: "2.0 GB",
      minRAM: 8,
      quality: "良好",
      speed: "快",
      desc: "均衡之选，推荐 8GB 设备",
    },
    {
      category: "text",
      name: "qwen2.5:7b",
      size: "4.5 GB",
      minRAM: 12,
      quality: "高",
      speed: "快",
      desc: "高质量分析，推荐 16GB 设备",
    },
    {
      category: "text",
      name: "qwen2.5:14b",
      size: "9.0 GB",
      minRAM: 24,
      quality: "极高",
      speed: "较快",
      desc: "专业级分析，需要大内存",
    },
    {
      category: "text",
      name: "qwen2.5:32b",
      size: "20 GB",
      minRAM: 48,
      quality: "顶级",
      speed: "慢",
      desc: "最高质量，需要 48GB+ 内存",
    },
    {
      category: "vision",
      name: "qwen2.5vl:3b",
      size: "2.5 GB",
      minRAM: 8,
      quality: "中等",
      speed: "快",
      desc: "基础图片理解，轻量高效",
    },
    {
      category: "vision",
      name: "qwen2.5vl:7b",
      size: "5.0 GB",
      minRAM: 16,
      quality: "高",
      speed: "中等",
      desc: "优秀图片理解，推荐选择",
    },
  ];

  return {
    recommendations,
    allModels,
    systemInfo: { totalMemGB, isAppleSilicon },
  };
});

// ============================================================
// IPC Handlers - AI 分析
// ============================================================

ipcMain.handle("ai:analyzeFile", async (event, fileInfo, modelConfig) => {
  try {
    const { path: filePath, type, originalName, ext, date } = fileInfo;
    const { textModel, visionModel } = modelConfig;

    let analysisResult;

    if (type === "image" && visionModel) {
      // 图片文件 - 使用视觉模型
      const stats = fs.statSync(filePath);
      if (stats.size > 20 * 1024 * 1024) {
        // 超过 20MB 的图片，仅用文件名分析
        analysisResult = await analyzeWithText(
          "",
          originalName,
          date,
          ext,
          textModel
        );
      } else {
        const base64 = fs.readFileSync(filePath).toString("base64");
        analysisResult = await analyzeWithVision(
          base64,
          originalName,
          date,
          visionModel
        );
      }
    } else if (type === "document") {
      // 文档文件 - 读取文本内容
      const textContent = await readDocumentText(filePath, ext);
      analysisResult = await analyzeWithText(
        textContent,
        originalName,
        date,
        ext,
        textModel
      );
    } else if (type === "audio") {
      // 音频文件 - 基于文件名和元数据分析
      analysisResult = await analyzeAudioMeta(
        originalName,
        date,
        ext,
        textModel
      );
    } else {
      // 其他文件 - 基于文件名分析
      analysisResult = await analyzeWithText(
        "",
        originalName,
        date,
        ext,
        textModel
      );
    }

    return analysisResult;
  } catch (err) {
    return {
      newName: null,
      confidence: 0,
      folder: "",
      summary: `分析失败: ${err.message}`,
      error: err.message,
    };
  }
});

ipcMain.handle(
  "ai:analyzeWithCustomRule",
  async (event, fileInfo, rule, modelConfig) => {
    try {
      const { textModel } = modelConfig;
      const prompt = `你是一个文件归档助手。用户定义了以下归档规则：

规则：${rule}

请根据此规则分析以下文件，并给出重命名建议和归档目录：

文件名：${fileInfo.originalName}
文件类型：${fileInfo.type}
文件日期：${fileInfo.date}
文件大小：${fileInfo.size}

请以 JSON 格式返回：
{
  "newName": "建议的新文件名（保留原扩展名）",
  "folder": "建议的归档子目录路径",
  "reason": "命名理由（一句话）"
}

只返回 JSON，不要其他内容。`;

      const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: textModel,
          prompt,
          stream: false,
          format: "json",
        }),
      });

      if (!response.ok) throw new Error("模型调用失败");

      const data = await response.json();
      const result = JSON.parse(data.response);

      return {
        newName: result.newName,
        folder: result.folder || "",
        confidence: 85,
        summary: result.reason || "根据自定义规则分析",
      };
    } catch (err) {
      return { error: err.message };
    }
  }
);

// ============================================================
// IPC Handlers - 批量操作
// ============================================================

ipcMain.handle("fs:batchRename", async (event, operations) => {
  const results = [];
  for (const op of operations) {
    try {
      const dir = path.dirname(op.oldPath);
      let newPath = path.join(dir, op.newName);

      // 处理文件名冲突
      if (fs.existsSync(newPath) && newPath !== op.oldPath) {
        const ext = path.extname(op.newName);
        const base = path.basename(op.newName, ext);
        let counter = 1;
        while (fs.existsSync(newPath)) {
          newPath = path.join(dir, `${base}_${counter}${ext}`);
          counter++;
        }
      }

      fs.renameSync(op.oldPath, newPath);
      results.push({ id: op.id, success: true, newPath });
    } catch (err) {
      results.push({ id: op.id, success: false, error: err.message });
    }
  }
  return results;
});

// ============================================================
// AI 分析辅助函数
// ============================================================

async function analyzeWithVision(base64Image, originalName, date, model) {
  const prompt = `你是一个智能文件归档助手。请分析这张图片的内容，然后为它生成一个语义化的文件名。

原始文件名：${originalName}
文件日期：${date}

命名规则：
1. 格式为：日期_主题描述.扩展名
2. 日期格式：YYYY-MM-DD
3. 主题描述用中文，简洁准确，不超过15个字
4. 如果能识别出具体内容（如会议、合同、截图内容等），请具体描述
5. 保留原始文件扩展名

请以 JSON 格式返回：
{
  "newName": "建议的新文件名",
  "folder": "建议的归档子目录（如：照片/活动、工作/设计、文档/合同等）",
  "summary": "图片内容的一句话描述",
  "confidence": 置信度（0-100的整数）
}

只返回 JSON，不要其他内容。`;

  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      images: [base64Image],
      stream: false,
      format: "json",
    }),
  });

  if (!response.ok) throw new Error("视觉模型调用失败");

  const data = await response.json();
  try {
    const result = JSON.parse(data.response);
    return {
      newName: result.newName,
      folder: result.folder || "未分类",
      confidence: Math.min(100, Math.max(0, result.confidence || 80)),
      summary: result.summary || "图片内容已分析",
    };
  } catch {
    return {
      newName: `${date}_图片文件.${originalName.split(".").pop()}`,
      folder: "照片",
      confidence: 50,
      summary: "模型返回格式异常，使用默认命名",
    };
  }
}

async function analyzeWithText(textContent, originalName, date, ext, model) {
  const contentHint = textContent
    ? `\n\n文件内容摘要（前2000字）：\n${textContent.substring(0, 2000)}`
    : "";

  const prompt = `你是一个智能文件归档助手。请根据以下信息为文件生成语义化的新文件名。

原始文件名：${originalName}
文件日期：${date}
文件类型：${ext}${contentHint}

命名规则：
1. 格式为：日期_主题描述.扩展名
2. 日期格式：YYYY-MM-DD
3. 主题描述用中文，简洁准确，不超过15个字
4. 根据文件名和内容推断文件的实际用途
5. 保留原始文件扩展名

请以 JSON 格式返回：
{
  "newName": "建议的新文件名",
  "folder": "建议的归档子目录（如：文档/报告、文档/合同、工作/设计等）",
  "summary": "文件内容的一句话描述",
  "confidence": 置信度（0-100的整数）
}

只返回 JSON，不要其他内容。`;

  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      format: "json",
    }),
  });

  if (!response.ok) throw new Error("文本模型调用失败");

  const data = await response.json();
  try {
    const result = JSON.parse(data.response);
    return {
      newName: result.newName,
      folder: result.folder || "未分类",
      confidence: Math.min(100, Math.max(0, result.confidence || 75)),
      summary: result.summary || "文件已分析",
      extractedText: textContent ? textContent.substring(0, 3000) : undefined,
    };
  } catch {
    return {
      newName: `${date}_文档文件${ext}`,
      folder: "文档",
      confidence: 40,
      summary: "模型返回格式异常，使用默认命名",
    };
  }
}

async function analyzeAudioMeta(originalName, date, ext, model) {
  const prompt = `你是一个智能文件归档助手。请根据音频文件的文件名推断其内容，并生成语义化的新文件名。

原始文件名：${originalName}
文件日期：${date}
文件类型：音频文件（${ext}）

命名规则：
1. 格式为：日期_主题描述.扩展名
2. 日期格式：YYYY-MM-DD
3. 主题描述用中文，简洁准确
4. 常见音频类型：会议录音、电话录音、语音备忘录、采访录音等
5. 保留原始文件扩展名

请以 JSON 格式返回：
{
  "newName": "建议的新文件名",
  "folder": "建议的归档子目录（如：录音/会议、录音/备忘等）",
  "summary": "对文件用途的推测",
  "confidence": 置信度（0-100的整数）
}

只返回 JSON，不要其他内容。`;

  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      format: "json",
    }),
  });

  if (!response.ok) throw new Error("模型调用失败");

  const data = await response.json();
  try {
    const result = JSON.parse(data.response);
    return {
      newName: result.newName,
      folder: result.folder || "录音",
      confidence: Math.min(100, Math.max(0, result.confidence || 60)),
      summary: result.summary || "音频文件已分析",
    };
  } catch {
    return {
      newName: `${date}_录音文件${ext}`,
      folder: "录音",
      confidence: 35,
      summary: "模型返回格式异常，使用默认命名",
    };
  }
}

async function readDocumentText(filePath, ext) {
  try {
    // 纯文本文件
    const textExts = [
      ".txt", ".md", ".csv", ".json", ".xml", ".html", ".htm", ".log",
      ".yaml", ".yml", ".toml", ".ini", ".cfg", ".conf",
      ".js", ".ts", ".py", ".java", ".c", ".cpp", ".h", ".swift",
      ".go", ".rs", ".rb", ".php", ".sql", ".sh", ".bat", ".ps1",
    ];

    if (textExts.includes(ext)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return content.substring(0, 5000);
    }

    // PDF 文件
    if (ext === ".pdf" && pdfParse) {
      try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        const text = data.text || "";
        return text.substring(0, 5000);
      } catch (err) {
        console.warn("PDF 解析失败:", err.message);
        return "";
      }
    }

    // DOCX 文件
    if (ext === ".docx" && mammoth) {
      try {
        const result = await mammoth.extractRawText({ path: filePath });
        const text = result.value || "";
        return text.substring(0, 5000);
      } catch (err) {
        console.warn("DOCX 解析失败:", err.message);
        return "";
      }
    }

    // XLSX 文件
    if ((ext === ".xlsx" || ext === ".xls") && XLSX) {
      try {
        const workbook = XLSX.readFile(filePath);
        let text = "";
        workbook.SheetNames.forEach((sheetName, idx) => {
          if (idx < 3) {
            // 仅读取前 3 个 Sheet
            const sheet = workbook.Sheets[sheetName];
            const csv = XLSX.utils.sheet_to_csv(sheet);
            text += `Sheet: ${sheetName}\n${csv}\n\n`;
          }
        });
        return text.substring(0, 5000);
      } catch (err) {
        console.warn("XLSX 解析失败:", err.message);
        return "";
      }
    }

    // PPTX 文件 - 需要额外处理，暂时返回空
    if (ext === ".pptx") {
      // TODO: 集成 pptx-parser 或类似库
      return "";
    }

    // RTF 文件 - 需要额外处理
    if (ext === ".rtf") {
      // TODO: 集成 rtf-parser
      return "";
    }

    return "";
  } catch (err) {
    console.warn("文档解析异常:", err.message);
    return "";
  }
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024)
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
}

function getFileType(ext) {
  const imageExts = [
    ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg",
    ".tiff", ".heic", ".heif", ".raw", ".nef", ".cr2", ".ico",
  ];
  const audioExts = [
    ".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg", ".wma", ".aiff",
  ];
  const videoExts = [
    ".mp4", ".mov", ".avi", ".mkv", ".wmv", ".flv", ".webm",
  ];
  const docExts = [
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    ".txt", ".md", ".csv", ".rtf", ".pages", ".numbers", ".key",
    ".json", ".xml", ".html", ".htm",
  ];

  if (imageExts.includes(ext)) return "image";
  if (audioExts.includes(ext)) return "audio";
  if (videoExts.includes(ext)) return "video";
  if (docExts.includes(ext)) return "document";
  return "other";
}
