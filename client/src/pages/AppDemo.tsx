/*
 * Design: Swiss International Typographic Style x Eastern Whitespace
 * This page simulates the SmartFile macOS desktop application interface
 * Layout: macOS window chrome with sidebar + main content + context panel
 */

import { useState, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen,
  FileText,
  Image,
  Mic,
  Settings,
  Search,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Edit3,
  ArrowLeft,
  Sparkles,
  Upload,
  FolderPlus,
  Clock,
  Tag,
  Filter,
  LayoutGrid,
  List,
  MoreHorizontal,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Home,
  Inbox,
  Archive,
  Trash2,
  HardDrive,
  Brain,
} from "lucide-react";

const EMPTY_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663401715460/PAxdMEPC3ofLmSQt9gdBah/empty-state-MsuPVZBBP8yNBjH9SgrAaK.webp";

// Mock file data
interface FileItem {
  id: string;
  originalName: string;
  newName: string;
  type: "image" | "audio" | "document" | "video";
  size: string;
  date: string;
  status: "pending" | "analyzing" | "ready" | "done" | "error";
  folder: string;
  preview?: string;
  confidence: number;
}

const MOCK_FILES: FileItem[] = [
  {
    id: "1",
    originalName: "IMG_20241215_143022.jpg",
    newName: "2024-12-15_办公室团建合影.jpg",
    type: "image",
    size: "4.2 MB",
    date: "2024-12-15",
    status: "ready",
    folder: "照片/活动",
    confidence: 94,
  },
  {
    id: "2",
    originalName: "截屏2024-12-20 18.36.08.png",
    newName: "2024-12-20_产品原型评审截图.png",
    type: "image",
    size: "1.8 MB",
    date: "2024-12-20",
    status: "ready",
    folder: "工作/设计",
    confidence: 89,
  },
  {
    id: "3",
    originalName: "录音 (3).m4a",
    newName: "2024-12-18_客户需求沟通录音.m4a",
    type: "audio",
    size: "12.5 MB",
    date: "2024-12-18",
    status: "ready",
    folder: "录音/客户",
    confidence: 87,
  },
  {
    id: "4",
    originalName: "新建文档 (2).docx",
    newName: "2024-12-16_Q4季度总结报告.docx",
    type: "document",
    size: "856 KB",
    date: "2024-12-16",
    status: "ready",
    folder: "文档/报告",
    confidence: 92,
  },
  {
    id: "5",
    originalName: "WeChat_20241218153421.jpg",
    newName: "2024-12-18_项目签约现场照片.jpg",
    type: "image",
    size: "3.1 MB",
    date: "2024-12-18",
    status: "ready",
    folder: "照片/工作",
    confidence: 91,
  },
  {
    id: "6",
    originalName: "未命名.pdf",
    newName: "2024-12-19_租房合同扫描件.pdf",
    type: "document",
    size: "2.4 MB",
    date: "2024-12-19",
    status: "analyzing",
    folder: "文档/合同",
    confidence: 0,
  },
  {
    id: "7",
    originalName: "download (1).png",
    newName: "2024-12-17_UI设计稿配色方案.png",
    type: "image",
    size: "567 KB",
    date: "2024-12-17",
    status: "pending",
    folder: "工作/设计",
    confidence: 0,
  },
  {
    id: "9",
    originalName: "DSC_0034.NEF.jpg",
    newName: "",
    type: "image",
    size: "5.6 MB",
    date: "2024-12-21",
    status: "pending",
    folder: "",
    confidence: 0,
  },
  {
    id: "10",
    originalName: "副本_副本_工作簿1.xlsx",
    newName: "",
    type: "document",
    size: "1.2 MB",
    date: "2024-12-22",
    status: "pending",
    folder: "",
    confidence: 0,
  },
  {
    id: "8",
    originalName: "voice_memo_20241220.m4a",
    newName: "2024-12-20_周会讨论记录.m4a",
    type: "audio",
    size: "8.3 MB",
    date: "2024-12-20",
    status: "done",
    folder: "录音/会议",
    confidence: 96,
  },
];

