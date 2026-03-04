/*
 * Design: Swiss International Typographic Style x Eastern Whitespace
 * Settings page - Model management, system info, preferences
 */

import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useSmartFile } from "@/contexts/SmartFileContext";
import {
  ArrowLeft,
  Check,
  Download,
  Trash2,
  Cpu,
  HardDrive,
  Zap,
  Shield,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Star,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Settings,
  Brain,
  Monitor,
  Globe,
  Info,
  Key,
  Eye,
  EyeOff,
} from "lucide-react";
import { getSettings, saveSettings, testApiKey, type AppSettings, DEFAULT_SETTINGS } from "@/lib/smartfile-api";

// macOS window traffic lights
function TrafficLights() {
  return (
    <div className="flex items-center gap-2">
      <Link href="/app" className="flex items-center">
        <div className="w-3 h-3 rounded-full bg-[#FF5F57] hover:bg-[#FF5F57]/80 transition-colors group relative flex items-center justify-center">
          <ArrowLeft className="w-2 h-2 text-[#4A0002] opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={3} />
        </div>
      </Link>
      <div className="w-3 h-3 rounded-full bg-[#FEBC2E] hover:bg-[#FEBC2E]/80 transition-colors" />
      <div className="w-3 h-3 rounded-full bg-[#28C840] hover:bg-[#28C840]/80 transition-colors" />
    </div>
  );
}

