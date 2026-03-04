/*
 * Design: Swiss International Typographic Style × Eastern Whitespace
 * Colors: Pure black/white/grey — no chromatic colors
 * Typography: DM Sans + Noto Sans SC (body), JetBrains Mono (code)
 * Layout: Asymmetric, generous whitespace, 1px dividers
 * Animations: Subtle fade + translateY, no bounce
 */

import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Eye,
  FileText,
  Image,
  Mic,
  Shield,
  Sparkles,
  ArrowRight,
  ChevronDown,
  Terminal,
  FolderOpen,
  Zap,
  Lock,
  Download,
  Apple,
  Github,
  ArrowUpRight,
  Command,
} from "lucide-react";
import { toast } from "sonner";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663401715460/PAxdMEPC3ofLmSQt9gdBah/hero-illustration-oNdyRYxdRnG5WPAypSzZAR.webp";
const PROCESSING_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663401715460/PAxdMEPC3ofLmSQt9gdBah/processing-illustration-ng8BUpgN5CFapky5d7Rcc9.webp";
const PRIVACY_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663401715460/PAxdMEPC3ofLmSQt9gdBah/privacy-illustration-VXQxGNJwvnh3PZthCid47G.webp";
const AI_BRAIN_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663401715460/PAxdMEPC3ofLmSQt9gdBah/ai-brain-illustration-HEvDRwQkpuRSLmAam9vUiB.webp";

function FadeInSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/80 backdrop-blur-md border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
            <FolderOpen className="w-4 h-4 text-background" strokeWidth={1.5} />
          </div>
          <span className="text-[15px] font-medium tracking-[-0.02em]">SmartFile</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">功能</a>
          <a href="#workflow" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">工作流</a>
          <a href="#privacy" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">隐私</a>
          <a href="#download" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">下载</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/app">
            <Button variant="outline" size="sm" className="hidden sm:flex text-[13px] h-8 px-4 border-foreground/15 hover:bg-foreground hover:text-background transition-all duration-200">
              在线演示
            </Button>
          </Link>
          <button
            className="md:hidden p-2 -mr-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <div className="space-y-1.5">
              <div className={`w-5 h-[1.5px] bg-foreground transition-all duration-200 ${mobileMenuOpen ? 'rotate-45 translate-y-[5px]' : ''}`} />
              <div className={`w-5 h-[1.5px] bg-foreground transition-all duration-200 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <div className={`w-5 h-[1.5px] bg-foreground transition-all duration-200 ${mobileMenuOpen ? '-rotate-45 -translate-y-[5px]' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-border bg-background/95 backdrop-blur-md overflow-hidden"
          >
            <div className="px-6 py-4 space-y-3">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-[14px] text-muted-foreground hover:text-foreground py-1">功能</a>
              <a href="#workflow" onClick={() => setMobileMenuOpen(false)} className="block text-[14px] text-muted-foreground hover:text-foreground py-1">工作流</a>
              <a href="#privacy" onClick={() => setMobileMenuOpen(false)} className="block text-[14px] text-muted-foreground hover:text-foreground py-1">隐私</a>
              <a href="#download" onClick={() => setMobileMenuOpen(false)} className="block text-[14px] text-muted-foreground hover:text-foreground py-1">下载</a>
              <Link href="/app">
                <Button size="sm" className="w-full mt-2 text-[13px] h-9">在线演示</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="min-h-[100vh] flex flex-col justify-center relative pt-16">
      <div className="max-w-6xl mx-auto px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Text */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-border rounded-full mb-6">
                <span className="w-1.5 h-1.5 bg-foreground rounded-full" />
                <span className="text-[11px] tracking-[0.08em] uppercase text-muted-foreground font-medium">本地运行 · 隐私优先</span>
              </div>
              <h1 className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.08] tracking-[-0.035em] font-semibold">
                让 AI 读懂<br />
                你的每一个文件
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
              className="text-[17px] leading-[1.7] text-muted-foreground max-w-md"
            >
              基于多模态大模型的本地文件归档助手。不再依赖混乱的文件名，
              SmartFile 能「看懂」图片、「听懂」录音、「读懂」文档，
              一键实现语义化重命名与结构化归档。
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <a href="#download">
                <Button size="lg" className="h-12 px-8 text-[14px] font-medium gap-2 rounded-xl">
                  <Apple className="w-4 h-4" />
                  下载 macOS 版本
                </Button>
              </a>
              <Link href="/app">
                <Button variant="outline" size="lg" className="h-12 px-8 text-[14px] font-medium gap-2 rounded-xl border-foreground/15">
                  在线体验
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center gap-6 pt-2"
            >
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <Shield className="w-3.5 h-3.5" />
                <span>数据不离开本机</span>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <Zap className="w-3.5 h-3.5" />
                <span>端侧模型推理</span>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <Command className="w-3.5 h-3.5" />
                <span>macOS 原生</span>
              </div>
            </motion.div>
          </div>

          {/* Right: Hero Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
            className="relative"
          >
            <div className="relative">
              <img
                src={HERO_IMG}
                alt="SmartFile - 智能文件归档"
                className="w-full h-auto"
                loading="eager"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <ChevronDown className="w-5 h-5 text-muted-foreground/50" />
        </motion.div>
      </motion.div>
    </section>
  );
}

function BeforeAfterSection() {
  return (
    <section className="py-32 border-t border-border">
      <div className="max-w-6xl mx-auto px-6">
        <FadeInSection>
          <div className="text-center mb-20">
            <p className="text-[11px] tracking-[0.12em] uppercase text-muted-foreground font-medium mb-4">Before → After</p>
            <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] tracking-[-0.03em] font-semibold">
              从混乱到有序，只需一步
            </h2>
          </div>
        </FadeInSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 max-w-4xl mx-auto">
          {/* Before */}
          <FadeInSection delay={0.1}>
            <div className="p-8 md:p-10 border border-border md:border-r-0">
              <p className="text-[11px] tracking-[0.1em] uppercase text-muted-foreground font-medium mb-6">处理前</p>
              <div className="space-y-3">
                {[
                  { name: "IMG_20241215_143022.jpg", type: "image" },
                  { name: "截屏2024-12-20 18.36.08.png", type: "image" },
                  { name: "录音 (3).m4a", type: "audio" },
                  { name: "新建文档 (2).docx", type: "doc" },
                  { name: "WeChat_20241218153421.jpg", type: "image" },
                  { name: "未命名.pdf", type: "doc" },
                  { name: "download (1).png", type: "image" },
                ].map((file, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 px-3 bg-muted/50 rounded-md">
                    {file.type === "image" ? <Image className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> :
                     file.type === "audio" ? <Mic className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> :
                     <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                    <span className="text-[13px] font-mono text-muted-foreground truncate">{file.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeInSection>

          {/* After */}
          <FadeInSection delay={0.2}>
            <div className="p-8 md:p-10 border border-border">
              <p className="text-[11px] tracking-[0.1em] uppercase text-muted-foreground font-medium mb-6">处理后</p>
              <div className="space-y-3">
                {[
                  { name: "2024-12-15_办公室团建合影.jpg", folder: "照片/活动" },
                  { name: "2024-12-20_产品原型评审截图.png", folder: "工作/设计" },
                  { name: "2024-12-18_客户需求沟通录音.m4a", folder: "录音/客户" },
                  { name: "2024-12-16_Q4季度总结报告.docx", folder: "文档/报告" },
                  { name: "2024-12-18_项目签约现场照片.jpg", folder: "照片/工作" },
                  { name: "2024-12-19_租房合同扫描件.pdf", folder: "文档/合同" },
                  { name: "2024-12-17_UI设计稿配色方案.png", folder: "工作/设计" },
                ].map((file, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 px-3 bg-foreground/[0.03] rounded-md">
                    <FolderOpen className="w-3.5 h-3.5 text-foreground/60 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-[13px] font-mono text-foreground block truncate">{file.name}</span>
                      <span className="text-[11px] text-muted-foreground">{file.folder}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeInSection>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Eye,
      title: "多模态内容识别",
      desc: "不仅识别文本，还能「看懂」图片内容（OCR + 视觉理解），从截图中提取关键信息用于命名。",
      image: AI_BRAIN_IMG,
    },
    {
      icon: Mic,
      title: "语音文件理解",
      desc: "自动转录录音文件内容，提取主题、参与者、时间等关键信息，生成语义化文件名。",
      image: PROCESSING_IMG,
    },
    {
      icon: Terminal,
      title: "自然语言规则链",
      desc: "用自然语言下达归档指令，如'把所有合同按年份和金额归类'，系统自动转化为执行脚本。",
      image: null,
    },
    {
      icon: Lock,
      title: "本地化隐私部署",
      desc: "使用轻量级端侧模型，所有数据处理均在本机完成，无需上传云端，彻底解决隐私顾虑。",
      image: PRIVACY_IMG,
    },
  ];

  return (
    <section id="features" className="py-32 border-t border-border">
      <div className="max-w-6xl mx-auto px-6">
        <FadeInSection>
          <div className="mb-20">
            <p className="text-[11px] tracking-[0.12em] uppercase text-muted-foreground font-medium mb-4">核心功能</p>
            <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] tracking-[-0.03em] font-semibold max-w-lg">
              不只是重命名，<br />是真正「理解」你的文件
            </h2>
          </div>
        </FadeInSection>

        <div className="space-y-0">
          {features.map((feat, i) => (
            <FadeInSection key={i} delay={i * 0.08}>
              <div className={`grid grid-cols-1 ${feat.image ? 'lg:grid-cols-5' : 'lg:grid-cols-1'} gap-0 border-t border-border py-12 lg:py-16`}>
                <div className={`${feat.image ? 'lg:col-span-3' : ''} flex flex-col justify-center`}>
                  <div className="flex items-start gap-5">
                    <div className="w-10 h-10 border border-border rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <feat.icon className="w-4.5 h-4.5 text-foreground" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-[20px] font-medium tracking-[-0.02em] mb-3">{feat.title}</h3>
                      <p className="text-[15px] leading-[1.7] text-muted-foreground max-w-md">{feat.desc}</p>
                    </div>
                  </div>
                </div>
                {feat.image && (
                  <div className="lg:col-span-2 flex items-center justify-end mt-8 lg:mt-0">
                    <img src={feat.image} alt={feat.title} className="w-full max-w-[280px] h-auto opacity-80" loading="lazy" />
                  </div>
                )}
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  const steps = [
    { num: "01", title: "选择文件夹", desc: "拖拽或选择需要整理的文件夹，支持批量导入数千个文件" },
    { num: "02", title: "AI 分析内容", desc: "多模态模型逐一分析每个文件的实际内容，提取语义信息" },
    { num: "03", title: "生成命名方案", desc: "根据内容生成'日期_主题描述'格式的语义化文件名" },
    { num: "04", title: "预览并确认", desc: "逐一预览重命名方案，支持手动微调，确认后一键执行" },
  ];

  return (
    <section id="workflow" className="py-32 border-t border-border bg-muted/30">
      <div className="max-w-6xl mx-auto px-6">
        <FadeInSection>
          <div className="text-center mb-20">
            <p className="text-[11px] tracking-[0.12em] uppercase text-muted-foreground font-medium mb-4">工作流程</p>
            <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] tracking-[-0.03em] font-semibold">
              四步完成文件治理
            </h2>
          </div>
        </FadeInSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0">
          {steps.map((step, i) => (
            <FadeInSection key={i} delay={i * 0.1}>
              <div className="p-8 border border-border bg-background relative group">
                <span className="text-[48px] font-light tracking-[-0.04em] text-foreground/[0.06] block mb-6 leading-none">{step.num}</span>
                <h3 className="text-[16px] font-medium tracking-[-0.01em] mb-3">{step.title}</h3>
                <p className="text-[13px] leading-[1.7] text-muted-foreground">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                    <ArrowRight className="w-4 h-4 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}

function PrivacySection() {
  return (
    <section id="privacy" className="py-32 border-t border-border">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <FadeInSection>
            <div>
              <p className="text-[11px] tracking-[0.12em] uppercase text-muted-foreground font-medium mb-4">隐私承诺</p>
              <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] tracking-[-0.03em] font-semibold mb-6">
                你的数据，<br />
                永远只属于你
              </h2>
              <p className="text-[15px] leading-[1.7] text-muted-foreground mb-8 max-w-md">
                SmartFile 采用完全本地化的端侧模型架构。所有文件分析、内容识别、
                重命名操作均在你的 Mac 上完成，没有任何数据会离开你的设备。
                我们不收集、不传输、不存储你的任何文件信息。
              </p>
              <div className="space-y-4">
                {[
                  "端侧推理：使用优化后的轻量级模型，无需联网",
                  "零数据上传：所有处理在本地 CPU/GPU 完成",
                  "开源透明：核心引擎代码完全开源，接受社区审计",
                  "沙箱隔离：文件访问权限严格受限于用户选择的目录",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 border border-foreground/20 rounded flex items-center justify-center shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-foreground rounded-sm" />
                    </div>
                    <span className="text-[14px] leading-[1.6] text-foreground/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeInSection>

          <FadeInSection delay={0.15}>
            <div className="flex justify-center">
              <img src={PRIVACY_IMG} alt="隐私保护" className="w-full max-w-[360px] h-auto" loading="lazy" />
            </div>
          </FadeInSection>
        </div>
      </div>
    </section>
  );
}

function RuleChainSection() {
  const examples = [
    {
      input: "把所有合同文件按签约年份和金额大小归类",
      output: "→ 合同/2024/50万以上/\n→ 合同/2024/10-50万/\n→ 合同/2023/50万以上/",
    },
    {
      input: "把截图按应用来源分类，微信的放一起，浏览器的放一起",
      output: "→ 截图/微信/\n→ 截图/浏览器/Chrome/\n→ 截图/浏览器/Safari/",
    },
    {
      input: "所有照片按拍摄地点和月份整理",
      output: "→ 照片/北京/2024-12/\n→ 照片/上海/2024-11/\n→ 照片/杭州/2024-12/",
    },
  ];

  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % examples.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-32 border-t border-border bg-muted/30">
      <div className="max-w-6xl mx-auto px-6">
        <FadeInSection>
          <div className="mb-16">
            <p className="text-[11px] tracking-[0.12em] uppercase text-muted-foreground font-medium mb-4">语义规则链</p>
            <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] tracking-[-0.03em] font-semibold max-w-lg">
              用自然语言定义归档规则
            </h2>
            <p className="text-[15px] leading-[1.7] text-muted-foreground mt-4 max-w-lg">
              不需要学习复杂的正则表达式或脚本语言。直接用中文描述你的归档需求，
              SmartFile 自动理解并执行。
            </p>
          </div>
        </FadeInSection>

        <FadeInSection delay={0.1}>
          <div className="max-w-3xl">
            <div className="border border-border bg-background overflow-hidden">
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-foreground/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-foreground/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-foreground/10" />
                </div>
                <span className="text-[11px] text-muted-foreground font-mono ml-2">SmartFile 规则引擎</span>
              </div>

              <div className="p-6 space-y-6">
                {/* Input */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-foreground/40" />
                    <span className="text-[11px] tracking-[0.08em] uppercase text-muted-foreground font-medium">自然语言指令</span>
                  </div>
                  <div className="flex gap-2">
                    {examples.map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveIdx(i)}
                        className={`text-left text-[13px] px-3 py-2 rounded-md transition-all duration-200 ${
                          i === activeIdx
                            ? "bg-foreground text-background"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        示例 {i + 1}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 p-4 bg-muted/50 rounded-md">
                    <p className="text-[14px] leading-[1.6] font-mono">{examples[activeIdx].input}</p>
                  </div>
                </div>

                {/* Output */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FolderOpen className="w-3.5 h-3.5 text-foreground/40" />
                    <span className="text-[11px] tracking-[0.08em] uppercase text-muted-foreground font-medium">生成的目录结构</span>
                  </div>
                  <div className="p-4 bg-foreground/[0.03] rounded-md">
                    <pre className="text-[13px] leading-[1.8] font-mono text-foreground/70 whitespace-pre-wrap">
                      {examples[activeIdx].output}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeInSection>
      </div>
    </section>
  );
}

function TechSpecsSection() {
  const specs = [
    { label: "支持系统", value: "macOS 13.0+" },
    { label: "芯片支持", value: "Apple Silicon / Intel" },
    { label: "模型大小", value: "~2GB (首次下载)" },
    { label: "内存需求", value: "8GB RAM 起" },
    { label: "支持格式", value: "200+ 文件格式" },
    { label: "处理速度", value: "~3秒/文件 (M1)" },
    { label: "语言支持", value: "中文 / English" },
    { label: "许可证", value: "MIT 开源" },
  ];

  return (
    <section className="py-32 border-t border-border">
      <div className="max-w-6xl mx-auto px-6">
        <FadeInSection>
          <div className="mb-16">
            <p className="text-[11px] tracking-[0.12em] uppercase text-muted-foreground font-medium mb-4">技术规格</p>
            <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] tracking-[-0.03em] font-semibold">
              轻量但强大
            </h2>
          </div>
        </FadeInSection>

        <FadeInSection delay={0.1}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
            {specs.map((spec, i) => (
              <div key={i} className="p-6 border border-border">
                <p className="text-[11px] tracking-[0.08em] uppercase text-muted-foreground font-medium mb-2">{spec.label}</p>
                <p className="text-[16px] font-medium tracking-[-0.01em]">{spec.value}</p>
              </div>
            ))}
          </div>
        </FadeInSection>
      </div>
    </section>
  );
}

function DownloadSection() {
  return (
    <section id="download" className="py-32 border-t border-border bg-foreground text-background">
      <div className="max-w-6xl mx-auto px-6">
        <FadeInSection>
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] tracking-[-0.03em] font-semibold mb-4">
              开始整理你的数字生活
            </h2>
            <p className="text-[15px] leading-[1.7] text-background/60 mb-10">
              免费下载，开源透明。让每一个文件都有一个好名字。
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                className="h-13 px-8 text-[14px] font-medium gap-2.5 rounded-xl bg-background text-foreground hover:bg-background/90"
                onClick={() => toast("下载功能即将上线", { description: "SmartFile 正在积极开发中，敬请期待！" })}
              >
                <Apple className="w-4.5 h-4.5" />
                下载 Apple Silicon 版
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-13 px-8 text-[14px] font-medium gap-2.5 rounded-xl border-background/20 text-background hover:bg-background/10 bg-transparent"
                onClick={() => toast("下载功能即将上线", { description: "SmartFile 正在积极开发中，敬请期待！" })}
              >
                <Download className="w-4.5 h-4.5" />
                下载 Intel 版
              </Button>
            </div>

            <div className="flex items-center justify-center gap-6 mt-8">
              <a href="#" className="flex items-center gap-1.5 text-[13px] text-background/50 hover:text-background/80 transition-colors">
                <Github className="w-3.5 h-3.5" />
                GitHub
                <ArrowUpRight className="w-3 h-3" />
              </a>
              <span className="text-background/20">·</span>
              <span className="text-[13px] text-background/50">v0.1.0-beta</span>
              <span className="text-background/20">·</span>
              <span className="text-[13px] text-background/50">MIT License</span>
            </div>
          </div>
        </FadeInSection>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-8 border-t border-border">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-foreground rounded-md flex items-center justify-center">
            <FolderOpen className="w-3 h-3 text-background" strokeWidth={1.5} />
          </div>
          <span className="text-[13px] text-muted-foreground">SmartFile</span>
        </div>
        <p className="text-[12px] text-muted-foreground">
          让 AI 读懂你的每一个文件 · 本地运行 · 隐私优先
        </p>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <BeforeAfterSection />
      <FeaturesSection />
      <WorkflowSection />
      <RuleChainSection />
      <PrivacySection />
      <TechSpecsSection />
      <DownloadSection />
      <Footer />
    </div>
  );
}