function getFileIcon(type: string) {
  switch (type) {
    case "image": return <Image className="w-4 h-4" strokeWidth={1.5} />;
    case "audio": return <Mic className="w-4 h-4" strokeWidth={1.5} />;
    case "document": return <FileText className="w-4 h-4" strokeWidth={1.5} />;
    default: return <FileText className="w-4 h-4" strokeWidth={1.5} />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded">待处理</span>;
    case "analyzing":
      return (
        <span className="text-[10px] px-1.5 py-0.5 bg-foreground/5 text-foreground/60 rounded flex items-center gap-1">
          <Loader2 className="w-2.5 h-2.5 animate-spin" />
          分析中
        </span>
      );
    case "ready":
      return <span className="text-[10px] px-1.5 py-0.5 bg-foreground/10 text-foreground/80 rounded">待确认</span>;
    case "done":
      return (
        <span className="text-[10px] px-1.5 py-0.5 bg-foreground text-background rounded flex items-center gap-1">
          <Check className="w-2.5 h-2.5" />
          已完成
        </span>
      );
    case "error":
      return (
        <span className="text-[10px] px-1.5 py-0.5 bg-destructive/10 text-destructive rounded flex items-center gap-1">
          <AlertCircle className="w-2.5 h-2.5" />
          失败
        </span>
      );
    default:
      return null;
  }
}

// macOS window traffic lights
function TrafficLights() {
  return (
    <div className="flex items-center gap-2">
      <Link href="/">
        <div className="w-3 h-3 rounded-full bg-[#FF5F57] hover:bg-[#FF5F57]/80 transition-colors group relative flex items-center justify-center">
          <X className="w-2 h-2 text-[#4A0002] opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={3} />
        </div>
      </Link>
      <div className="w-3 h-3 rounded-full bg-[#FEBC2E] hover:bg-[#FEBC2E]/80 transition-colors" />
      <div className="w-3 h-3 rounded-full bg-[#28C840] hover:bg-[#28C840]/80 transition-colors" />
    </div>
  );
}

// Sidebar navigation
function Sidebar({ activeView, onViewChange, files }: { activeView: string; onViewChange: (v: string) => void; files: FileItem[] }) {
  const navItems = [
    { id: "inbox", icon: Inbox, label: "待处理" },
    { id: "analyzing", icon: Brain, label: "AI 分析中" },
    { id: "ready", icon: CheckCircle2, label: "待确认" },
    { id: "archive", icon: Archive, label: "已归档" },
  ];

  const folders = [
    { name: "照片", count: 3 },
    { name: "文档", count: 2 },
    { name: "录音", count: 2 },
    { name: "工作", count: 3 },
  ];

  return (
    <div className="w-[200px] bg-sidebar border-r border-sidebar-border flex flex-col h-full shrink-0">
      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-muted/60 rounded-md">
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[12px] text-muted-foreground">搜索文件...</span>
        </div>
      </div>

      <ScrollArea className="flex-1 px-2">
        {/* Main nav */}
        <div className="py-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors mb-0.5 ${
                activeView === item.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              <span className="flex-1 text-left">{item.label}</span>
              {(() => {
                const statusMap: Record<string, string> = { inbox: "pending", analyzing: "analyzing", ready: "ready", archive: "done" };
                const c = files.filter(f => f.status === statusMap[item.id]).length;
                return c > 0 ? <span className="text-[10px] text-muted-foreground tabular-nums">{c}</span> : null;
              })()}
            </button>
          ))}
        </div>

        <Separator className="my-2" />

        {/* Folders */}
        <div className="py-1">
          <p className="px-2.5 py-1 text-[10px] tracking-[0.08em] uppercase text-muted-foreground font-medium">归档目录</p>
          {folders.map((folder) => (
            <button
              key={folder.name}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors mb-0.5"
              onClick={() => toast("查看归档目录", { description: `打开 ${folder.name} 目录` })}
            >
              <FolderOpen className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              <span className="flex-1 text-left">{folder.name}</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">{folder.count}</span>
            </button>
          ))}
        </div>

        <Separator className="my-2" />

        {/* Quick actions */}
        <div className="py-1">
          <button
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors mb-0.5"
            onClick={() => toast("设置", { description: "设置面板即将上线" })}
          >
            <Settings className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            <span className="flex-1 text-left">设置</span>
          </button>
        </div>
      </ScrollArea>

      {/* Bottom: Storage info */}
      <div className="px-3 py-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <HardDrive className="w-3.5 h-3.5" />
          <span>模型: 1.8 GB / 2 GB</span>
        </div>
      </div>
    </div>
  );
}

