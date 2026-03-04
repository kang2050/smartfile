import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import {
  isElectron,
  getSystemInfo,
  checkOllamaStatus,
  getRecommendedModels,
  analyzeFile as apiAnalyzeFile,
  scanFolder as apiScanFolder,
  renameFile as apiRenameFile,
  selectFolder as apiSelectFolder,
  type FileItem,
  type SystemInfo,
  type ModelConfig,
  type ModelRecommendation,
  type OllamaStatus,
} from "@/lib/smartfile-api";

// ============================================================
// SmartFile Context - 全局状态管理
// ============================================================

interface SmartFileState {
  // 环境
  isDesktop: boolean;
  systemInfo: SystemInfo | null;

  // Ollama
  ollamaStatus: OllamaStatus;
  modelConfig: ModelConfig;
  modelRecommendation: ModelRecommendation | null;
  isOllamaChecking: boolean;

  // 文件
  files: FileItem[];
  selectedFile: FileItem | null;
  currentFolder: string;
  isScanning: boolean;
  isAnalyzing: boolean;
  analysisProgress: { current: number; total: number };

  // 操作
  refreshOllamaStatus: () => Promise<void>;
  setModelConfig: (config: ModelConfig) => void;
  openFolder: () => Promise<void>;
  scanCurrentFolder: (path: string) => Promise<void>;
  analyzeFiles: (fileIds?: string[]) => Promise<void>;
  confirmRename: (fileId: string) => Promise<void>;
  confirmAllRenames: () => Promise<void>;
  skipFile: (fileId: string) => void;
  selectFile: (file: FileItem | null) => void;
  setActiveView: (view: string) => void;
  activeView: string;

  // 演示模式
  loadDemoData: () => void;
}

const SmartFileContext = createContext<SmartFileState | null>(null);

export function useSmartFile() {
  const ctx = useContext(SmartFileContext);
  if (!ctx) throw new Error("useSmartFile must be used within SmartFileProvider");
  return ctx;
}

// 演示用的 mock 文件数据
const DEMO_FILES: FileItem[] = [
  { id: "1", originalName: "IMG_20241215_143022.jpg", path: "/demo/IMG_20241215_143022.jpg", folder: "/demo", size: "4.2 MB", sizeBytes: 4404019, date: "2024-12-15", modifiedDate: "2024-12-15", type: "image", ext: ".jpg", status: "pending", newName: "", confidence: 0, targetFolder: "" },
  { id: "2", originalName: "截屏2024-12-20 18.36.08.png", path: "/demo/截屏2024-12-20 18.36.08.png", folder: "/demo", size: "1.8 MB", sizeBytes: 1887436, date: "2024-12-20", modifiedDate: "2024-12-20", type: "image", ext: ".png", status: "pending", newName: "", confidence: 0, targetFolder: "" },
  { id: "3", originalName: "录音 (3).m4a", path: "/demo/录音 (3).m4a", folder: "/demo", size: "12.5 MB", sizeBytes: 13107200, date: "2024-12-18", modifiedDate: "2024-12-18", type: "audio", ext: ".m4a", status: "pending", newName: "", confidence: 0, targetFolder: "" },
  { id: "4", originalName: "新建文档 (2).docx", path: "/demo/新建文档 (2).docx", folder: "/demo", size: "245 KB", sizeBytes: 250880, date: "2024-12-16", modifiedDate: "2024-12-16", type: "document", ext: ".docx", status: "pending", newName: "", confidence: 0, targetFolder: "" },
  { id: "5", originalName: "WeChat_20241218153421.jpg", path: "/demo/WeChat_20241218153421.jpg", folder: "/demo", size: "3.1 MB", sizeBytes: 3250585, date: "2024-12-18", modifiedDate: "2024-12-18", type: "image", ext: ".jpg", status: "pending", newName: "", confidence: 0, targetFolder: "" },
  { id: "6", originalName: "未命名.pdf", path: "/demo/未命名.pdf", folder: "/demo", size: "2.8 MB", sizeBytes: 2936012, date: "2024-12-19", modifiedDate: "2024-12-19", type: "document", ext: ".pdf", status: "pending", newName: "", confidence: 0, targetFolder: "" },
  { id: "7", originalName: "download (1).png", path: "/demo/download (1).png", folder: "/demo", size: "856 KB", sizeBytes: 876544, date: "2024-12-17", modifiedDate: "2024-12-17", type: "image", ext: ".png", status: "pending", newName: "", confidence: 0, targetFolder: "" },
  { id: "8", originalName: "DSC_0034.NEF.jpg", path: "/demo/DSC_0034.NEF.jpg", folder: "/demo", size: "8.7 MB", sizeBytes: 9122611, date: "2024-12-21", modifiedDate: "2024-12-21", type: "image", ext: ".jpg", status: "pending", newName: "", confidence: 0, targetFolder: "" },
  { id: "9", originalName: "副本_副本_工作簿1.xlsx", path: "/demo/副本_副本_工作簿1.xlsx", folder: "/demo", size: "156 KB", sizeBytes: 159744, date: "2024-12-22", modifiedDate: "2024-12-22", type: "document", ext: ".xlsx", status: "pending", newName: "", confidence: 0, targetFolder: "" },
];

