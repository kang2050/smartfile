/*
 * Design: Swiss International Typographic Style x Eastern Whitespace
 * AppDemo - SmartFile 主应用界面
 * Electron 模式：真实文件系统 + Ollama AI
 * Web 模式：演示数据 + 模拟分析
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useSmartFile } from "@/contexts/SmartFileContext";
import {
  FolderOpen,
  Search,
  Clock,
  Brain,
  CheckCircle2,
  Archive,
  Image,
  FileText,
  Mic,
  Briefcase,
  Settings,
  ArrowRight,
  Check,
  X,
  Loader2,
  LayoutList,
  LayoutGrid,
  Sparkles,
  Eye,
  Folder,
  File,
  Video,
  HardDrive,
  Play,
  SkipForward,
} from "lucide-react";

const EMPTY_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663401715460/PAxdMEPC3ofLmSQt9gdBah/empty-state-MsuPVZBBP8yNBjH9SgrAaK.webp";

// ============================================================
// macOS Window Chrome
// ============================================================

function TrafficLights() {
  return (
    <div className="flex items-center gap-2">
      <Link href="/" className="flex items-center">
        <div className="w-3 h-3 rounded-full bg-[#FF5F57] hover:bg-[#FF5F57]/80 transition-colors group relative flex items-center justify-center">
          <X className="w-2 h-2 text-[#4A0002] opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={3} />
        </div>
      </Link>
      <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
      <div className="w-3 h-3 rounded-full bg-[#28C840]" />
    </div>
  );
}

// ============================================================
// File Type Icon
// ============================================================

function FileTypeIcon({ type, className = "w-4 h-4" }: { type: string; className?: string }) {
  switch (type) {
    case "image": return <Image className={className} strokeWidth={1.5} />;
    case "audio": return <Mic className={className} strokeWidth={1.5} />;
    case "video": return <Video className={className} strokeWidth={1.5} />;
    case "document": return <FileText className={className} strokeWidth={1.5} />;
    default: return <File className={className} strokeWidth={1.5} />;
  }
}

// ============================================================
// Status Badge
// ============================================================

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending: { label: "\u5f85\u5904\u7406", className: "text-muted-foreground bg-muted" },
    analyzing: { label: "\u5206\u6790\u4e2d", className: "text-foreground/70 bg-foreground/5" },
    ready: { label: "\u5f85\u786e\u8ba4", className: "text-foreground bg-foreground/10" },
    done: { label: "\u5df2\u5f52\u6863", className: "text-foreground/50 bg-foreground/5" },
    error: { label: "\u5931\u8d25", className: "text-destructive bg-destructive/10" },
  };
  const c = config[status] || config.pending;
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium ${c.className}`}>
      {c.label}
    </span>
  );
}

// ============================================================
// File List Item
// ============================================================

function FileListItem({
  file,
  isSelected,
  onSelect,
  onConfirm,
  onSkip,
}: {
  file: any;
  isSelected: boolean;
  onSelect: () => void;
  onConfirm: () => void;
  onSkip: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`px-4 py-3 border-b border-border/50 cursor-pointer transition-colors ${
        isSelected ? "bg-foreground/[0.03]" : "hover:bg-foreground/[0.015]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-muted-foreground">
          <FileTypeIcon type={file.type} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[12px] font-mono text-muted-foreground truncate">
              {file.originalName}
            </span>
          </div>

          {file.status === "ready" || file.status === "done" ? (
            <div className="flex items-center gap-1.5 mt-1">
              <ArrowRight className="w-3 h-3 text-foreground/40 shrink-0" />
              <span className="text-[13px] font-medium truncate">{file.newName}</span>
            </div>
          ) : file.status === "analyzing" ? (
            <div className="flex items-center gap-1.5 mt-1">
              <Loader2 className="w-3 h-3 animate-spin text-foreground/40" />
              <span className="text-[12px] text-muted-foreground">AI 正在分析...</span>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {file.confidence > 0 && (
            <span className="text-[11px] font-mono text-muted-foreground">{file.confidence}%</span>
          )}
          <StatusBadge status={file.status} />
        </div>
      </div>

      {file.status === "ready" && (
        <div className="flex items-center gap-2 mt-2 ml-7">
          <Button
            size="sm"
            className="h-6 text-[10px] px-2.5 gap-1"
            onClick={(e) => { e.stopPropagation(); onConfirm(); }}
          >
            <Check className="w-2.5 h-2.5" />
            确认
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[10px] px-2.5 gap-1"
            onClick={(e) => { e.stopPropagation(); onSkip(); }}
          >
            <SkipForward className="w-2.5 h-2.5" />
            跳过
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Detail Panel
// ============================================================

function DetailPanel({ file, onConfirm, onSkip }: { file: any; onConfirm: () => void; onSkip: () => void }) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="text-[13px] font-medium mb-1">文件详情</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* Original info */}
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">原始信息</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileTypeIcon type={file.type} className="w-5 h-5 text-muted-foreground" />
                <span className="text-[12px] font-mono break-all">{file.originalName}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-muted-foreground">类型: </span>
                  <span>{file.type === "image" ? "图片" : file.type === "audio" ? "音频" : file.type === "document" ? "文档" : file.type === "video" ? "视频" : "其他"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">大小: </span>
                  <span>{file.size}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">日期: </span>
                  <span>{file.date}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">扩展名: </span>
                  <span className="font-mono">{file.ext}</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Analysis */}
          {(file.status === "ready" || file.status === "done") && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">AI 分析结果</p>
              <div className="p-3 bg-foreground/[0.02] border border-border rounded-md space-y-3">
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">建议名称</p>
                  <p className="text-[13px] font-medium font-mono">{file.newName}</p>
                </div>
                {file.targetFolder && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">归档目录</p>
                    <div className="flex items-center gap-1">
                      <Folder className="w-3 h-3 text-muted-foreground" />
                      <p className="text-[12px] font-mono">{file.targetFolder}</p>
                    </div>
                  </div>
                )}
                {/* Also show folder from old mock data */}
                {!file.targetFolder && file.folder && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">归档目录</p>
                    <div className="flex items-center gap-1">
                      <Folder className="w-3 h-3 text-muted-foreground" />
                      <p className="text-[12px] font-mono">{file.folder}</p>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">置信度</p>
                  <div className="flex items-center gap-2">
                    <Progress value={file.confidence} className="h-1.5 flex-1" />
                    <span className="text-[11px] font-mono">{file.confidence}%</span>
                  </div>
                </div>
                {file.summary && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">内容摘要</p>
                    <div className="bg-foreground/[0.03] border border-border rounded p-2.5 max-h-32 overflow-y-auto">
                      <p className="text-[12px] text-foreground/70 leading-relaxed whitespace-pre-wrap break-words">{file.summary}</p>
                    </div>
                  </div>
                )}
                {file.type === "document" && file.extractedText && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">文档内容预览</p>
                    <div className="bg-foreground/[0.02] border border-border rounded p-2.5 max-h-40 overflow-y-auto font-mono text-[11px] text-foreground/60 leading-relaxed">
                      {file.extractedText.substring(0, 500)}
                      {file.extractedText.length > 500 && <span className="text-muted-foreground">...</span>}
                    </div>
                  </div>
                )}
                {file.type === "document" && file.status === "analyzing" && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">文档提取中</p>
                    <div className="flex items-center gap-2 text-[12px] text-foreground/60">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      正在解析文档内容...
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {file.status === "analyzing" && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">AI 分析中</p>
              <div className="p-4 border border-border rounded-md flex flex-col items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-foreground/40" />
                <p className="text-[12px] text-muted-foreground">正在分析文件内容...</p>
              </div>
            </div>
          )}

          {file.status === "ready" && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">操作</p>
              <div className="space-y-2">
                <Button className="w-full h-8 text-[12px] gap-1.5" onClick={onConfirm}>
                  <Check className="w-3.5 h-3.5" />
                  确认重命名
                </Button>
                <Button variant="outline" className="w-full h-8 text-[12px] gap-1.5" onClick={onSkip}>
                  <SkipForward className="w-3.5 h-3.5" />
                  跳过此文件
                </Button>
              </div>
            </div>
          )}

          {file.status === "done" && (
            <div className="p-3 bg-foreground/[0.02] border border-border rounded-md flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-foreground/50" />
              <span className="text-[12px] text-foreground/60">已完成重命名</span>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================================
// Empty State
// ============================================================

function EmptyState({ view, onOpenFolder, onLoadDemo, isDesktop }: { view: string; onOpenFolder: () => void; onLoadDemo: () => void; isDesktop: boolean }) {
  if (view === "no-files") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
        <img src={EMPTY_IMG} alt="" className="w-32 h-32 object-contain mb-4 opacity-60" />
        <h3 className="text-[14px] font-medium mb-1">选择文件夹开始整理</h3>
        <p className="text-[12px] text-muted-foreground mb-5 max-w-[260px]">
          {isDesktop
            ? "选择一个包含混乱文件的文件夹，SmartFile 将自动扫描并分析其中的文件。"
            : "这是 Web 演示模式。点击下方按钮加载演示数据体验完整流程。"}
        </p>
        <div className="flex flex-col gap-2">
          {isDesktop ? (
            <Button className="h-8 text-[12px] gap-1.5 px-4" onClick={onOpenFolder}>
              <FolderOpen className="w-3.5 h-3.5" />
              选择文件夹
            </Button>
          ) : (
            <Button className="h-8 text-[12px] gap-1.5 px-4" onClick={onLoadDemo}>
              <Play className="w-3.5 h-3.5" />
              加载演示数据
            </Button>
          )}
        </div>
      </div>
    );
  }

  const messages: Record<string, { icon: any; title: string; desc: string }> = {
    pending: { icon: Clock, title: "没有待处理的文件", desc: "所有文件已分析完成" },
    analyzing: { icon: Brain, title: "没有正在分析的文件", desc: "点击「开始分析」处理待处理文件" },
    ready: { icon: CheckCircle2, title: "没有待确认的文件", desc: "所有分析结果已处理" },
    done: { icon: Archive, title: "还没有已归档的文件", desc: "确认重命名后文件将出现在这里" },
  };

  const msg = messages[view] || messages.pending;
  const Icon = msg.icon;

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
      <Icon className="w-8 h-8 text-foreground/15 mb-3" strokeWidth={1.2} />
      <h3 className="text-[13px] font-medium mb-0.5">{msg.title}</h3>
      <p className="text-[11px] text-muted-foreground">{msg.desc}</p>
    </div>
  );
}

