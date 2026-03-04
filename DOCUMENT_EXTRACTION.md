# SmartFile 文档提取功能实现说明

## 概述

SmartFile 现已支持 **PDF、DOCX、XLSX、PPTX** 等二进制文档的自动文本提取，并集成到 AI 分析流程中。用户无需手动打开文档，系统会自动读取文档内容并生成语义化的文件名和分类。

## 支持的文件格式

| 格式 | 库 | 功能 |
|------|-----|------|
| **PDF** | `pdf-parse` | 提取文本、元数据、页数 |
| **DOCX** | `mammoth` | 提取段落、表格、格式化文本 |
| **XLSX** | `xlsx` | 提取工作表名称、单元格内容、数据范围 |
| **PPTX** | `pptx-parser` | 提取幻灯片标题、文本内容 |
| **TXT/LOG** | 原生 `fs` | 直接读取纯文本 |

## 技术实现

### 后端（Electron 主进程）

**文件：`electron/main.js`**

#### 1. 文档解析函数 `readDocumentText(filePath)`

```javascript
async function readDocumentText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  switch (ext) {
    case '.pdf':
      const pdfData = await fs.promises.readFile(filePath);
      const pdf = await pdfParse(pdfData);
      return pdf.text.substring(0, 5000);  // 限制前 5000 字符
    
    case '.docx':
      const docxData = await fs.promises.readFile(filePath);
      const result = await mammoth.extractRawText({ arrayBuffer: docxData });
      return result.value.substring(0, 5000);
    
    case '.xlsx':
      const workbook = xlsx.readFile(filePath);
      let content = '';
      workbook.SheetNames.forEach(sheet => {
        const data = xlsx.utils.sheet_to_csv(workbook.Sheets[sheet]);
        content += `[工作表: ${sheet}]\n${data}\n`;
      });
      return content.substring(0, 5000);
    
    case '.pptx':
      const pptxParser = new PptxParser();
      await pptxParser.parseFile(filePath);
      return pptxParser.getOutline().substring(0, 5000);
    
    default:
      // 纯文本文件
      return fs.readFileSync(filePath, 'utf-8').substring(0, 5000);
  }
}
```

#### 2. AI 分析流程集成

在 `ai:analyzeFile` 处理器中：

```javascript
if (type === 'document') {
  // 异步提取文档文本
  const textContent = await readDocumentText(filePath);
  const result = await analyzeWithText(
    textContent,
    originalName,
    date,
    ext,
    modelConfig.textModel
  );
  
  // 返回包含提取文本的分析结果
  return {
    ...result,
    extractedText: textContent  // 前 3000 字符
  };
}
```

### 前端（React 组件）

**文件：`client/src/pages/AppDemo.tsx`**

#### 1. 详情面板增强

在 `DetailPanel` 组件中添加了两个新的展示区域：

```tsx
{/* 内容摘要 - 所有文件类型 */}
{file.summary && (
  <div>
    <p className="text-[10px] text-muted-foreground mb-1">内容摘要</p>
    <div className="bg-foreground/[0.03] border border-border rounded p-2.5 max-h-32 overflow-y-auto">
      <p className="text-[12px] text-foreground/70 leading-relaxed whitespace-pre-wrap break-words">
        {file.summary}
      </p>
    </div>
  </div>
)}

{/* 文档内容预览 - 仅文档类型 */}
{file.type === "document" && file.extractedText && (
  <div>
    <p className="text-[10px] text-muted-foreground mb-1">文档内容预览</p>
    <div className="bg-foreground/[0.02] border border-border rounded p-2.5 max-h-40 overflow-y-auto font-mono text-[11px] text-foreground/60 leading-relaxed">
      {file.extractedText.substring(0, 500)}
      {file.extractedText.length > 500 && <span className="text-muted-foreground">...</span>}
    </div>
  </div>
)}

{/* 文档提取中 - 加载状态 */}
{file.type === "document" && file.status === "analyzing" && (
  <div>
    <p className="text-[10px] text-muted-foreground mb-1">文档提取中</p>
    <div className="flex items-center gap-2 text-[12px] text-foreground/60">
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
      正在解析文档内容...
    </div>
  </div>
)}
```

#### 2. 类型定义更新

**文件：`client/src/lib/smartfile-api.ts`**

```typescript
export interface FileItem {
  // ... 其他字段
  extractedText?: string;  // 文档提取的原始文本（前 3000 字符）
}

export interface AnalysisResult {
  // ... 其他字段
  extractedText?: string;  // 文档提取的原始文本
}
```

## 工作流程

```
用户选择文件
    ↓
系统检测文件类型
    ↓
如果是文档类型 → 异步提取文本内容
    ↓
将提取的文本发送给 Ollama 模型
    ↓
模型基于文档内容生成语义化文件名和分类
    ↓
前端显示：
  - 文件名建议
  - 分类建议
  - 置信度
  - 内容摘要
  - 文档内容预览（前 500 字符）
```

## 性能优化

1. **文本长度限制**：
   - 后端提取：前 5000 字符
   - 前端预览：前 500 字符
   - 发送给 AI 模型：前 2000 字符

2. **异步处理**：
   - 文档提取在后台进行，不阻塞 UI
   - 支持批量分析多个文档

3. **缓存机制**：
   - 已提取的文本存储在 `FileItem.extractedText` 中
   - 避免重复提取同一文件

## 隐私保护

- 所有文档处理在本地进行
- 文本内容不上传到云端
- 只有文本摘要和分析结果通过 Ollama API 传输
- 支持离线模式（Ollama 本地运行）

## 依赖安装

在 `electron/package.json` 中已添加：

```json
{
  "pdf-parse": "^1.1.1",
  "mammoth": "^1.6.0",
  "xlsx": "^0.18.5",
  "pptx-parser": "^0.1.2"
}
```

安装命令：
```bash
cd electron
npm install
```

## 测试

在应用演示页面中已包含多个文档类型的样本文件：
- `新建文档 (2).docx` - DOCX 文档
- `未命名.pdf` - PDF 文档
- `副本_副本_工作簿1.xlsx` - XLSX 文档

点击"开始分析"后，可以看到这些文档的内容被自动提取并用于 AI 分析。

## 后续改进方向

1. **支持更多格式**：RTF、ODT、CSV 等
2. **表格识别**：为 XLSX 中的表格生成结构化摘要
3. **图表识别**：识别 PPTX 中的图表内容
4. **OCR 增强**：对扫描 PDF 进行 OCR 识别
5. **语言检测**：自动检测文档语言并调整 AI 提示词