function ModelCard({
  model,
  isInstalled,
  isRecommended,
  isSelected,
  onInstall,
  onSelect,
  onDelete,
  systemRAM,
}: {
  model: any;
  isInstalled: boolean;
  isRecommended: boolean;
  isSelected: boolean;
  onInstall: () => void;
  onSelect: () => void;
  onDelete: () => void;
  systemRAM: number;
}) {
  const canRun = systemRAM >= (model.minRAM || 0);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className={`p-4 border rounded-lg transition-all ${
      isSelected ? "border-foreground/30 bg-foreground/[0.02]" : "border-border hover:border-foreground/15"
    } ${!canRun ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-mono font-medium">{model.name}</span>
          {isRecommended && (
            <span className="text-[9px] px-1.5 py-0.5 bg-foreground text-background rounded font-medium flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5" />
              推荐
            </span>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground">{model.size}</span>
      </div>

      <p className="text-[12px] text-muted-foreground mb-3">{model.desc}</p>

      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground">质量:</span>
          <span className="text-[10px] font-medium">{model.quality}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground">速度:</span>
          <span className="text-[10px] font-medium">{model.speed}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground">最低内存:</span>
          <span className="text-[10px] font-medium">{model.minRAM}GB</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isInstalled ? (
          <>
            <Button
              size="sm"
              variant={isSelected ? "default" : "outline"}
              className="h-7 text-[11px] px-3 gap-1 flex-1"
              onClick={onSelect}
            >
              {isSelected ? <Check className="w-3 h-3" /> : null}
              {isSelected ? "已选用" : "选用此模型"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px] px-2 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px] px-3 gap-1.5 flex-1"
            disabled={!canRun || isLoading}
            onClick={() => {
              setIsLoading(true);
              onInstall();
              setTimeout(() => setIsLoading(false), 2000);
            }}
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Download className="w-3 h-3" />
            )}
            {!canRun ? "内存不足" : isLoading ? "下载中..." : "下载安装"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const {
    systemInfo,
    ollamaStatus,
    modelConfig,
    modelRecommendation,
    isOllamaChecking,
    setModelConfig,
    refreshOllamaStatus,
  } = useSmartFile();

  const [activeTab, setActiveTab] = useState("models");
  const [autoRename, setAutoRename] = useState(false);
  const [keepOriginal, setKeepOriginal] = useState(true);
  const [dateFormat, setDateFormat] = useState("YYYY-MM-DD");
  const [language, setLanguage] = useState("zh");

  // API 模式设置
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [testingKey, setTestingKey] = useState(false);

  useEffect(() => {
    getSettings().then(setAppSettings);
  }, []);

  const handleSaveSettings = async (newSettings: AppSettings) => {
    setAppSettings(newSettings);
    await saveSettings(newSettings);
    toast.success("设置已保存");
  };

  const handleTestApiKey = async () => {
    const key = appSettings[`${appSettings.aiProvider}ApiKey` as keyof AppSettings] as string;
    if (!key) { toast.error("请先填写 API Key"); return; }
    setTestingKey(true);
    const result = await testApiKey(key, appSettings.aiProvider);
    setTestingKey(false);
    result.success ? toast.success("API Key 验证成功") : toast.error("API Key 无效，请检查");
  };

  const tabs = [
    { id: "ai", label: "AI 模式", icon: Key },
    { id: "models", label: "本地模型", icon: Brain },
    { id: "general", label: "通用设置", icon: Settings },
    { id: "system", label: "系统信息", icon: Monitor },
    { id: "about", label: "关于", icon: Info },
  ];

  const installedModelNames = ollamaStatus.models.map((m: any) => m.name || m.model);
  const totalMemGB = systemInfo?.totalMemGB || 16;

  return (
    <div className="h-screen w-screen bg-background flex flex-col overflow-hidden">
      {/* macOS Title Bar */}
      <div className="h-12 bg-sidebar border-b border-border flex items-center px-4 shrink-0 gap-4">
        <TrafficLights />
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[13px] font-medium tracking-[-0.01em]">SmartFile 设置</span>
        </div>
        <div className="w-[52px]" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Settings sidebar */}
        <div className="w-[200px] bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
          <div className="p-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-colors mb-0.5 ${
                  activeTab === tab.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
                }`}
              >
                <tab.icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="max-w-2xl mx-auto p-8">
            {activeTab === "ai" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-[16px] font-semibold tracking-[-0.02em] mb-1">AI 命名模式</h2>
                <p className="text-[13px] text-muted-foreground mb-6">选择使用本地 Ollama 还是云端 API 进行文件命名。API 模式无需强劲电脑，按量计费。</p>

                {/* 模式选择 */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {[
                    { id: "local", label: "本地模式", desc: "使用 Ollama，数据不上传，需要较好的电脑", icon: Shield },
                    { id: "api", label: "API 模式", desc: "调用云端 AI，任何电脑可用，按次计费", icon: Globe },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => handleSaveSettings({ ...appSettings, aiMode: mode.id as "local" | "api" })}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        appSettings.aiMode === mode.id
                          ? "border-foreground/30 bg-foreground/[0.04]"
                          : "border-border hover:border-foreground/15"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <mode.icon className="w-4 h-4" strokeWidth={1.5} />
                        <span className="text-[13px] font-medium">{mode.label}</span>
                        {appSettings.aiMode === mode.id && <Check className="w-3.5 h-3.5 ml-auto text-foreground" />}
                      </div>
                      <p className="text-[12px] text-muted-foreground">{mode.desc}</p>
                    </button>
                  ))}
                </div>

                {/* API Provider 选择 */}
                {appSettings.aiMode === "api" && (
                  <div>
                    <h3 className="text-[14px] font-medium mb-3">选择 AI 服务商</h3>
                    <div className="grid grid-cols-2 gap-2 mb-6">
                      {[
                        { id: "claude", label: "Claude", desc: "Anthropic 出品，理解能力强", badge: "推荐" },
                        { id: "openai", label: "OpenAI", desc: "GPT-4o mini，使用最广泛" },
                        { id: "deepseek", label: "DeepSeek", desc: "国产，价格极低，性能优秀" },
                        { id: "qwen", label: "通义千问", desc: "阿里云出品，中文理解强" },
                      ].map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleSaveSettings({ ...appSettings, aiProvider: p.id as AppSettings["aiProvider"] })}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            appSettings.aiProvider === p.id
                              ? "border-foreground/30 bg-foreground/[0.04]"
                              : "border-border hover:border-foreground/15"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[13px] font-medium">{p.label}</span>
                            {p.badge && <span className="text-[9px] px-1.5 py-0.5 bg-foreground text-background rounded font-medium">{p.badge}</span>}
                            {appSettings.aiProvider === p.id && <Check className="w-3 h-3 ml-auto" />}
                          </div>
                          <p className="text-[11px] text-muted-foreground">{p.desc}</p>
                        </button>
                      ))}
                    </div>

                    {/* API Key 输入 */}
                    <h3 className="text-[14px] font-medium mb-3">API Key</h3>
                    {[
                      { provider: "claude", label: "Claude API Key", placeholder: "sk-ant-api03-..." },
                      { provider: "openai", label: "OpenAI API Key", placeholder: "sk-proj-..." },
                      { provider: "deepseek", label: "DeepSeek API Key", placeholder: "sk-..." },
                      { provider: "qwen", label: "通义千问 API Key", placeholder: "sk-..." },
                    ].filter((item) => item.provider === appSettings.aiProvider).map((item) => {
                      const keyField = `${item.provider}ApiKey` as keyof AppSettings;
                      return (
                        <div key={item.provider} className="mb-4">
                          <label className="text-[12px] text-muted-foreground mb-1.5 block">{item.label}</label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <input
                                type={showApiKey[item.provider] ? "text" : "password"}
                                value={appSettings[keyField] as string}
                                onChange={(e) => setAppSettings({ ...appSettings, [keyField]: e.target.value })}
                                onBlur={() => saveSettings(appSettings)}
                                placeholder={item.placeholder}
                                className="w-full h-9 px-3 pr-9 text-[13px] bg-background border border-border rounded-md font-mono focus:outline-none focus:border-foreground/30"
                              />
                              <button
                                onClick={() => setShowApiKey({ ...showApiKey, [item.provider]: !showApiKey[item.provider] })}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showApiKey[item.provider] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 text-[12px] px-3 shrink-0"
                              onClick={handleTestApiKey}
                              disabled={testingKey}
                            >
                              {testingKey ? <Loader2 className="w-3 h-3 animate-spin" /> : "测试连接"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "models" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                {/* Ollama Status */}
                <div className="mb-8">
                  <h2 className="text-[16px] font-semibold tracking-[-0.02em] mb-1">Ollama 服务状态</h2>
                  <p className="text-[13px] text-muted-foreground mb-4">SmartFile 使用 Ollama 在本地运行 AI 模型，所有数据不离开您的电脑。</p>

                  <div className={`p-4 rounded-lg border ${
                    ollamaStatus.running ? "border-foreground/10 bg-foreground/[0.02]" : "border-destructive/20 bg-destructive/5"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${ollamaStatus.running ? "bg-green-500" : "bg-red-400"}`} />
                        <span className="text-[13px] font-medium">
                          {ollamaStatus.running ? "Ollama 运行中" : "Ollama 未运行"}
                        </span>
                        {ollamaStatus.running && (
                          <span className="text-[11px] text-muted-foreground">
                            {ollamaStatus.models.length} 个模型已安装
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] px-2.5 gap-1"
                          onClick={refreshOllamaStatus}
                          disabled={isOllamaChecking}
                        >
                          <RefreshCw className={`w-3 h-3 ${isOllamaChecking ? "animate-spin" : ""}`} />
                          刷新
                        </Button>
                        {!ollamaStatus.running && (
                          <Button
                            size="sm"
                            className="h-7 text-[11px] px-2.5 gap-1"
                            onClick={() => window.open("https://ollama.com/download", "_blank")}
                          >
                            <ExternalLink className="w-3 h-3" />
                            安装 Ollama
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Model Recommendation */}
                {modelRecommendation && (
                  <div className="mb-8">
                    <h2 className="text-[16px] font-semibold tracking-[-0.02em] mb-1">智能推荐</h2>
                    <p className="text-[13px] text-muted-foreground mb-4">{modelRecommendation.recommendations.reason}</p>

                    <div className="p-4 rounded-lg border border-foreground/10 bg-foreground/[0.02]">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-4 h-4" />
                        <span className="text-[13px] font-medium">根据您的硬件配置推荐</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {modelRecommendation.recommendations.textModel && (
                          <div className="p-3 bg-background rounded-md border border-border">
                            <p className="text-[10px] text-muted-foreground mb-1">文本分析模型</p>
                            <p className="text-[13px] font-mono font-medium">{modelRecommendation.recommendations.textModel.name}</p>
                            <p className="text-[11px] text-muted-foreground mt-1">
                              {modelRecommendation.recommendations.textModel.size} · {modelRecommendation.recommendations.textModel.quality}
                            </p>
                          </div>
                        )}
                        {modelRecommendation.recommendations.visionModel && (
                          <div className="p-3 bg-background rounded-md border border-border">
                            <p className="text-[10px] text-muted-foreground mb-1">视觉理解模型</p>
                            <p className="text-[13px] font-mono font-medium">{modelRecommendation.recommendations.visionModel.name}</p>
                            <p className="text-[11px] text-muted-foreground mt-1">
                              {modelRecommendation.recommendations.visionModel.size} · {modelRecommendation.recommendations.visionModel.quality}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Text Models */}
                <div className="mb-8">
                  <h3 className="text-[14px] font-semibold tracking-[-0.01em] mb-1">文本分析模型（通义千问 Qwen2.5）</h3>
                  <p className="text-[12px] text-muted-foreground mb-4">用于分析文档内容、提取文件名语义、生成归档建议。</p>
                  <div className="grid gap-3">
                    {modelRecommendation?.allModels
                      .filter((m: any) => m.category === "text")
                      .map((model: any) => (
                        <ModelCard
                          key={model.name}
                          model={model}
                          isInstalled={installedModelNames.some((n: string) => n.includes(model.name.split(":")[0]))}
                          isRecommended={modelRecommendation.recommendations.textModel?.name === model.name}
                          isSelected={modelConfig.textModel === model.name}
                          onInstall={() => {
                            toast("开始下载模型", { description: `正在下载 ${model.name}，请稍候...` });
                          }}
                          onSelect={() => {
                            setModelConfig({ ...modelConfig, textModel: model.name });
                            toast("已切换文本模型", { description: `当前使用: ${model.name}` });
                          }}
                          onDelete={() => {
                            toast("已删除模型", { description: `${model.name} 已从本地移除` });
                          }}
                          systemRAM={totalMemGB}
                        />
                      ))}
                  </div>
                </div>

                {/* Vision Models */}
                <div className="mb-8">
                  <h3 className="text-[14px] font-semibold tracking-[-0.01em] mb-1">视觉理解模型（通义千问 Qwen2.5-VL）</h3>
                  <p className="text-[12px] text-muted-foreground mb-4">用于理解图片内容、OCR 文字识别、截图分析。</p>
                  <div className="grid gap-3">
                    {modelRecommendation?.allModels
                      .filter((m: any) => m.category === "vision")
                      .map((model: any) => (
                        <ModelCard
                          key={model.name}
                          model={model}
                          isInstalled={installedModelNames.some((n: string) => n.includes(model.name.split(":")[0]))}
                          isRecommended={modelRecommendation.recommendations.visionModel?.name === model.name}
                          isSelected={modelConfig.visionModel === model.name}
                          onInstall={() => {
                            toast("开始下载模型", { description: `正在下载 ${model.name}，请稍候...` });
                          }}
                          onSelect={() => {
                            setModelConfig({ ...modelConfig, visionModel: model.name });
                            toast("已切换视觉模型", { description: `当前使用: ${model.name}` });
                          }}
                          onDelete={() => {
                            toast("已删除模型", { description: `${model.name} 已从本地移除` });
                          }}
                          systemRAM={totalMemGB}
                        />
                      ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "general" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-[16px] font-semibold tracking-[-0.02em] mb-6">通用设置</h2>

                <div className="space-y-6">
                  {/* Naming rules */}
                  <div>
                    <h3 className="text-[14px] font-medium mb-4">命名规则</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                          <p className="text-[13px] font-medium">日期格式</p>
                          <p className="text-[12px] text-muted-foreground mt-0.5">文件名中的日期显示格式</p>
                        </div>
                        <select
                          value={dateFormat}
                          onChange={(e) => setDateFormat(e.target.value)}
                          className="text-[12px] bg-muted/50 border border-border rounded-md px-2.5 py-1.5"
                        >
                          <option value="YYYY-MM-DD">2024-12-15</option>
                          <option value="YYYYMMDD">20241215</option>
                          <option value="YYYY.MM.DD">2024.12.15</option>
                          <option value="MM-DD-YYYY">12-15-2024</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                          <p className="text-[13px] font-medium">命名语言</p>
                          <p className="text-[12px] text-muted-foreground mt-0.5">AI 生成的文件名使用的语言</p>
                        </div>
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="text-[12px] bg-muted/50 border border-border rounded-md px-2.5 py-1.5"
                        >
                          <option value="zh">中文</option>
                          <option value="en">English</option>
                          <option value="ja">日本語</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Behavior */}
                  <div>
                    <h3 className="text-[14px] font-medium mb-4">行为设置</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                          <p className="text-[13px] font-medium">自动分析新文件</p>
                          <p className="text-[12px] text-muted-foreground mt-0.5">添加文件后自动开始 AI 分析</p>
                        </div>
                        <Switch checked={autoRename} onCheckedChange={setAutoRename} />
                      </div>

                      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                          <p className="text-[13px] font-medium">保留原始文件名</p>
                          <p className="text-[12px] text-muted-foreground mt-0.5">重命名时在文件属性中保留原始名称</p>
                        </div>
                        <Switch checked={keepOriginal} onCheckedChange={setKeepOriginal} />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Custom rules */}
                  <div>
                    <h3 className="text-[14px] font-medium mb-2">自定义语义规则</h3>
                    <p className="text-[12px] text-muted-foreground mb-4">用自然语言定义归档规则，AI 会自动理解并执行。</p>

                    <div className="space-y-3">
                      <div className="p-3 border border-border rounded-lg bg-muted/20">
                        <p className="text-[12px] font-mono text-foreground/80">"把所有合同按年份和金额归类"</p>
                        <p className="text-[10px] text-muted-foreground mt-1">→ 文档/合同/2024/大额 | 文档/合同/2024/小额</p>
                      </div>
                      <div className="p-3 border border-border rounded-lg bg-muted/20">
                        <p className="text-[12px] font-mono text-foreground/80">"照片按拍摄地点分类，工作和生活分开"</p>
                        <p className="text-[10px] text-muted-foreground mt-1">→ 照片/工作/办公室 | 照片/生活/公园</p>
                      </div>
                      <div className="p-3 border border-dashed border-foreground/20 rounded-lg flex items-center justify-center py-4">
                        <button
                          className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => toast("添加规则", { description: "自定义规则编辑器即将上线" })}
                        >
                          + 添加自定义规则
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "system" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-[16px] font-semibold tracking-[-0.02em] mb-6">系统信息</h2>

                <div className="space-y-4">
                  <div className="p-5 border border-border rounded-lg">
                    <h3 className="text-[13px] font-medium mb-4 flex items-center gap-2">
                      <Cpu className="w-4 h-4" />
                      硬件信息
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-0.5">处理器</p>
                        <p className="text-[13px] font-mono">{systemInfo?.cpuModel || "Apple M2"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-0.5">架构</p>
                        <p className="text-[13px] font-mono">{systemInfo?.arch || "arm64"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-0.5">总内存</p>
                        <p className="text-[13px] font-mono">{systemInfo?.totalMemGB || 16} GB</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-0.5">可用内存</p>
                        <p className="text-[13px] font-mono">{systemInfo?.freeMemGB || 8} GB</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-0.5">Apple Silicon</p>
                        <p className="text-[13px] font-mono">{systemInfo?.isAppleSilicon ? "是" : "否"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-0.5">操作系统</p>
                        <p className="text-[13px] font-mono">{systemInfo?.platform === "darwin" ? "macOS" : systemInfo?.platform || "macOS"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 border border-border rounded-lg">
                    <h3 className="text-[13px] font-medium mb-4 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      隐私与安全
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-foreground/60 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[13px]">100% 本地处理</p>
                          <p className="text-[11px] text-muted-foreground">所有 AI 分析在您的设备上完成，文件数据不会上传到任何服务器</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-foreground/60 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[13px]">无网络依赖</p>
                          <p className="text-[11px] text-muted-foreground">模型下载后可完全离线使用，无需互联网连接</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-foreground/60 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[13px]">开源透明</p>
                          <p className="text-[11px] text-muted-foreground">使用开源模型（通义千问 Qwen），代码完全可审计</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 border border-border rounded-lg">
                    <h3 className="text-[13px] font-medium mb-4 flex items-center gap-2">
                      <HardDrive className="w-4 h-4" />
                      存储使用
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[12px] text-muted-foreground">模型存储</span>
                          <span className="text-[12px] font-mono">
                            {ollamaStatus.running ? `${ollamaStatus.models.length} 个模型` : "未连接"}
                          </span>
                        </div>
                        <Progress value={35} className="h-1.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "about" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-foreground rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-background text-2xl font-bold">S</span>
                  </div>
                  <h2 className="text-[20px] font-semibold tracking-[-0.03em] mb-1">SmartFile</h2>
                  <p className="text-[13px] text-muted-foreground mb-1">基于语义理解的本地资产自动化归档助手</p>
                  <p className="text-[12px] text-muted-foreground mb-6">版本 0.1.0</p>

                  <div className="max-w-md mx-auto text-left space-y-4">
                    <div className="p-4 border border-border rounded-lg">
                      <p className="text-[12px] text-muted-foreground mb-2">技术栈</p>
                      <div className="flex flex-wrap gap-2">
                        {["Electron", "React 19", "Tailwind CSS 4", "Ollama", "Qwen2.5", "Qwen2.5-VL"].map((tech) => (
                          <span key={tech} className="text-[11px] px-2 py-0.5 bg-muted rounded-md font-mono">{tech}</span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 border border-border rounded-lg">
                      <p className="text-[12px] text-muted-foreground mb-2">开源协议</p>
                      <p className="text-[13px]">MIT License</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
