# SmartFile 开发者指南

## 项目概述

SmartFile 是一个基于语义理解的本地资产自动化归档助手，采用 Electron + React 架构，集成 Ollama 运行通义千问（Qwen）本地模型。

---

## 开发环境搭建

### 1. 安装依赖

```bash
# 安装前端依赖
pnpm install

# 安装 Electron 依赖
cd electron
npm install
cd ..
```

### 2. 安装 Ollama

访问 [https://ollama.com/download](https://ollama.com/download) 下载安装 Ollama。

```bash
# 启动 Ollama 服务
ollama serve

# 下载推荐模型
ollama pull qwen2.5:7b      # 文本分析
ollama pull qwen2.5vl:3b    # 视觉理解
```

### 3. 启动开发服务器

```bash
# 终端 1：启动 Web 开发服务器
pnpm run dev

# 终端 2：启动 Electron（可选）
cd electron
NODE_ENV=development npx electron .
```

---

## 项目架构

### 前端（client/）

React 19 + Tailwind CSS 4 + shadcn/ui 组件库。

**核心文件：**

| 文件 | 职责 |
|------|------|
| `pages/Home.tsx` | 产品展示首页（Hero、功能介绍、下载等） |
| `pages/AppDemo.tsx` | 应用主界面（文件管理、分析、重命名） |
| `pages/Settings.tsx` | 设置页面（模型管理、系统信息） |
| `contexts/SmartFileContext.tsx` | 全局状态管理（文件列表、模型配置、Ollama 状态） |
| `lib/smartfile-api.ts` | API 层（Electron IPC 和 Web Fallback 的统一封装） |

**运行模式：**

前端代码自动检测运行环境。在 Electron 中通过 IPC 调用本地 API；在浏览器中使用模拟数据进行演示。

### Electron 后端（electron/）

| 文件 | 职责 |
|------|------|
| `main.js` | 主进程：窗口管理、文件系统操作、Ollama API 调用、AI 分析 |
| `preload.js` | 预加载脚本：安全地将 API 暴露给渲染进程 |

**IPC 通道：**

| 通道 | 功能 |
|------|------|
| `system:getInfo` | 获取系统信息（CPU、内存、架构） |
| `fs:selectFolder` | 打开文件夹选择对话框 |
| `fs:scanFolder` | 扫描文件夹中的所有文件 |
| `fs:renameFile` | 重命名文件 |
| `fs:moveFile` | 移动文件到目标目录 |
| `ollama:checkStatus` | 检查 Ollama 运行状态 |
| `ollama:listModels` | 列出已安装的模型 |
| `ollama:pullModel` | 下载新模型 |
| `ai:analyzeFile` | 分析单个文件内容 |
| `ai:analyzeWithCustomRule` | 使用自定义规则分析文件 |

---

## 构建与打包

### 构建前端

```bash
pnpm run build
```

构建产物在 `dist/public/` 目录。

### 打包 macOS 应用

```bash
# 先构建前端
pnpm run build

# 打包 .dmg
cd electron
npm install electron electron-builder --save-dev
npx electron-builder --mac --config ../electron-builder.yml
```

打包产物在 `release/` 目录。

---

## AI 模型集成

### 模型调用流程

1. 前端通过 `SmartFileContext` 触发分析
2. 调用 `smartfile-api.ts` 中的 `analyzeFile()`
3. Electron 环境下通过 IPC 转发到 `main.js`
4. `main.js` 根据文件类型选择分析策略：
   - 图片 → `analyzeWithVision()` → Ollama `/api/generate` (带 images 参数)
   - 文档 → `analyzeWithText()` → Ollama `/api/generate`
   - 音频 → `analyzeAudioMeta()` → Ollama `/api/generate`
5. 解析 AI 返回的 JSON，提取新文件名、归档目录、置信度

### Prompt 设计

所有 prompt 都要求 AI 返回标准 JSON 格式：

```json
{
  "newName": "2024-12-15_办公室团建合影.jpg",
  "folder": "照片/活动",
  "summary": "多人合影场景，背景为办公室环境",
  "confidence": 94
}
```

命名规则：`日期_主题描述.扩展名`

---

## 扩展开发

### 添加新的文件类型支持

1. 在 `main.js` 的 `getFileType()` 中添加扩展名映射
2. 如需特殊处理，在 `ai:analyzeFile` handler 中添加新的分支
3. 编写对应的分析函数

### 添加新的 AI 模型

1. 在 `main.js` 的 `ollama:getRecommendedModels` 中添加模型信息
2. 在 `smartfile-api.ts` 的 `getRecommendedModels()` Web fallback 中同步更新
3. 在 `Settings.tsx` 中确认 UI 正确展示新模型

### 支持 PDF/DOCX 文本提取

当前版本仅支持纯文本文件的内容读取。要支持 PDF 和 DOCX：

```bash
# 安装依赖
npm install pdf-parse mammoth
```

然后在 `main.js` 的 `readDocumentText()` 中添加对应的解析逻辑。

---

## 注意事项

1. **隐私安全**：所有文件操作通过 Electron 的 contextIsolation 和 preload 脚本进行隔离
2. **错误处理**：AI 模型可能返回非标准 JSON，所有解析都有 fallback 处理
3. **性能考虑**：大文件（如高清图片）的 base64 编码可能占用较多内存，建议限制单文件大小
4. **模型兼容**：不同版本的 Ollama 可能有 API 差异，当前基于 Ollama 0.1.x API 开发
