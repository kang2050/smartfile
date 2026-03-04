// ============================================================
// SmartFile API Layer
// 统一封装 Electron IPC 和 Web Fallback 的 API 调用
// ============================================================

// 检测是否在 Electron 环境中运行
export const isElectron = typeof window !== "undefined" && !!(window as any).smartfile?.isElectron;

// Ollama REST API base URL (Web 模式直接调用)
const OLLAMA_BASE = "http://localhost:11434";

// ============================================================
// 设置
// ============================================================

export interface AppSettings {
  aiMode: "local" | "api";
  aiProvider: "claude" | "openai" | "deepseek" | "qwen";
  claudeApiKey: string;
  openaiApiKey: string;
  deepseekApiKey: string;
  qwenApiKey: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  aiMode: "local",
  aiProvider: "claude",
  claudeApiKey: "",
  openaiApiKey: "",
  deepseekApiKey: "",
  qwenApiKey: "",
};

export async function getSettings(): Promise<AppSettings> {
  if (isElectron) {
    const saved = await (window as any).smartfile.settings.get();
    return { ...DEFAULT_SETTINGS, ...saved };
  }
  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  if (isElectron) {
    await (window as any).smartfile.settings.save(settings);
  }
}

export async function testApiKey(apiKey: string, provider = "claude"): Promise<{ success: boolean; error?: string }> {
  if (isElectron) {
    return (window as any).smartfile.settings.testApiKey(apiKey, provider);
  }
  return { success: false };
}

// ============================================================
// 类型定义
// ============================================================

export interface SystemInfo {
  platform: string;
  arch: string;
  totalMemGB: number;
  freeMemGB: number;
  cpuModel: string;
  isAppleSilicon: boolean;
  homeDir: string;
  osVersion?: string;
}

export interface FileItem {
  id: string;
  originalName: string;
  path: string;
  folder: string;
  size: string;
  sizeBytes: number;
  date: string;
  modifiedDate: string;
  type: "image" | "audio" | "video" | "document" | "other";
  ext: string;
  status: "pending" | "analyzing" | "ready" | "done" | "error";
  newName: string;
  confidence: number;
  targetFolder: string;
  summary?: string;
  extractedText?: string;  // 文档提取的原始文本
}

export interface ModelInfo {
  name: string;
  size: string;
  quality: string;
  speed: string;
  desc?: string;
  minRAM?: number;
  category?: "text" | "vision";
  modified_at?: string;
  digest?: string;
}

export interface ModelRecommendation {
  recommendations: {
    textModel: ModelInfo | null;
    visionModel: ModelInfo | null;
    reason: string;
  };
  allModels: ModelInfo[];
  systemInfo: { totalMemGB: number; isAppleSilicon: boolean };
}

export interface OllamaStatus {
  running: boolean;
  models: any[];
}

export interface AnalysisResult {
  newName: string | null;
  folder: string;
  confidence: number;
  summary: string;
  extractedText?: string;  // 文档提取的原始文本
  error?: string;
}

export interface ModelConfig {
  textModel: string;
  visionModel: string;
}

// ============================================================
// 系统信息
// ============================================================

export async function getSystemInfo(): Promise<SystemInfo> {
  if (isElectron) {
    return (window as any).smartfile.system.getInfo();
  }
  // Web fallback - 模拟数据
  return {
    platform: "darwin",
    arch: "arm64",
    totalMemGB: 16,
    freeMemGB: 8,
    cpuModel: "Apple M2",
    isAppleSilicon: true,
    homeDir: "/Users/demo",
    osVersion: "15.0",
  };
}

// ============================================================
// 文件系统操作
// ============================================================

export async function selectFolder(): Promise<string | null> {
  if (isElectron) {
    return (window as any).smartfile.fs.selectFolder();
  }
  // Web fallback - 无法选择文件夹
  return null;
}

export async function selectFiles(): Promise<string[]> {
  if (isElectron) {
    return (window as any).smartfile.fs.selectFiles();
  }
  return [];
}

export async function scanFolder(folderPath: string): Promise<FileItem[]> {
  if (isElectron) {
    return (window as any).smartfile.fs.scanFolder(folderPath);
  }
  return [];
}

