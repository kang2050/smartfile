#!/bin/bash

# ============================================================
# SmartFile - macOS 一键安装脚本
# 基于语义理解的本地资产自动化归档助手
# ============================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║          SmartFile - 智能文件归档助手            ║${NC}"
echo -e "${BOLD}║     基于语义理解的本地资产自动化归档助手          ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# ============================================================
# 系统检测
# ============================================================

echo -e "${CYAN}[1/6]${NC} 检测系统环境..."

OS=$(uname -s)
ARCH=$(uname -m)

if [ "$OS" != "Darwin" ]; then
    echo -e "${RED}✗ 此脚本仅支持 macOS 系统${NC}"
    exit 1
fi

MEM_BYTES=$(sysctl -n hw.memsize 2>/dev/null || echo 0)
MEM_GB=$((MEM_BYTES / 1073741824))

echo -e "  ${GREEN}✓${NC} 操作系统: macOS $(sw_vers -productVersion)"
echo -e "  ${GREEN}✓${NC} 芯片架构: $ARCH"
echo -e "  ${GREEN}✓${NC} 系统内存: ${MEM_GB}GB"

if [ "$ARCH" = "arm64" ]; then
    echo -e "  ${GREEN}✓${NC} Apple Silicon 检测到，GPU 加速可用"
fi
echo ""

# ============================================================
# 检查 Node.js
# ============================================================

echo -e "${CYAN}[2/6]${NC} 检查 Node.js 环境..."

if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "  ${GREEN}✓${NC} Node.js 已安装: $NODE_VERSION"
else
    echo -e "  ${YELLOW}!${NC} Node.js 未安装"
    echo -e "  ${BLUE}→${NC} 正在通过 Homebrew 安装..."
    
    if ! command -v brew &> /dev/null; then
        echo -e "  ${BLUE}→${NC} 先安装 Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    
    brew install node
    echo -e "  ${GREEN}✓${NC} Node.js 安装完成: $(node -v)"
fi

# 检查 pnpm
if command -v pnpm &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} pnpm 已安装: $(pnpm -v)"
else
    echo -e "  ${BLUE}→${NC} 安装 pnpm..."
    npm install -g pnpm
    echo -e "  ${GREEN}✓${NC} pnpm 安装完成"
fi
echo ""

# ============================================================
# 检查 Ollama
# ============================================================

echo -e "${CYAN}[3/6]${NC} 检查 Ollama 环境..."

if command -v ollama &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} Ollama 已安装"
else
    echo -e "  ${YELLOW}!${NC} Ollama 未安装"
    echo ""
    echo -e "  ${BOLD}Ollama 是 SmartFile 的 AI 引擎，需要安装后才能使用智能分析功能。${NC}"
    echo ""
    read -p "  是否现在打开 Ollama 下载页面？(y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "https://ollama.com/download"
        echo -e "  ${BLUE}→${NC} 已打开下载页面，请安装后重新运行此脚本"
        echo -e "  ${BLUE}→${NC} 或者运行: curl -fsSL https://ollama.com/install.sh | sh"
        exit 0
    else
        echo -e "  ${YELLOW}!${NC} 跳过 Ollama 安装"
        echo -e "  ${BLUE}→${NC} 稍后可访问 https://ollama.com 安装"
    fi
fi

# 检查 Ollama 是否运行
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Ollama 服务运行中"
else
    echo -e "  ${YELLOW}!${NC} Ollama 服务未运行"
    if command -v ollama &> /dev/null; then
        echo -e "  ${BLUE}→${NC} 正在启动 Ollama..."
        ollama serve &> /dev/null &
        sleep 3
        if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} Ollama 服务已启动"
        else
            echo -e "  ${YELLOW}!${NC} Ollama 启动失败，请手动打开 Ollama 应用"
        fi
    fi
fi
echo ""

# ============================================================
# 模型推荐与下载
# ============================================================

echo -e "${CYAN}[4/6]${NC} AI 模型配置..."

# 根据内存推荐模型
if [ $MEM_GB -ge 48 ]; then
    RECOMMENDED_TEXT="qwen2.5:32b"
    RECOMMENDED_VISION="qwen2.5vl:7b"
    TIER="顶级"
elif [ $MEM_GB -ge 24 ]; then
    RECOMMENDED_TEXT="qwen2.5:14b"
    RECOMMENDED_VISION="qwen2.5vl:7b"
    TIER="专业级"