// ============================================================
// Main App Component
// ============================================================

export default function AppDemo() {
  const {
    isDesktop,
    files,
    selectedFile,
    currentFolder,
    isAnalyzing,
    analysisProgress,
    ollamaStatus,
    modelConfig,
    activeView,
    setActiveView,
    selectFile,
    openFolder,
    analyzeFiles,
    confirmRename,
    confirmAllRenames,
    skipFile,
    loadDemoData,
  } = useSmartFile();

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Auto-load demo data in web mode
  useEffect(() => {
    if (!isDesktop && files.length === 0) {
      loadDemoData();
    }
  }, [isDesktop, files.length, loadDemoData]);

  // Filtered files
  const filteredFiles = useMemo(() => {
    let result = files;

    switch (activeView) {
      case "pending":
        result = result.filter(f => f.status === "pending");
        break;
      case "analyzing":
        result = result.filter(f => f.status === "analyzing");
        break;
      case "ready":
        result = result.filter(f => f.status === "ready");
        break;
      case "done":
        result = result.filter(f => f.status === "done");
        break;
      case "image":
        result = result.filter(f => f.type === "image");
        break;
      case "document":
        result = result.filter(f => f.type === "document");
        break;
      case "audio":
        result = result.filter(f => f.type === "audio");
        break;
      case "work":
        result = result.filter(f =>
          (f.targetFolder || "").includes("工作") || (f.targetFolder || "").includes("文档") ||
          (f as any).folder?.includes("工作") || (f as any).folder?.includes("文档")
        );
        break;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(f =>
        f.originalName.toLowerCase().includes(q) ||
        (f.newName || "").toLowerCase().includes(q) ||
        (f.summary || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [files, activeView, searchQuery]);

  // Counts
  const counts = useMemo(() => ({
    pending: files.filter(f => f.status === "pending").length,
    analyzing: files.filter(f => f.status === "analyzing").length,
    ready: files.filter(f => f.status === "ready").length,
    done: files.filter(f => f.status === "done").length,
    image: files.filter(f => f.type === "image").length,
    document: files.filter(f => f.type === "document").length,
    audio: files.filter(f => f.type === "audio").length,
    work: files.filter(f =>
      (f.targetFolder || "").includes("工作") || (f.targetFolder || "").includes("文档") ||
      (f as any).folder?.includes("工作") || (f as any).folder?.includes("文档")
    ).length,
  }), [files]);

  const handleAnalyze = useCallback(() => {
    if (counts.pending === 0) {
      toast("没有待处理的文件");
      return;
    }
    analyzeFiles();
    toast("开始 AI 分析", { description: `正在分析 ${counts.pending} 个文件...` });
  }, [counts.pending, analyzeFiles]);

  const handleConfirmAll = useCallback(() => {
    if (counts.ready === 0) {
      toast("没有待确认的文件");
      return;
    }
    confirmAllRenames();
    toast("批量确认完成", { description: `${counts.ready} 个文件已重命名` });
  }, [counts.ready, confirmAllRenames]);

  // Sidebar items
  const statusItems = [
    { id: "pending", label: "待处理", icon: Clock, count: counts.pending },
    { id: "analyzing", label: "AI 分析中", icon: Brain, count: counts.analyzing },
    { id: "ready", label: "待确认", icon: CheckCircle2, count: counts.ready },
    { id: "done", label: "已归档", icon: Archive, count: counts.done },
  ];

  const folderItems = [
    { id: "image", label: "照片", icon: Image, count: counts.image },
    { id: "document", label: "文档", icon: FileText, count: counts.document },
    { id: "audio", label: "录音", icon: Mic, count: counts.audio },
    { id: "work", label: "工作", icon: Briefcase, count: counts.work },
  ];

  return (
    <div className="h-screen w-screen bg-background flex flex-col overflow-hidden select-none">
      {/* macOS Title Bar */}
      <div className="h-12 bg-sidebar border-b border-border flex items-center px-4 shrink-0 gap-4" style={{ WebkitAppRegion: "drag" } as any}>
        <TrafficLights />
        <div className="flex-1 flex items-center justify-center gap-2">
          <span className="text-[13px] font-semibold tracking-[-0.01em]">SmartFile</span>
          <span className="text-[11px] text-muted-foreground">—</span>
          <span className="text-[11px] text-muted-foreground font-mono">{currentFolder || "~/Downloads"}</span>
        </div>
        <div className="w-[52px]" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ============ Sidebar ============ */}
        <div className="w-[180px] bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
          {/* Search */}
          <div className="p-2">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-sidebar-accent/50 rounded-md">
              <Search className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
              <input
                type="text"
                placeholder="搜索文件..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-[12px] placeholder:text-muted-foreground/50 outline-none w-full"
              />
            </div>
          </div>

          {/* Status views */}
          <div className="px-2 mt-1">
            {statusItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveView(item.id); selectFile(null); }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] transition-colors mb-0.5 ${
                  activeView === item.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50"
                }`}
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.count > 0 && (
                  <span className="text-[10px] text-muted-foreground tabular-nums">{item.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Archive folders */}
          <div className="px-2 mt-3">
            <p className="text-[10px] text-muted-foreground px-2.5 mb-1 uppercase tracking-wider">归档目录</p>
            {folderItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveView(item.id); selectFile(null); }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] transition-colors mb-0.5 ${
                  activeView === item.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50"
                }`}
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.count > 0 && (
                  <span className="text-[10px] text-muted-foreground tabular-nums">{item.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Bottom */}
          <div className="mt-auto p-2 border-t border-sidebar-border">
            <Link href="/settings">
              <button className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] text-sidebar-foreground/60 hover:bg-sidebar-accent/50 transition-colors">
                <Settings className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>设置</span>
              </button>
            </Link>
            <div className="px-2.5 mt-2">
              <p className="text-[10px] text-muted-foreground/50 mb-1">模型: {modelConfig.textModel}</p>
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${ollamaStatus.running ? "bg-green-500" : "bg-red-400"}`} />
                <span className="text-[10px] text-muted-foreground/50">
                  {ollamaStatus.running ? "Ollama 运行中" : "Ollama 未连接"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ============ Main Content ============ */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="h-10 border-b border-border flex items-center px-4 gap-3 shrink-0 bg-background">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-medium">
                {statusItems.find(s => s.id === activeView)?.label ||
                 folderItems.find(f => f.id === activeView)?.label || "全部"}
              </span>
              <span className="text-[11px] text-muted-foreground">{filteredFiles.length} 个文件</span>
            </div>

            <div className="flex-1" />

            {/* View mode toggle */}
            <div className="flex items-center border border-border rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1 ${viewMode === "list" ? "bg-foreground/5" : ""}`}
              >
                <LayoutList className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1 ${viewMode === "grid" ? "bg-foreground/5" : ""}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>

            {counts.pending > 0 && (
              <Button
                size="sm"
                className="h-7 text-[11px] px-3 gap-1.5"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                {isAnalyzing ? `分析中 ${analysisProgress.current}/${analysisProgress.total}` : "开始分析"}
              </Button>
            )}

            {counts.ready > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] px-3 gap-1.5"
                onClick={handleConfirmAll}
              >
                <Check className="w-3 h-3" />
                全部确认
              </Button>
            )}

            {isDesktop && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] px-2.5"
                onClick={openFolder}
              >
                <FolderOpen className="w-3 h-3" />
              </Button>
            )}
          </div>

          {/* Analysis progress bar */}
          {isAnalyzing && (
            <div className="h-1 bg-muted">
              <motion.div
                className="h-full bg-foreground/30"
                initial={{ width: "0%" }}
                animate={{ width: `${analysisProgress.total > 0 ? (analysisProgress.current / analysisProgress.total) * 100 : 0}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}

          {/* File list + Detail panel */}
          <div className="flex flex-1 overflow-hidden">
            {/* File list */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {files.length === 0 ? (
                <EmptyState view="no-files" onOpenFolder={openFolder} onLoadDemo={loadDemoData} isDesktop={isDesktop} />
              ) : filteredFiles.length === 0 ? (
                <EmptyState view={activeView} onOpenFolder={openFolder} onLoadDemo={loadDemoData} isDesktop={isDesktop} />
              ) : (
                <ScrollArea className="flex-1">
                  <AnimatePresence mode="popLayout">
                    {filteredFiles.map((file) => (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.15 }}
                      >
                        <FileListItem
                          file={file}
                          isSelected={selectedFile?.id === file.id}
                          onSelect={() => selectFile(file)}
                          onConfirm={() => {
                            confirmRename(file.id);
                            toast("已确认重命名", { description: file.newName });
                          }}
                          onSkip={() => {
                            skipFile(file.id);
                            toast("已跳过", { description: file.originalName });
                          }}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </ScrollArea>
              )}
            </div>

            {/* Detail panel */}
            <div className="w-[280px] border-l border-border bg-sidebar/30 shrink-0">
              {selectedFile ? (
                <DetailPanel
                  file={selectedFile}
                  onConfirm={() => {
                    confirmRename(selectedFile.id);
                    toast("已确认重命名", { description: selectedFile.newName });
                    selectFile(null);
                  }}
                  onSkip={() => {
                    skipFile(selectedFile.id);
                    toast("已跳过", { description: selectedFile.originalName });
                    selectFile(null);
                  }}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                  <Eye className="w-8 h-8 text-foreground/10 mb-3" strokeWidth={1.2} />
                  <p className="text-[12px] text-muted-foreground">选择一个文件查看详情</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