export function SmartFileProvider({ children }: { children: ReactNode }) {
  const [isDesktop] = useState(isElectron);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>({ running: false, models: [] });
  const [modelConfig, setModelConfig] = useState<ModelConfig>({ textModel: "qwen2.5:32b", visionModel: "qwen2.5vl:7b" });
  const [modelRecommendation, setModelRecommendation] = useState<ModelRecommendation | null>(null);
  const [isOllamaChecking, setIsOllamaChecking] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [currentFolder, setCurrentFolder] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 0 });
  const [activeView, setActiveView] = useState("pending");

  // 初始化
  useEffect(() => {
    (async () => {
      const info = await getSystemInfo();
      setSystemInfo(info);
      const rec = await getRecommendedModels();
      setModelRecommendation(rec);
      if (rec.recommendations.textModel) {
        setModelConfig(prev => ({
          ...prev,
          textModel: rec.recommendations.textModel!.name,
          visionModel: rec.recommendations.visionModel?.name || prev.visionModel,
        }));
      }
    })();
  }, []);

  const refreshOllamaStatus = useCallback(async () => {
    setIsOllamaChecking(true);
    try {
      const status = await checkOllamaStatus();
      setOllamaStatus(status);
    } finally {
      setIsOllamaChecking(false);
    }
  }, []);

  // 定期检查 Ollama 状态
  useEffect(() => {
    refreshOllamaStatus();
    const interval = setInterval(refreshOllamaStatus, 10000);
    return () => clearInterval(interval);
  }, [refreshOllamaStatus]);

  const openFolder = useCallback(async () => {
    const folder = await apiSelectFolder();
    if (folder) {
      setCurrentFolder(folder);
      setIsScanning(true);
      try {
        const scannedFiles = await apiScanFolder(folder);
        if (Array.isArray(scannedFiles)) {
          setFiles(scannedFiles);
          setActiveView("pending");
        }
      } finally {
        setIsScanning(false);
      }
    }
  }, []);

  const scanCurrentFolder = useCallback(async (path: string) => {
    setCurrentFolder(path);
    setIsScanning(true);
    try {
      const scannedFiles = await apiScanFolder(path);
      if (Array.isArray(scannedFiles)) {
        setFiles(scannedFiles);
      }
    } finally {
      setIsScanning(false);
    }
  }, []);

  const analyzeFiles = useCallback(async (fileIds?: string[]) => {
    const toAnalyze = fileIds
      ? files.filter(f => fileIds.includes(f.id))
      : files.filter(f => f.status === "pending");

    if (toAnalyze.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisProgress({ current: 0, total: toAnalyze.length });

    // 先将状态设为 analyzing
    setFiles(prev => prev.map(f =>
      toAnalyze.find(a => a.id === f.id) ? { ...f, status: "analyzing" as const } : f
    ));

    for (let i = 0; i < toAnalyze.length; i++) {
      const file = toAnalyze[i];
      try {
        const result = await apiAnalyzeFile(file, modelConfig);
        setFiles(prev => prev.map(f =>
          f.id === file.id ? {
            ...f,
            status: "ready" as const,
            newName: result.newName || f.originalName,
            confidence: result.confidence,
            targetFolder: result.folder,
            summary: result.summary,
            extractedText: result.extractedText,  // 文档提取的原始文本
          } : f
        ));
      } catch {
        setFiles(prev => prev.map(f =>
          f.id === file.id ? { ...f, status: "error" as const } : f
        ));
      }
      setAnalysisProgress({ current: i + 1, total: toAnalyze.length });
    }

    setIsAnalyzing(false);
    setActiveView("ready");
  }, [files, modelConfig]);

  const confirmRename = useCallback(async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file || !file.newName) return;

    if (isDesktop) {
      const result = await apiRenameFile(file.path, file.newName);
      if (result.success) {
        setFiles(prev => prev.map(f =>
          f.id === fileId ? { ...f, status: "done" as const, path: result.newPath || f.path } : f
        ));
      }
    } else {
      // 演示模式直接标记完成
      setFiles(prev => prev.map(f =>
        f.id === fileId ? { ...f, status: "done" as const } : f
      ));
    }
  }, [files, isDesktop]);

  const confirmAllRenames = useCallback(async () => {
    const readyFiles = files.filter(f => f.status === "ready");
    for (const file of readyFiles) {
      await confirmRename(file.id);
    }
  }, [files, confirmRename]);

  const skipFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const selectFile = useCallback((file: FileItem | null) => {
    setSelectedFile(file);
  }, []);

  const loadDemoData = useCallback(() => {
    setFiles(DEMO_FILES);
    setCurrentFolder("~/Downloads");
    setActiveView("pending");
  }, []);

  return (
    <SmartFileContext.Provider value={{
      isDesktop,
      systemInfo,
      ollamaStatus,
      modelConfig,
      modelRecommendation,
      isOllamaChecking,
      files,
      selectedFile,
      currentFolder,
      isScanning,
      isAnalyzing,
      analysisProgress,
      refreshOllamaStatus,
      setModelConfig,
      openFolder,
      scanCurrentFolder,
      analyzeFiles,
      confirmRename,
      confirmAllRenames,
      skipFile,
      selectFile,
      setActiveView,
      activeView,
      loadDemoData,
    }}>
      {children}
    </SmartFileContext.Provider>
  );
}