export async function renameFile(oldPath: string, newName: string): Promise<{ success?: boolean; error?: string; newPath?: string }> {
  if (isElectron) {
    return (window as any).smartfile.fs.renameFile(oldPath, newName);
  }
  return { error: "Web 模式不支持文件操作" };
}

export async function moveFile(sourcePath: string, targetDir: string, newName: string): Promise<{ success?: boolean; error?: string }> {
  if (isElectron) {
    return (window as any).smartfile.fs.moveFile(sourcePath, targetDir, newName);
  }
  return { error: "Web 模式不支持文件操作" };
}

export async function batchRename(operations: { id: string; oldPath: string; newName: string }[]): Promise<{ id: string; success: boolean; newPath?: string; error?: string }[]> {
  if (isElectron) {
    return (window as any).smartfile.fs.batchRename(operations);
  }
  return operations.map(op => ({ id: op.id, success: true }));
}

export async function openInFinder(filePath: string): Promise<void> {
  if (isElectron) {
    return (window as any).smartfile.fs.openInFinder(filePath);
  }
}

// ============================================================
// 菜单事件（Electron 主进程菜单操作）
// ============================================================

export function onMenuAction(channel: string, callback: (...args: any[]) => void) {
  if (isElectron) {
    (window as any).smartfile.onMenuAction(channel, callback);
  }
}

export function removeMenuAction(channel: string) {
  if (isElectron) {
    (window as any).smartfile.removeMenuAction(channel);
  }
}

// ============================================================
// Ollama 模型管理
// ============================================================

export async function checkOllamaStatus(): Promise<OllamaStatus> {
  if (isElectron) {
    return (window as any).smartfile.ollama.checkStatus();
  }
  // Web fallback - 直接调用 Ollama API
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`);
    if (res.ok) {
      const data = await res.json();
      return { running: true, models: data.models || [] };
    }
    return { running: false, models: [] };
  } catch {
    return { running: false, models: [] };
  }
}

export async function listModels(): Promise<any[]> {
  if (isElectron) {
    return (window as any).smartfile.ollama.listModels();
  }
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`);
    if (res.ok) {
      const data = await res.json();
      return data.models || [];
    }
    return [];
  } catch {
    return [];
  }
}