// File list item
function FileListItem({
  file,
  isSelected,
  onSelect,
}: {
  file: FileItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onSelect}
      className={`flex items-center gap-3 px-4 py-3 border-b border-border cursor-pointer transition-colors ${
        isSelected ? "bg-foreground/[0.04]" : "hover:bg-muted/50"
      }`}
    >
      {/* File icon */}
      <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
        file.type === "image" ? "bg-foreground/[0.06]" :
        file.type === "audio" ? "bg-foreground/[0.06]" :
        "bg-foreground/[0.06]"
      }`}>
        {getFileIcon(file.type)}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-mono text-muted-foreground truncate">{file.originalName}</p>
        </div>
        {(file.status === "ready" || file.status === "done") && file.newName ? (
          <div className="flex items-center gap-1.5 mt-0.5">
            <ArrowLeft className="w-3 h-3 text-foreground/30 rotate-180" />
            <p className="text-[13px] font-medium truncate">{file.newName}</p>
          </div>
        ) : file.status === "analyzing" ? (
          <div className="flex items-center gap-1.5 mt-0.5">
            <Loader2 className="w-3 h-3 text-foreground/30 animate-spin" />
            <p className="text-[12px] text-muted-foreground italic">正在分析文件内容...</p>
          </div>
        ) : null}
      </div>

      {/* Status */}
      <div className="shrink-0 flex items-center gap-2">
        {file.confidence > 0 && (
          <span className="text-[10px] text-muted-foreground tabular-nums">{file.confidence}%</span>
        )}
        {getStatusBadge(file.status)}
      </div>
    </motion.div>
  );
}

// Detail panel
function DetailPanel({ file }: { file: FileItem | null }) {
  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <img src={EMPTY_IMG} alt="选择文件" className="w-48 h-auto mx-auto mb-4 opacity-60" />
          <p className="text-[13px] text-muted-foreground">选择一个文件查看详情</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[320px] border-l border-border bg-background shrink-0 flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-5">
          {/* File preview placeholder */}
          <div className="aspect-[4/3] bg-muted/50 rounded-lg flex items-center justify-center mb-5 border border-border">
            <div className="text-center">
              {getFileIcon(file.type)}
              <p className="text-[11px] text-muted-foreground mt-2">文件预览</p>
            </div>
          </div>

          {/* Original name */}
          <div className="mb-5">
            <p className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground font-medium mb-1.5">原始文件名</p>
            <p className="text-[13px] font-mono text-muted-foreground break-all">{file.originalName}</p>
          </div>

          {/* New name */}
          {(file.status === "ready" || file.status === "done") && (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground font-medium">AI 建议命名</p>
                <button className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => toast("编辑功能", { description: "可以手动修改文件名" })}>
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
              <p className="text-[13px] font-medium break-all">{file.newName}</p>
            </div>
          )}

          <Separator className="my-4" />

          {/* Metadata */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted-foreground">文件类型</span>
              <span className="text-[12px]">{file.type === "image" ? "图片" : file.type === "audio" ? "音频" : "文档"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted-foreground">文件大小</span>
              <span className="text-[12px]">{file.size}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted-foreground">创建日期</span>
              <span className="text-[12px]">{file.date}</span>
            </div>
            {file.folder && (
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted-foreground">归档目录</span>
                <span className="text-[12px] font-mono">{file.folder}</span>
              </div>
            )}
            {file.confidence > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted-foreground">置信度</span>
                <span className="text-[12px] tabular-nums">{file.confidence}%</span>
              </div>
            )}
          </div>

          {/* AI Analysis Summary */}
          {(file.status === "ready" || file.status === "done") && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-[10px] tracking-[0.08em] uppercase text-muted-foreground font-medium mb-2">AI 分析摘要</p>
                <div className="p-3 bg-muted/40 rounded-md">
                  <p className="text-[12px] leading-[1.6] text-foreground/70">
                    {file.type === "image" ? "识别到图片内容，提取了场景、人物、时间等关键信息用于命名。" :
                     file.type === "audio" ? "转录了音频内容，提取了主题、参与者等关键信息。" :
                     "解析了文档结构，提取了标题、日期、类型等元数据。"}
                  </p>
                </div>
              </div>
            </>
          )}

          {file.status === "ready" && (
            <>
              <Separator className="my-4" />
              <div className="space-y-2">
                <Button
                  size="sm"
                  className="w-full h-8 text-[12px] gap-1.5"
                  onClick={() => toast("已确认重命名", { description: `${file.originalName} → ${file.newName}` })}
                >
                  <Check className="w-3 h-3" />
                  确认重命名
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-[12px] gap-1.5 border-foreground/10"
                  onClick={() => toast("已跳过", { description: "此文件将保持原名" })}
                >
                  <X className="w-3 h-3" />
                  跳过
                </Button>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default function AppDemo() {
  const [activeView, setActiveView] = useState("ready");
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [files, setFiles] = useState(MOCK_FILES);
  const [isProcessing, setIsProcessing] = useState(false);

  // Clear selection when switching views
  useEffect(() => {
    setSelectedFile(null);
  }, [activeView]);
  const [progress, setProgress] = useState(0);

  // Filter files based on active view
  const filteredFiles = files.filter((f) => {
    switch (activeView) {
      case "inbox": return f.status === "pending";
      case "analyzing": return f.status === "analyzing";
      case "ready": return f.status === "ready";
      case "archive": return f.status === "done";
      default: return true;
    }
  });

  const handleProcessAll = useCallback(() => {
    setIsProcessing(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          toast("全部处理完成", { description: "所有文件已成功重命名并归档" });
          setFiles((prev) =>
            prev.map((f) => (f.status === "ready" ? { ...f, status: "done" as const } : f))
          );
          return 100;
        }
        return prev + 2;
      });
    }, 60);
  }, []);

  const viewTitle = {
    inbox: "待处理",
    analyzing: "AI 分析中",
    ready: "待确认",
    archive: "已归档",
  }[activeView] || "所有文件";

  return (
    <div className="h-screen w-screen bg-background flex flex-col overflow-hidden">
      {/* macOS Title Bar */}
      <div className="h-12 bg-sidebar border-b border-border flex items-center px-4 shrink-0 gap-4">
        <TrafficLights />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-foreground rounded flex items-center justify-center">
              <FolderOpen className="w-3 h-3 text-background" strokeWidth={1.5} />
            </div>
            <span className="text-[13px] font-medium tracking-[-0.01em]">SmartFile</span>
            <span className="text-[11px] text-muted-foreground">— ~/Downloads</span>
          </div>
        </div>
        <div className="w-[52px]" /> {/* Balance traffic lights */}
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar activeView={activeView} onViewChange={setActiveView} files={files} />

        {/* File list */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="h-11 border-b border-border flex items-center px-4 gap-3 shrink-0">
            <h2 className="text-[13px] font-medium">{viewTitle}</h2>
            <span className="text-[11px] text-muted-foreground tabular-nums">{filteredFiles.length} 个文件</span>
            <div className="flex-1" />

            {/* View toggle */}
            <div className="flex items-center border border-border rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 transition-colors ${viewMode === "list" ? "bg-foreground/[0.06]" : "hover:bg-muted/50"}`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-foreground/[0.06]" : "hover:bg-muted/50"}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeView === "ready" && filteredFiles.length > 0 && (
              <Button
                size="sm"
                className="h-7 text-[11px] px-3 gap-1.5"
                onClick={handleProcessAll}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                全部确认
              </Button>
            )}

            {activeView === "inbox" && filteredFiles.length > 0 && (
              <Button
                size="sm"
                className="h-7 text-[11px] px-3 gap-1.5"
                onClick={() => {
                  toast("开始 AI 分析", { description: "正在分析所有待处理文件..." });
                  setFiles(prev => prev.map(f => f.status === "pending" ? { ...f, status: "analyzing" as const } : f));
                  setTimeout(() => {
                    setFiles(prev => prev.map(f => {
                    if (f.status !== "analyzing") return f;
                    const nameMap: Record<string, string> = {
                      "download (1).png": "2024-12-17_UI设计稿配色方案.png",
                      "DSC_0034.NEF.jpg": "2024-12-21_周末公园户外写真.jpg",
                      "副本_副本_工作簿1.xlsx": "2024-12-22_Q4营收数据汇总表.xlsx",
                      "未命名.pdf": "2024-12-19_租房合同扫描件.pdf",
                    };
                    return { ...f, status: "ready" as const, confidence: Math.floor(Math.random() * 10) + 85, newName: nameMap[f.originalName] || f.newName || `${f.date}_智能归档文件.${f.originalName.split('.').pop()}` };
                  }));
                    toast("分析完成", { description: "所有文件已分析完毕，请查看待确认列表" });
                    setActiveView("ready");
                  }, 3000);
                }}
              >
                <Play className="w-3 h-3" />
                开始分析
              </Button>
            )}
          </div>

          {/* Progress bar */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b border-border overflow-hidden"
              >
                <div className="px-4 py-2 flex items-center gap-3">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-foreground/60" />
                  <span className="text-[12px] text-muted-foreground">正在处理...</span>
                  <Progress value={progress} className="flex-1 h-1.5" />
                  <span className="text-[11px] text-muted-foreground tabular-nums">{Math.round(progress)}%</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* File list */}
          <ScrollArea className="flex-1">
            {filteredFiles.length > 0 ? (
              <div>
                {filteredFiles.map((file, i) => (
                  <FileListItem
                    key={file.id}
                    file={file}
                    isSelected={selectedFile?.id === file.id}
                    onSelect={() => setSelectedFile(file)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center">
                  <img src={EMPTY_IMG} alt="无文件" className="w-40 h-auto mx-auto mb-4 opacity-50" />
                  <p className="text-[14px] text-muted-foreground mb-1">暂无文件</p>
                  <p className="text-[12px] text-muted-foreground/60">拖拽文件到此处或点击添加</p>
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Bottom status bar */}
          <div className="h-7 border-t border-border flex items-center px-4 gap-4 shrink-0 bg-muted/30">
            <span className="text-[10px] text-muted-foreground">共 {files.length} 个文件</span>
            <span className="text-[10px] text-muted-foreground">·</span>
            <span className="text-[10px] text-muted-foreground">{files.filter(f => f.status === "done").length} 已完成</span>
            <span className="text-[10px] text-muted-foreground">·</span>
            <span className="text-[10px] text-muted-foreground">{files.filter(f => f.status === "ready").length} 待确认</span>
            <div className="flex-1" />
            <span className="text-[10px] text-muted-foreground">模型: SmartFile-v3-mini</span>
          </div>
        </div>

        {/* Detail panel */}
        <DetailPanel file={selectedFile} />
      </div>
    </div>
  );
}
