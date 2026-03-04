# SmartFile - 构建命令
# ============================================================

.PHONY: help setup dev build build-mac clean

help: ## 显示帮助信息
	@echo ""
	@echo "  SmartFile 构建命令"
	@echo "  =================================="
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

setup: ## 安装所有依赖
	pnpm install
	cd electron && npm install electron electron-builder --save-dev

dev: ## 启动开发模式（Web + Electron）
	@echo "启动 Web 开发服务器..."
	pnpm run dev &
	@sleep 3
	@echo "启动 Electron..."
	cd electron && NODE_ENV=development npx electron .

dev-web: ## 仅启动 Web 开发服务器
	pnpm run dev

dev-electron: ## 仅启动 Electron（需要先启动 Web 服务器）
	cd electron && NODE_ENV=development npx electron .

build: ## 构建前端
	pnpm run build

build-mac: build ## 构建 macOS 应用 (.dmg)
	cd electron && npx electron-builder --mac --config ../electron-builder.yml

build-win: build ## 构建 Windows 应用 (.exe)
	cd electron && npx electron-builder --win --config ../electron-builder.yml

clean: ## 清理构建产物
	rm -rf dist/ release/ electron/node_modules/

ollama-setup: ## 安装推荐的 Ollama 模型
	@echo "下载通义千问文本模型..."
	ollama pull qwen2.5:7b
	@echo "下载通义千问视觉模型..."
	ollama pull qwen2.5vl:3b
	@echo "模型安装完成！"