export async function pullModel(modelName: string): Promise<{ success?: boolean; error?: string }> {
  if (isElectron) {
    return (window as any).smartfile.ollama.pullModel(modelName);
  }
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: modelName, stream: false }),
    });
    if (res.ok) return { success: true };
    return { error: "拉取模型失败" };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function deleteModel(modelName: string): Promise<{ success?: boolean; error?: string }> {
  if (isElectron) {
    return (window as any).smartfile.ollama.deleteModel(modelName);
  }
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/delete`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: modelName }),
    });
    return { success: res.ok };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function getRecommendedModels(): Promise<ModelRecommendation> {
  if (isElectron) {
    return (window as any).smartfile.ollama.getRecommendedModels();
  }
  // Web fallback - 模拟 16GB Apple Silicon
  const totalMemGB = 16;
  return {
    recommendations: {
      textModel: { name: "qwen2.5:7b", size: "4.5 GB", quality: "高", speed: "快" },
      visionModel: { name: "qwen2.5vl:3b", size: "2.5 GB", quality: "中等", speed: "快" },
      reason: "演示模式：模拟 16GB Apple Silicon Mac，推荐 7B 文本模型 + 3B 视觉模型。",
    },
    allModels: [
      { category: "text", name: "qwen2.5:0.5b", size: "0.4 GB", minRAM: 4, quality: "基础", speed: "极快", desc: "最轻量，适合低配设备快速处理" },
      { category: "text", name: "qwen2.5:1.5b", size: "1.0 GB", minRAM: 6, quality: "中等", speed: "极快", desc: "轻量高效，日常文件整理够用" },
      { category: "text", name: "qwen2.5:3b", size: "2.0 GB", minRAM: 8, quality: "良好", speed: "快", desc: "均衡之选，推荐 8GB 设备使用" },
      { category: "text", name: "qwen2.5:7b", size: "4.5 GB", minRAM: 12, quality: "高", speed: "快", desc: "高质量分析，推荐 16GB 设备" },
      { category: "text", name: "qwen2.5:14b", size: "9.0 GB", minRAM: 24, quality: "极高", speed: "较快", desc: "专业级分析，需要大内存设备" },
      { category: "text", name: "qwen2.5:32b", size: "20 GB", minRAM: 48, quality: "顶级", speed: "慢", desc: "最高质量，需要 48GB+ 内存" },
      { category: "vision", name: "qwen2.5vl:3b", size: "2.5 GB", minRAM: 8, quality: "中等", speed: "快", desc: "基础图片理解，轻量高效" },
      { category: "vision", name: "qwen2.5vl:7b", size: "5.0 GB", minRAM: 16, quality: "高", speed: "中等", desc: "优秀图片理解，推荐选择" },
    ],
    systemInfo: { totalMemGB, isAppleSilicon: true },
  };
}

// ============================================================
// AI 分析
// ============================================================

export async function analyzeFile(fileInfo: FileItem, modelConfig: ModelConfig): Promise<AnalysisResult> {
  if (isElectron) {
    return (window as any).smartfile.ai.analyzeFile(fileInfo, modelConfig);
  }
  // Web fallback - 模拟分析结果
  return simulateAnalysis(fileInfo);
}

export async function analyzeWithCustomRule(fileInfo: FileItem, rule: string, modelConfig: ModelConfig): Promise<AnalysisResult> {
  if (isElectron) {
    return (window as any).smartfile.ai.analyzeWithCustomRule(fileInfo, rule, modelConfig);
  }
  return simulateAnalysis(fileInfo);
}

// ============================================================
// 模拟分析（Web 演示模式）
// ============================================================

function simulateAnalysis(fileInfo: FileItem): AnalysisResult {
  const nameMap: Record<string, { newName: string; folder: string; summary: string }> = {
    "IMG_20241215_143022.jpg": { newName: "2024-12-15_办公室团建合影.jpg", folder: "照片/活动", summary: "识别到多人合影场景，背景为办公室环境，约8人参与" },
    "截屏2024-12-20 18.36.08.png": { newName: "2024-12-20_产品原型评审截图.png", folder: "工作/设计", summary: "截图内容为产品设计稿评审界面，包含 UI 组件标注" },
    "录音 (3).m4a": { newName: "2024-12-18_客户需求沟通录音.m4a", folder: "录音/客户", summary: "根据文件名和日期推断为第三次客户沟通录音" },
    "新建文档 (2).docx": { newName: "2024-12-16_Q4季度总结报告.docx", folder: "文档/报告", summary: "文档内容为季度工作总结报告，包含业绩数据" },
    "WeChat_20241218153421.jpg": { newName: "2024-12-18_项目签约现场照片.jpg", folder: "照片/工作", summary: "微信图片，识别到签约仪式场景，含公司 Logo" },
    "未命名.pdf": { newName: "2024-12-19_租房合同扫描件.pdf", folder: "文档/合同", summary: "PDF 文档，识别到合同类文件，包含甲乙方信息" },
    "download (1).png": { newName: "2024-12-17_UI设计稿配色方案.png", folder: "工作/设计", summary: "图片内容为 UI 设计配色方案展示，含色值标注" },
    "DSC_0034.NEF.jpg": { newName: "2024-12-21_周末公园户外写真.jpg", folder: "照片/生活", summary: "相机照片，识别到户外公园场景，自然光人像" },
    "副本_副本_工作簿1.xlsx": { newName: "2024-12-22_Q4营收数据汇总表.xlsx", folder: "文档/财务", summary: "Excel 表格，包含多 Sheet 营收数据和图表" },
  };

  const mapped = nameMap[fileInfo.originalName];
  if (mapped) {
    return {
      newName: mapped.newName,
      folder: mapped.folder,
      confidence: Math.floor(Math.random() * 10) + 85,
      summary: mapped.summary,
    };
  }

  return {
    newName: `${fileInfo.date}_${fileInfo.type === "image" ? "图片" : fileInfo.type === "audio" ? "录音" : "文档"}文件${fileInfo.ext}`,
    folder: fileInfo.type === "image" ? "照片" : fileInfo.type === "audio" ? "录音" : "文档",
    confidence: Math.floor(Math.random() * 20) + 60,
    summary: "基于文件元数据进行了基础分析",
  };
}