elif [ $MEM_GB -ge 16 ]; then
    RECOMMENDED_TEXT="qwen2.5:7b"
    RECOMMENDED_VISION="qwen2.5vl:3b"
    TIER="标准"
elif [ $MEM_GB -ge 8 ]; then
    RECOMMENDED_TEXT="qwen2.5:1.5b"
    RECOMMENDED_VISION="qwen2.5vl:3b"
    TIER="轻量"
else
    RECOMMENDED_TEXT="qwen2.5:0.5b"
    RECOMMENDED_VISION=""
    TIER="最低配置"
fi

echo -e "  ${GREEN}✓${NC} 根据您的 ${MEM_GB}GB 内存，推荐${TIER}配置"
echo ""
echo -e "  推荐的模型配置："
echo -e "  ┌─────────────────────────────────────────────┐"
echo -e "  │ ${BOLD}文本模型:${NC} $RECOMMENDED_TEXT"
if [ -n "$RECOMMENDED_VISION" ]; then
echo -e "  │ ${BOLD}视觉模型:${NC} $RECOMMENDED_VISION"
fi
echo -e "  └─────────────────────────────────────────────┘"
echo ""

if command -v ollama &> /dev/null && curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    read -p "  是否现在下载推荐的模型？首次下载可能需要几分钟 (y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo -e "  ${BLUE}→${NC} 下载文本模型: $RECOMMENDED_TEXT ..."
        ollama pull $RECOMMENDED_TEXT
        echo -e "  ${GREEN}✓${NC} 文本模型下载完成"
        
        if [ -n "$RECOMMENDED_VISION" ]; then
            echo -e "  ${BLUE}→${NC} 下载视觉模型: $RECOMMENDED_VISION ..."
            ollama pull $RECOMMENDED_VISION
            echo -e "  ${GREEN}✓${NC} 视觉模型下载完成"
        fi
    else
        echo -e "  ${YELLOW}!${NC} 跳过模型下载，可在应用「设置」中随时下载"
    fi
else
    echo -e "  ${YELLOW}!${NC} Ollama 未运行，跳过模型下载"
    echo -e "  ${BLUE}→${NC} 启动 Ollama 后，可在应用「设置」中下载模型"
fi
echo ""

# ============================================================
# 安装项目依赖
# ============================================================

echo -e "${CYAN}[5/6]${NC} 安装项目依赖..."

cd "$PROJECT_DIR"
echo -e "  ${BLUE}→${NC} 安装前端依赖..."
pnpm install 2>/dev/null || pnpm install --no-frozen-lockfile
echo -e "  ${GREEN}✓${NC} 前端依赖安装完成"

cd "$PROJECT_DIR/electron"
echo -e "  ${BLUE}→${NC} 安装 Electron 依赖..."
npm install
echo -e "  ${GREEN}✓${NC} Electron 依赖安装完成"

cd "$PROJECT_DIR"
echo ""

# ============================================================
# 完成
# ============================================================

echo -e "${CYAN}[6/6]${NC} 安装完成！"
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║            ✅ SmartFile 安装完成！               ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}🚀 快速启动:${NC}"
echo ""
echo -e "    ${CYAN}开发模式（两个终端）:${NC}"
echo -e "    终端 1: cd $PROJECT_DIR && pnpm run dev"
echo -e "    终端 2: cd $PROJECT_DIR/electron && npm run dev"
echo ""
echo -e "    ${CYAN}构建 macOS 应用:${NC}"
echo -e "    cd $PROJECT_DIR/electron && npm run build:mac"
echo ""
echo -e "  ${BOLD}📦 模型管理:${NC}"
echo -e "    ollama list              # 查看已安装的模型"
echo -e "    ollama pull qwen2.5:7b   # 下载模型"
echo -e "    ollama rm qwen2.5:7b     # 删除模型"
echo ""
echo -e "  ${BOLD}🔗 有用的链接:${NC}"
echo -e "    Ollama:    https://ollama.com"
echo -e "    通义千问:  https://ollama.com/library/qwen2.5"
echo -e "    视觉模型:  https://ollama.com/library/qwen2.5vl"
echo ""
echo -e "  ${BOLD}⚠️  注意:${NC}"
echo -e "    使用前请确保 Ollama 在后台运行（打开 Ollama 应用即可）"
echo ""
